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
      .from("xero_oauth_states")
      .select("user_id, created_at")
      .eq("state_token", stateToken)
      .single();

    if (stateError || !stateRecord) {
      return new Response("Invalid or expired state token", { status: 400 });
    }

    // Check token is not older than 10 minutes
    const tokenAge = Date.now() - new Date(stateRecord.created_at).getTime();
    if (tokenAge > 10 * 60 * 1000) {
      await supabase.from("xero_oauth_states").delete().eq("state_token", stateToken);
      return new Response("State token expired", { status: 400 });
    }

    const userId = stateRecord.user_id;

    // Delete used state token
    await supabase.from("xero_oauth_states").delete().eq("state_token", stateToken);

    const clientId = Deno.env.get("XERO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;
    const appUrl = Deno.env.get("APP_URL") || "https://paynudge.co";
    const redirectUri = `${appUrl}/auth/xero/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error || "Token exchange failed");

    // Get tenant connections
    const connectionsRes = await fetch("https://api.xero.com/connections", {
      headers: { "Authorization": `Bearer ${tokens.access_token}` },
    });
    const connections = await connectionsRes.json();
    const tenantId = connections[0]?.tenantId;

    if (!tenantId) throw new Error("No Xero tenant found");

    // Check if org exists for this user
    const { data: existingOrg } = await supabase
      .from("organisations")
      .select("id")
      .eq("user_id", userId)
      .single();

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    if (existingOrg) {
      await supabase.from("organisations").update({
        xero_tenant_id: tenantId,
        xero_access_token: tokens.access_token,
        xero_refresh_token: tokens.refresh_token,
        xero_token_expiry: tokenExpiry,
      }).eq("id", existingOrg.id);
    } else {
      const { data: newOrg } = await supabase.from("organisations").insert({
        user_id: userId,
        company_name: connections[0]?.tenantName || "My Organisation",
        xero_tenant_id: tenantId,
        xero_access_token: tokens.access_token,
        xero_refresh_token: tokens.refresh_token,
        xero_token_expiry: tokenExpiry,
      }).select("id").single();

      // Seed default reminder rules for new organisation
      if (newOrg) {
        await supabase.from("reminder_rules").insert([
          {
            organisation_id: newOrg.id,
            days_after_due: 0,
            method: "email",
            subject_line: "Invoice {invoice_number} is due today",
            message_template: "Hi {client_name}, just a friendly reminder that invoice {invoice_number} for {amount} is due today. If you've already arranged payment please ignore this message. Pay online: {payment_url}",
            is_active: true,
          },
          {
            organisation_id: newOrg.id,
            days_after_due: 3,
            method: "email",
            subject_line: "Invoice {invoice_number} — payment overdue",
            message_template: "Hi {client_name}, invoice {invoice_number} for {amount} was due on {due_date} and we haven't received payment yet. If there's an issue please reply to this email. Pay online: {payment_url}",
            is_active: true,
          },
          {
            organisation_id: newOrg.id,
            days_after_due: 7,
            method: "email",
            subject_line: "Reminder: Invoice {invoice_number} now 7 days overdue",
            message_template: "Hi {client_name}, invoice {invoice_number} for {amount} due on {due_date} is now 7 days overdue. Please arrange payment as soon as possible. Pay here: {payment_url}",
            is_active: true,
          },
          {
            organisation_id: newOrg.id,
            days_after_due: 14,
            method: "email",
            subject_line: "Final notice: Invoice {invoice_number}",
            message_template: "Hi {client_name}, invoice {invoice_number} for {amount} is now 14 days overdue. This is a final notice before we consider further action. If you have already paid please send remittance to support@paynudge.co. Pay immediately: {payment_url}",
            is_active: true,
          },
        ]);
      }
    }

    // Log audit
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "Xero connected",
      detail: `Tenant: ${connections[0]?.tenantName || tenantId}`,
      level: "success",
    });

    // Redirect back to dashboard
    return new Response(null, {
      status: 302,
      headers: { "Location": `${appUrl}/dashboard?xero=connected` },
    });
  } catch (error) {
    console.error("Xero callback error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
