import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");

  if (!code || !stateToken) {
    return new Response("Missing code or state", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Validate CSRF state token
    const { data: stateRecord, error: stateError } = await supabase
      .from("gmail_oauth_states")
      .select("user_id, created_at")
      .eq("state_token", stateToken)
      .single();

    if (stateError || !stateRecord) {
      return new Response("Invalid or expired state token", { status: 400 });
    }

    // Check token is not older than 10 minutes
    const tokenAge = Date.now() - new Date(stateRecord.created_at).getTime();
    if (tokenAge > 10 * 60 * 1000) {
      await supabase.from("gmail_oauth_states").delete().eq("state_token", stateToken);
      return new Response("State token expired", { status: 400 });
    }

    const userId = stateRecord.user_id;

    // Delete used state token
    await supabase.from("gmail_oauth_states").delete().eq("state_token", stateToken);

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const appUrl = Deno.env.get("APP_URL") || "https://paynudge.co";
    const redirectUri = `${appUrl}/auth/gmail/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || tokens.error || "Token exchange failed");

    // Get user's Gmail address
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { "Authorization": `Bearer ${tokens.access_token}` },
    });
    const userinfo = await userinfoRes.json();
    const gmailEmail = userinfo.email;

    if (!gmailEmail) throw new Error("Could not retrieve Gmail address");

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update organisation with Gmail tokens
    const { data: existingOrg } = await supabase
      .from("organisations")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingOrg) {
      await supabase.from("organisations").update({
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: tokenExpiry,
        gmail_email: gmailEmail,
      }).eq("id", existingOrg.id);
    } else {
      await supabase.from("organisations").insert({
        user_id: userId,
        company_name: "My Organisation",
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: tokenExpiry,
        gmail_email: gmailEmail,
      });
    }

    // Log audit
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "Gmail connected",
      detail: `Email: ${gmailEmail}`,
      level: "success",
    });

    // Redirect back to integrations page
    return new Response(null, {
      status: 302,
      headers: { "Location": `${appUrl}/integrations?gmail=connected` },
    });
  } catch (error) {
    console.error("Gmail callback error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
