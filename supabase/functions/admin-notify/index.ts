import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const ADMIN_EMAIL = "mrttburns@gmail.com";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  try {
    const payload = await req.json();
    const eventType = payload.type as string;

    let subject = "";
    let html = "";

    if (eventType === "new_signup") {
      const { email, full_name } = payload;
      subject = `🎉 New signup: ${email}`;
      html = `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:500px;padding:32px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
            <div style="width:16px;height:16px;background:#00D4A8;border-radius:3px;"></div>
            <strong style="font-size:18px;">PayNudge</strong>
          </div>
          <h2 style="margin:0 0 12px;font-size:20px;">New User Signed Up 🎉</h2>
          <table style="font-size:14px;color:#555;line-height:1.8;">
            <tr><td style="padding-right:16px;font-weight:bold;">Name</td><td>${full_name || "—"}</td></tr>
            <tr><td style="padding-right:16px;font-weight:bold;">Email</td><td>${email}</td></tr>
            <tr><td style="padding-right:16px;font-weight:bold;">Time</td><td>${new Date().toUTCString()}</td></tr>
          </table>
        </div>
      `;
    } else if (eventType === "upgrade_to_paid") {
      const { email, full_name, plan } = payload;
      subject = `💰 New paid upgrade: ${email}`;
      html = `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:500px;padding:32px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
            <div style="width:16px;height:16px;background:#00D4A8;border-radius:3px;"></div>
            <strong style="font-size:18px;">PayNudge</strong>
          </div>
          <h2 style="margin:0 0 12px;font-size:20px;">New Paid Upgrade 💰</h2>
          <table style="font-size:14px;color:#555;line-height:1.8;">
            <tr><td style="padding-right:16px;font-weight:bold;">Name</td><td>${full_name || "—"}</td></tr>
            <tr><td style="padding-right:16px;font-weight:bold;">Email</td><td>${email}</td></tr>
            <tr><td style="padding-right:16px;font-weight:bold;">Plan</td><td>${plan || "Paid"}</td></tr>
            <tr><td style="padding-right:16px;font-weight:bold;">Time</td><td>${new Date().toUTCString()}</td></tr>
          </table>
        </div>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Unknown event type" }), { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "PayNudge <hello@paynudge.co>",
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    console.log(`Admin notification sent: ${eventType}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Admin notify error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
