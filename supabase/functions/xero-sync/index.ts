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

// ── Helpers ─────────────────────────────────────────────────────────────────

function pickBestPhone(phones: any[]): string | null {
  if (!phones || phones.length === 0) return null;
  const priority = ["MOBILE", "DEFAULT"];
  for (const pType of priority) {
    const found = phones.find((p: any) => p.PhoneType === pType && p.PhoneNumber);
    if (found) return found.PhoneCountryCode ? `+${found.PhoneCountryCode}${found.PhoneNumber}` : found.PhoneNumber;
  }
  const any = phones.find((p: any) => p.PhoneNumber);
  return any ? (any.PhoneCountryCode ? `+${any.PhoneCountryCode}${any.PhoneNumber}` : any.PhoneNumber) : null;
}

function buildPaidNotificationHtml(params: {
  invoice_number: string;
  client_name: string;
  amount: string;
  user_name: string;
}): string {
  const { invoice_number, client_name, amount, user_name } = params;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
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
    <tr><td style="padding:40px 36px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
        <td style="background-color:#00D4A8;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px;padding:6px 14px;border-radius:20px;text-transform:uppercase;">💰 Payment Received</td>
      </tr></table>
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#18181b;">Great news, ${user_name}! 🎉</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#52525b;">Invoice <strong>${invoice_number}</strong> from <strong>${client_name}</strong> for <strong>${amount}</strong> has been paid.</p>
      <p style="margin:0 0 8px;font-size:14px;color:#52525b;">PayNudge has automatically paused all reminders for this invoice — no further action needed.</p>
    </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:20px 0 0;">
    <p style="margin:0;font-size:12px;color:#a1a1aa;">Sent by PayNudge</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function getUserNotificationPrefs(supabase: any, userId: string): Promise<Record<string, boolean>> {
  const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single();
  if (!data) {
    // Default: all on
    return {
      reminder_sent: true, reminder_failed: true, email_opened: true,
      invoice_paid: true, new_invoice_synced: true, integration_issues: true,
      plan_limits: true, client_no_contact_info: true, reminder_digest: true,
    };
  }
  return data as Record<string, boolean>;
}

async function sendUserEmail(resendKey: string, to: string, subject: string, html: string, text: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "PayNudge <hello@paynudge.co>", to, subject, html, text }),
  });
  if (!res.ok) console.error("User notification email failed:", await res.text());
  return res.ok;
}

async function sendUserSms(phone: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, From: fromPhone, Body: message }),
  });
  if (!res.ok) console.error("User SMS failed:", await res.text());
  return res.ok;
}

