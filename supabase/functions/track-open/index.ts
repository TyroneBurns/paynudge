import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// 1x1 transparent GIF
const PIXEL = new Uint8Array([
  0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,0x80,0x00,0x00,
  0xff,0xff,0xff,0x00,0x00,0x00,0x21,0xf9,0x04,0x01,0x00,0x00,0x00,
  0x00,0x2c,0x00,0x00,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,
  0x44,0x01,0x00,0x3b,
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const url = new URL(req.url);
  const reminderId = url.searchParams.get("reminder_id");

  if (!reminderId) {
    return new Response(PIXEL, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Check if already opened
    const { data: reminder } = await supabase
      .from("reminders")
      .select("id, opened_at, invoice_id")
      .eq("id", reminderId)
      .single();

    if (reminder && !reminder.opened_at) {
      // Mark as opened
      await supabase.from("reminders").update({ opened_at: new Date().toISOString() }).eq("id", reminderId);

      // Get invoice + org + client info for notification
      const { data: inv } = await supabase
        .from("invoices")
        .select("invoice_number, organisation_id, client_id, clients(name)")
        .eq("id", reminder.invoice_id)
        .single();

      if (inv) {
        const { data: org } = await supabase.from("organisations").select("user_id").eq("id", inv.organisation_id).single();
        if (org) {
          const { data: prefs } = await supabase.from("notification_preferences").select("email_opened").eq("user_id", org.user_id).single();
          const shouldNotify = !prefs || prefs.email_opened !== false;

          if (shouldNotify) {
            const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("user_id", org.user_id).single();
            if (profile?.email) {
              const clientName = (inv.clients as any)?.name || "Unknown";
              const resendKey = Deno.env.get("RESEND_API_KEY");
              if (resendKey) {
                const subject = `👁️ ${clientName} opened your reminder for ${inv.invoice_number}`;
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td align="center" style="padding-bottom:24px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background-color:#00D4A8;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;font-size:18px;font-weight:bold;color:#fff;" align="center">P</td>
      <td style="padding-left:10px;font-size:20px;font-weight:700;color:#18181b;">PayNudge</td>
    </tr></table>
  </td></tr>
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr><td style="padding:36px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
        <td style="background-color:#3B82F6;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px;padding:6px 14px;border-radius:20px;text-transform:uppercase;">👁️ Email Opened</td>
      </tr></table>
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#18181b;">Hi ${profile.full_name || "there"},</p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#52525b;"><strong>${clientName}</strong> just opened the reminder email for invoice <strong>${inv.invoice_number}</strong>.</p>
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Note: Email open tracking relies on image loading and may not be 100% accurate.</p>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:20px 0 0;">
    <p style="margin:0;font-size:12px;color:#a1a1aa;">Sent by PayNudge · <a href="https://paynudge.co/settings" style="color:#00D4A8;text-decoration:none;">Manage preferences</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
                const text = `${clientName} opened the reminder email for invoice ${inv.invoice_number}.`;
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ from: "PayNudge <hello@paynudge.co>", to: profile.email, subject, html, text }),
                });
              }
            }
          }

          // Audit log
          await supabase.from("audit_log").insert({
            user_id: org.user_id, organisation_id: inv.organisation_id,
            action: "Email opened",
            detail: `${(inv.clients as any)?.name || "Unknown"} opened reminder for ${inv.invoice_number}`,
            level: "info",
          });
        }
      }
    }
  } catch (err) {
    console.error("Track-open error:", err);
  }

  return new Response(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
});
