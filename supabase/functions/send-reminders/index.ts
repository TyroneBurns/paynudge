import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(amount);
  } catch {
    return `${currency}${amount.toFixed(2)}`;
  }
}

// ── HTML email builder (client-facing) ──────────────────────────────────────

function buildEmailHtml(params: {
  client_name: string; invoice_number: string; amount: string;
  due_date: string; payment_url: string; sender_name: string; days_overdue: number;
  logo_url?: string; reminder_id?: string;
}): string {
  const { client_name, invoice_number, amount, due_date, payment_url, sender_name, days_overdue, logo_url, reminder_id } = params;
  const statusColor = days_overdue >= 14 ? "#DC2626" : days_overdue >= 7 ? "#D97706" : "#00D4A8";
  const statusText = days_overdue === 0 ? "Due Today" : `${days_overdue} Days Overdue`;
  const bodyMessage = days_overdue === 0
    ? "This is a friendly reminder that the following invoice is due today."
    : days_overdue <= 7
    ? "We wanted to follow up — the invoice below is now overdue. If you've already arranged payment, please disregard this message."
    : days_overdue <= 14
    ? "We haven't received payment for the invoice below. Please arrange payment as soon as possible."
    : "This is a final notice. The invoice below requires immediate attention.";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td align="center" style="padding-bottom:24px;">
    ${logo_url
      ? `<img src="${logo_url}" alt="${sender_name}" style="max-height:60px;max-width:220px;object-fit:contain;display:block;margin:0 auto;" />`
      : `<span style="font-size:20px;font-weight:800;color:#0D0F14;">${sender_name}</span>`
    }
  </td></tr>
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr><td style="padding:40px 36px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
        <td style="background-color:${statusColor};color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px;padding:6px 14px;border-radius:20px;text-transform:uppercase;">${statusText}</td>
      </tr></table>
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#18181b;">Hi ${client_name},</p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#52525b;">${bodyMessage}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td colspan="2" style="padding-bottom:14px;border-bottom:1px solid #e4e4e7;"><p style="margin:0;font-size:13px;font-weight:700;color:#18181b;text-transform:uppercase;letter-spacing:0.5px;">Invoice Details</p></td></tr>
          <tr><td style="padding:12px 0 8px;font-size:14px;color:#71717a;">Invoice number</td><td align="right" style="padding:12px 0 8px;font-size:14px;font-weight:600;color:#18181b;">${invoice_number}</td></tr>
          <tr><td style="padding:8px 0;font-size:14px;color:#71717a;">Due date</td><td align="right" style="padding:8px 0;font-size:14px;font-weight:600;color:#18181b;">${due_date}</td></tr>
          <tr><td style="padding:8px 0 0;font-size:14px;color:#71717a;">Amount due</td><td align="right" style="padding:8px 0 0;font-size:16px;font-weight:700;color:#18181b;">${amount}</td></tr>
        </table>
      </td></tr></table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center">
        <a href="${payment_url}" target="_blank" style="display:inline-block;background-color:#00D4A8;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">Pay Now</a>
      </td></tr></table>
      <p style="margin:0 0 6px;font-size:13px;color:#a1a1aa;">If you have already paid, please ignore this message.</p>
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Questions? Reply to this email or contact <a href="mailto:support@paynudge.co" style="color:#00D4A8;text-decoration:none;">support@paynudge.co</a></p>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:24px 0 0;">
    <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">Sent via PayNudge on behalf of ${sender_name}</p>
    <p style="margin:0;font-size:12px;color:#a1a1aa;"><a href="https://paynudge.co/privacy" style="color:#a1a1aa;text-decoration:underline;">Privacy Policy</a> · <a href="https://paynudge.co/terms" style="color:#a1a1aa;text-decoration:underline;">Terms</a></p>
  </td></tr>
</table>
</td></tr></table>
${reminder_id ? `<img src="https://muwppwiiearrnrlovcwu.supabase.co/functions/v1/track-open?reminder_id=${reminder_id}" width="1" height="1" style="display:block;" alt="" />` : ""}
</body></html>`;
}

// ── Daily digest HTML (user-facing) ─────────────────────────────────────────

function buildDigestHtml(params: {
  user_name: string;
  sentList: { client: string; invoice: string; method: string }[];
  failedList: { client: string; invoice: string; reason: string }[];
  noContactList: string[];
}): string {
  const { user_name, sentList, failedList, noContactList } = params;

  let sections = "";

  if (sentList.length > 0) {
    const rows = sentList.map(s => `<tr><td style="padding:8px 12px;font-size:14px;color:#18181b;">${s.client}</td><td style="padding:8px 12px;font-size:14px;color:#52525b;">${s.invoice}</td><td style="padding:8px 12px;font-size:14px;color:#52525b;">${s.method.toUpperCase()}</td></tr>`).join("");
    sections += `<p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#18181b;">✅ Reminders Sent (${sentList.length})</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;">Client</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;">Invoice</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;">Method</th></tr>
      ${rows}
    </table>`;
  }

  if (failedList.length > 0) {
    const rows = failedList.map(f => `<tr><td style="padding:8px 12px;font-size:14px;color:#18181b;">${f.client}</td><td style="padding:8px 12px;font-size:14px;color:#52525b;">${f.invoice}</td><td style="padding:8px 12px;font-size:14px;color:#DC2626;">${f.reason}</td></tr>`).join("");
    sections += `<p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#DC2626;">❌ Failed (${failedList.length})</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;">Client</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;">Invoice</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;">Reason</th></tr>
      ${rows}
    </table>`;
  }

  if (noContactList.length > 0) {
    sections += `<p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#D97706;">⚠️ Clients with no contact info (${noContactList.length})</p>
    <p style="font-size:14px;color:#52525b;">${noContactList.join(", ")}</p>`;
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
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
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#18181b;">Reminder Digest for ${user_name}</p>
      <p style="margin:0 0 20px;font-size:15px;color:#52525b;">Here's a summary of today's reminder activity:</p>
      ${sections}
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:20px 0 0;">
    <p style="margin:0;font-size:12px;color:#a1a1aa;">Sent by PayNudge · <a href="https://paynudge.co/settings" style="color:#00D4A8;text-decoration:none;">Manage notification preferences</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── Notification preferences helper ─────────────────────────────────────────

async function getUserNotificationPrefs(supabase: any, userId: string): Promise<Record<string, boolean>> {
  const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single();
  if (!data) {
    return { reminder_sent: true, reminder_failed: true, email_opened: true, invoice_paid: true, new_invoice_synced: true, integration_issues: true, plan_limits: true, client_no_contact_info: true, reminder_digest: true };
  }
  return data as Record<string, boolean>;
}

// ── Gmail helpers ───────────────────────────────────────────────────────────

async function refreshGmailToken(supabase: any, org: any): Promise<string | null> {
  if (!org.gmail_refresh_token) return null;
  const now = Date.now();
  const expiry = org.gmail_token_expiry ? new Date(org.gmail_token_expiry).getTime() : 0;
  if (org.gmail_access_token && expiry > now + 5 * 60 * 1000) return org.gmail_access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token", refresh_token: org.gmail_refresh_token,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!, client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    }),
  });
  const tokens = await res.json();
  if (!res.ok) { console.error("Gmail token refresh failed:", tokens); return null; }

  const newExpiry = new Date(now + tokens.expires_in * 1000).toISOString();
  await supabase.from("organisations").update({
    gmail_access_token: tokens.access_token, gmail_token_expiry: newExpiry,
    ...(tokens.refresh_token ? { gmail_refresh_token: tokens.refresh_token } : {}),
  }).eq("id", org.id);
  return tokens.access_token;
}

async function sendViaGmail(accessToken: string, from: string, to: string, subject: string, body: string): Promise<boolean> {
  const email = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, `Content-Type: text/plain; charset=UTF-8`, ``, body].join("\r\n");
  const raw = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) { console.error("Gmail send failed:", await res.text()); return false; }
  return true;
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
  const resendKey = Deno.env.get("RESEND_API_KEY")!;

  try {
    const { data: orgs } = await supabase.from("organisations").select("*");
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: "No orgs" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let remindersSent = 0;

    for (const org of orgs) {
      // Fetch profile + notification preferences
      const { data: profile } = await supabase.from("profiles").select("email, full_name, subscription_status").eq("user_id", org.user_id).single();
      const isFree = !profile || profile.subscription_status === "free";
      const prefs = await getUserNotificationPrefs(supabase, org.user_id);

      // Digest tracking for this org
      const digestSent: { client: string; invoice: string; method: string }[] = [];
      const digestFailed: { client: string; invoice: string; reason: string }[] = [];
      const digestNoContact: string[] = [];

      let { data: rules } = await supabase.from("reminder_rules").select("*").eq("organisation_id", org.id).eq("is_active", true).order("days_after_due", { ascending: true });
      if (!rules || rules.length === 0) {
        rules = [
          { days_after_due: 1, method: "email", message_template: "Hi {client_name}, just a quick reminder that invoice {invoice_number} for {amount} is overdue. You can pay here: {payment_url}" },
          { days_after_due: 7, method: "email", message_template: "Hi {client_name}, invoice {invoice_number} for {amount} is now 7 days overdue. Please arrange payment at your earliest convenience. {payment_url}" },
          { days_after_due: 14, method: "sms", message_template: "Hi {client_name}, invoice {invoice_number} for {amount} is 14 days overdue. Pay here: {payment_url}" },
        ];
      }

      let gmailAccessToken: string | null = null;
      if (org.gmail_access_token) gmailAccessToken = await refreshGmailToken(supabase, org);

      const { data: invoices } = await supabase.from("invoices").select("*, clients(*)").eq("organisation_id", org.id).in("status", ["sent", "overdue"]).not("due_date", "is", null);
      if (!invoices) continue;

      for (const inv of invoices) {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue < 1) continue;
        if (inv.clients?.reminders_paused) continue;

        const { data: recentReminders } = await supabase.from("reminders").select("id").eq("invoice_id", inv.id).gte("sent_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());
        if (recentReminders && recentReminders.length > 0) continue;

        const { data: existingReminders } = await supabase.from("reminders").select("reminder_number").eq("invoice_id", inv.id);
        const sentNumbers = new Set((existingReminders || []).map((r: any) => r.reminder_number));

        for (let ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
          const rule = rules[ruleIdx];
          if (daysOverdue < rule.days_after_due) continue;
          if (sentNumbers.has(ruleIdx + 1)) continue;
          if (isFree && rule.method === "sms") continue;

          const client = inv.clients;
          if (!client) continue;

          // Check if client has contact info for this method
          if (rule.method === "email" && !client.email) {
            if (!digestNoContact.includes(client.name)) digestNoContact.push(client.name);
            digestFailed.push({ client: client.name, invoice: inv.invoice_number || "", reason: "No email on file" });
            continue;
          }
          if (rule.method === "sms" && !client.phone) {
            if (!digestNoContact.includes(client.name)) digestNoContact.push(client.name);
            digestFailed.push({ client: client.name, invoice: inv.invoice_number || "", reason: "No phone on file" });
            continue;
          }

          const message = rule.message_template
            .replace("{client_name}", client.name || "")
            .replace("{invoice_number}", inv.invoice_number || "")
            .replace("{amount}", formatCurrency(Number(inv.amount), inv.currency))
            .replace("{payment_url}", inv.payment_url || "");

          let sendSuccess = false;

          // Pre-insert reminder to get ID for tracking pixel
          const { data: insertedReminder } = await supabase.from("reminders").insert({
            invoice_id: inv.id, reminder_number: ruleIdx + 1, method: rule.method,
            status: "pending",
          }).select("id").single();
          const reminderId = insertedReminder?.id;

          try {
            if (rule.method === "sms" && client.phone) {
              const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
              const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
              const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")!;
              const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                method: "POST",
                headers: { "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ To: client.phone, From: fromPhone, Body: message }),
              });
              sendSuccess = res.ok;
              if (!res.ok) console.error(`Twilio SMS failed for ${client.name}:`, await res.text());
            } else if (rule.method === "email" && client.email) {
              const subject = (rule.subject_line || `Payment reminder: Invoice ${inv.invoice_number}`)
                .replace("{client_name}", client.name || "")
                .replace("{invoice_number}", inv.invoice_number || "")
                .replace("{amount}", formatCurrency(Number(inv.amount), inv.currency))
                .replace("{due_date}", inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "")
                .replace("{payment_url}", inv.payment_url || "");
              if (gmailAccessToken) {
                const fromAddr = org.gmail_email || "hello@paynudge.co";
                sendSuccess = await sendViaGmail(gmailAccessToken, fromAddr, client.email, subject, message);
              } else {
                const html = buildEmailHtml({
                  client_name: client.name || "there", invoice_number: inv.invoice_number || "",
                  amount: formatCurrency(Number(inv.amount), inv.currency),
                  due_date: inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "",
                  payment_url: inv.payment_url || "https://paynudge.co",
                  sender_name: org.company_name || "Your supplier", days_overdue: daysOverdue,
                  logo_url: org.logo_url || undefined,
                  reminder_id: reminderId || undefined,
                });
                const res = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ from: "PayNudge <reminders@paynudge.co>", to: client.email, subject, html, text: message }),
                });
                sendSuccess = res.ok;
                if (!res.ok) console.error(`Resend email failed for ${client.name}:`, await res.text());
              }
            }
          } catch (err) {
            console.error(`Send error for ${client.name}:`, err);
            sendSuccess = false;
          }

          // Update reminder status
          if (reminderId) {
            await supabase.from("reminders").update({ status: sendSuccess ? "sent" : "failed" }).eq("id", reminderId);
          }

          // Track for digest
          if (sendSuccess) {
            digestSent.push({ client: client.name, invoice: inv.invoice_number || "", method: rule.method });
          } else {
            digestFailed.push({ client: client.name, invoice: inv.invoice_number || "", reason: "Send failed" });
          }

          await supabase.from("audit_log").insert({
            user_id: org.user_id, organisation_id: org.id,
            action: sendSuccess ? "Reminder sent" : "Reminder failed",
            detail: `${rule.method.toUpperCase()}${gmailAccessToken && rule.method === "email" ? " (Gmail)" : ""} to ${client.name} — ${inv.invoice_number}`,
            level: sendSuccess ? "info" : "warning",
          });

          if (sendSuccess) remindersSent++;

          // Instant user notifications per reminder
          if (sendSuccess && profile?.email && prefs.reminder_sent !== false) {
            // Covered by digest — skip individual emails to avoid spam
          }
          if (!sendSuccess && profile?.email && prefs.reminder_failed !== false) {
            const subject = `⚠️ Reminder failed: ${inv.invoice_number} to ${client.name}`;
            const text = `PayNudge could not send a ${rule.method} reminder for invoice ${inv.invoice_number} to ${client.name}. Please check their contact details.`;
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from: "PayNudge <hello@paynudge.co>", to: profile.email, subject, text, html: `<p>${text}</p>` }),
            });
          }
        }
      }

      // ── Daily digest email ──
      const hasActivity = digestSent.length > 0 || digestFailed.length > 0 || digestNoContact.length > 0;
      if (hasActivity && profile?.email && prefs.reminder_digest !== false) {
        const digestHtml = buildDigestHtml({
          user_name: profile.full_name || "there",
          sentList: digestSent,
          failedList: digestFailed,
          noContactList: digestNoContact,
        });
        const digestText = `Reminder digest: ${digestSent.length} sent, ${digestFailed.length} failed, ${digestNoContact.length} clients with no contact info.`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "PayNudge <hello@paynudge.co>", to: profile.email,
            subject: `Reminder Digest — ${digestSent.length} sent, ${digestFailed.length} issues`,
            html: digestHtml, text: digestText,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, reminders_sent: remindersSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reminder engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