// ── Main ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = req.headers.get("x-cron-secret");
  const isCron = cronSecret === Deno.env.get("CRON_SECRET");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Determine auth mode: cron secret OR valid user JWT
  let manualUserId: string | null = null;
  if (!isCron) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }
    manualUserId = claimsData.user.id;
  }

  try {
    let query = supabase.from("organisations").select("*").not("xero_access_token", "is", null);
    if (manualUserId) {
      query = query.eq("user_id", manualUserId);
    }
    const { data: orgs, error } = await query;
    if (error) throw error;
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: "No orgs to sync" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSynced = 0;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    for (const org of orgs) {
      let accessToken = org.xero_access_token;

      // Refresh token if expired
      if (new Date(org.xero_token_expiry) <= new Date()) {
        const clientId = Deno.env.get("XERO_CLIENT_ID")!;
        const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;
        const refreshRes = await fetch("https://identity.xero.com/connect/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          },
          body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: org.xero_refresh_token }),
        });
        const tokens = await refreshRes.json();
        if (!refreshRes.ok) {
          console.error(`Token refresh failed for org ${org.id}:`, tokens);
          // Send integration issues notification
          const { data: failProfile } = await supabase.from("profiles").select("email, full_name").eq("user_id", org.user_id).single();
          const failPrefs = await getUserNotificationPrefs(supabase, org.user_id);
          if (failProfile?.email && failPrefs.integration_issues !== false) {
            const subject = "⚠️ Action required: Xero connection needs reconnecting";
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
        <td style="background-color:#DC2626;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px;padding:6px 14px;border-radius:20px;text-transform:uppercase;">⚠️ Action Required</td>
      </tr></table>
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#18181b;">Hi ${failProfile.full_name || "there"},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#52525b;">Your Xero connection has expired and PayNudge can no longer sync your invoices or send reminders.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#52525b;">Please reconnect Xero in your PayNudge settings to resume automatic invoice syncing and reminders.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <a href="https://paynudge.co/settings" target="_blank" style="display:inline-block;background-color:#00D4A8;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">Reconnect Xero</a>
      </td></tr></table>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:20px 0 0;">
    <p style="margin:0;font-size:12px;color:#a1a1aa;">Sent by PayNudge</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
            const text = `Your Xero connection has expired. Please reconnect Xero in your PayNudge settings to resume invoice syncing and reminders.`;
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from: "PayNudge <hello@paynudge.co>", to: failProfile.email, subject, html, text }),
            });
          }
          await supabase.from("audit_log").insert({
            user_id: org.user_id, organisation_id: org.id,
            action: "Xero token refresh failed",
            detail: "User notified to reconnect",
            level: "error",
          });
          continue;
        }
        accessToken = tokens.access_token;
        await supabase.from("organisations").update({
          xero_access_token: tokens.access_token,
          xero_refresh_token: tokens.refresh_token,
          xero_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq("id", org.id);
      }

      // Get user profile + prefs for notifications
      const { data: profile } = await supabase.from("profiles").select("email, full_name, subscription_status").eq("user_id", org.user_id).single();
      const prefs = await getUserNotificationPrefs(supabase, org.user_id);
      const isPaid = profile && profile.subscription_status !== "free";

      // Paginate through all Xero invoices
      let page = 1;
      let allXeroInvoices: any[] = [];
      while (true) {
        const invoicesRes = await fetch(
          `https://api.xero.com/api.xro/2.0/Invoices?where=Type=="ACCREC"&order=UpdatedDateUTC DESC&page=${page}`,
          { headers: { "Authorization": `Bearer ${accessToken}`, "Xero-Tenant-Id": org.xero_tenant_id, "Accept": "application/json" } }
        );
        if (!invoicesRes.ok) { console.error(`Invoice fetch failed for org ${org.id} page ${page}:`, await invoicesRes.text()); break; }
        const invoiceData = await invoicesRes.json();
        const pageInvoices = invoiceData.Invoices || [];
        if (pageInvoices.length === 0) break;
        allXeroInvoices = allXeroInvoices.concat(pageInvoices);
        page++;
      }

      const paidInvoices: { invoice_number: string; client_name: string; amount: string; currency: string }[] = [];
      let newlySynced = 0;
      const noContactClients: string[] = [];

      for (const xi of allXeroInvoices) {
        const status = xi.Status === "PAID" ? "paid" : xi.Status === "VOIDED" ? "voided" :
          xi.Status === "DRAFT" ? "draft" :
          (xi.DueDateString && new Date(xi.DueDateString) < new Date()) ? "overdue" : "sent";

        // ── Upsert client with proper contact mapping ──
        let clientId = null;
        if (xi.Contact) {
          // Invoices endpoint returns summary contact — fetch full contact for email/phone
          let clientEmail = xi.Contact.EmailAddress || null;
          let clientPhone = pickBestPhone(xi.Contact.Phones || []);

          if (!clientEmail && !clientPhone && xi.Contact.ContactID) {
            try {
              const contactRes = await fetch(
                `https://api.xero.com/api.xro/2.0/Contacts/${xi.Contact.ContactID}`,
                { headers: { "Authorization": `Bearer ${accessToken}`, "Xero-Tenant-Id": org.xero_tenant_id, "Accept": "application/json" } }
              );
              if (contactRes.ok) {
                const contactData = await contactRes.json();
                const fullContact = contactData.Contacts?.[0];
                if (fullContact) {
                  clientEmail = fullContact.EmailAddress || null;
                  clientPhone = pickBestPhone(fullContact.Phones || []);
                }
              }
            } catch (e) {
              console.error(`Failed to fetch full contact ${xi.Contact.ContactID}:`, e);
            }
          }

          const { data: existingClient } = await supabase
            .from("clients").select("id").eq("organisation_id", org.id).eq("name", xi.Contact.Name).single();

          if (existingClient) {
            clientId = existingClient.id;
            // Always update contact info from Xero
            await supabase.from("clients").update({ email: clientEmail, phone: clientPhone }).eq("id", existingClient.id);
          } else {
            const { data: newClient } = await supabase
              .from("clients").insert({ organisation_id: org.id, name: xi.Contact.Name, email: clientEmail, phone: clientPhone })
              .select("id").single();
            clientId = newClient?.id;
          }

          // Warn if client has no contact info (deduplicated: only once per 24h per client)
          if (!clientEmail && !clientPhone) {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentWarning } = await supabase.from("audit_log")
              .select("id")
              .eq("organisation_id", org.id)
              .eq("action", "Client missing contact info")
              .like("detail", `${xi.Contact.Name}%`)
              .gte("created_at", since)
              .limit(1);

            if (!recentWarning || recentWarning.length === 0) {
              noContactClients.push(xi.Contact.Name);
              await supabase.from("audit_log").insert({
                user_id: org.user_id, organisation_id: org.id,
                action: "Client missing contact info",
                detail: `${xi.Contact.Name} has no email or phone — cannot receive reminders`,
                level: "warning",
              });
            }
          }
        }

        // ── Upsert invoice & detect paid transition ──
        const { data: existing } = await supabase
          .from("invoices").select("id, status").eq("xero_invoice_id", xi.InvoiceID).eq("organisation_id", org.id).single();

        if (existing) {
          const wasPaid = existing.status === "paid";
          await supabase.from("invoices").update({
            status, amount: xi.Total || 0, client_id: clientId,
            invoice_number: xi.InvoiceNumber, due_date: xi.DueDateString || null,
            issue_date: xi.DateString || null, currency: xi.CurrencyCode || "GBP",
          }).eq("id", existing.id);

          // Invoice just got paid
          if (status === "paid" && !wasPaid) {
            const clientName = xi.Contact?.Name || "Unknown";
            const amt = formatCurrency(Number(xi.Total || 0), xi.CurrencyCode || "GBP");
            paidInvoices.push({ invoice_number: xi.InvoiceNumber, client_name: clientName, amount: amt, currency: xi.CurrencyCode || "GBP" });

            // Instant paid email notification
            if (profile?.email && prefs.invoice_paid !== false) {
              const subject = `Invoice ${xi.InvoiceNumber} has been paid — ${amt}`;
              const html = buildPaidNotificationHtml({
                invoice_number: xi.InvoiceNumber || "",
                client_name: clientName,
                amount: amt,
                user_name: profile.full_name || "there",
              });
              const text = `Great news! Invoice ${xi.InvoiceNumber} from ${clientName} for ${amt} has been paid. PayNudge has automatically paused reminders for this invoice.`;
              await sendUserEmail(resendKey, profile.email, subject, html, text);
            }

            // SMS notification for paid plans
            if (isPaid && profile?.email) {
              // Get user's phone — for now we use the org user. If they have a phone we'll SMS.
              // We don't have a phone on profiles, so SMS to paid users requires further setup.
              // For now, log it.
              await supabase.from("audit_log").insert({
                user_id: org.user_id, organisation_id: org.id,
                action: "Invoice paid",
                detail: `${xi.InvoiceNumber} from ${clientName} — ${amt}`,
                level: "info",
              });
            }
          }
        } else {
          await supabase.from("invoices").insert({
            organisation_id: org.id, xero_invoice_id: xi.InvoiceID, client_id: clientId,
            invoice_number: xi.InvoiceNumber, amount: xi.Total || 0,
            currency: xi.CurrencyCode || "GBP", issue_date: xi.DateString || null,
            due_date: xi.DueDateString || null, status,
          });
          totalSynced++;
          newlySynced++;
        }
      }

      // ── User notification: new invoices synced ──
      if (newlySynced > 0 && profile?.email && prefs.new_invoice_synced !== false) {
        const subject = `${newlySynced} new invoice${newlySynced > 1 ? "s" : ""} synced from Xero`;
        const text = `PayNudge synced ${newlySynced} new invoice${newlySynced > 1 ? "s" : ""} from your Xero account.`;
        await sendUserEmail(resendKey, profile.email, subject, `<p>${text}</p>`, text);
      }

      // ── User notification: clients with no contact info ──
      if (noContactClients.length > 0 && profile?.email && prefs.client_no_contact_info !== false) {
        const names = noContactClients.join(", ");
        const subject = `${noContactClients.length} client${noContactClients.length > 1 ? "s" : ""} missing contact info`;
        const text = `The following clients have no email or phone on file and cannot receive reminders: ${names}`;
        await sendUserEmail(resendKey, profile.email, subject, `<p>${text}</p>`, text);
      }

      // Audit log
      await supabase.from("audit_log").insert({
        user_id: org.user_id, organisation_id: org.id,
        action: "Xero sync completed",
        detail: `${allXeroInvoices.length} invoices processed, ${newlySynced} new, ${paidInvoices.length} paid`,
        level: "info",
      });
    }

    return new Response(JSON.stringify({ success: true, synced: totalSynced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
