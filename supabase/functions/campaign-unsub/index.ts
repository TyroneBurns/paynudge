import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const url = new URL(req.url);
  const contactId = url.searchParams.get("contact_id");
  const email = url.searchParams.get("email");

  if (!contactId || !email) {
    return new Response(renderPage("Invalid unsubscribe link."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Get the campaign_id from the contact
    const { data: contact } = await supabase
      .from("campaign_contacts")
      .select("campaign_id")
      .eq("id", contactId)
      .single();

    // Insert into unsubscribes (upsert on email)
    await supabase.from("unsubscribes").upsert(
      {
        email: decodeURIComponent(email),
        campaign_id: contact?.campaign_id || null,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    // Update contact status
    await supabase.from("campaign_contacts")
      .update({ status: "unsubscribed" })
      .eq("id", contactId);

    // Update campaign unsub count
    if (contact?.campaign_id) {
      const { count } = await supabase
        .from("campaign_contacts")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", contact.campaign_id)
        .eq("status", "unsubscribed");

      await supabase.from("campaigns")
        .update({ unsub_count: count || 0 })
        .eq("id", contact.campaign_id);
    }

    return new Response(renderPage("You have been unsubscribed. You will not receive further emails from us."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Unsubscribe error:", err);
    return new Response(renderPage("Something went wrong. Please try again or contact us."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }
});

function renderPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayNudge — Unsubscribe</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0b0f;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 48px 24px;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 20px;
      margin-bottom: 32px;
      color: #fff;
    }
    .logo-dot {
      width: 16px;
      height: 16px;
      background: #00D4A8;
      border-radius: 3px;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #aaa;
      margin-bottom: 24px;
    }
    .check {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(0, 212, 168, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-dot"></div>
      PayNudge
    </div>
    <div class="check">✓</div>
    <p class="message">${message}</p>
  </div>
</body>
</html>`;
}
