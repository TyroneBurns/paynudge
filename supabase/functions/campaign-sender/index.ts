import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept calls authenticated with the service role key (pg_cron)
  // OR a valid admin JWT (manual trigger from admin UI)
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  let authorized = false;

  if (token && token === serviceRoleKey) {
    // Called with the service role key
    authorized = true;
  } else if (token) {
    // Try to decode JWT and check if it's the anon key for this project (cron) or an admin user
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.ref === "muwppwiiearrnrlovcwu" && payload.role === "anon") {
        // Valid anon key JWT for this project — scheduled cron call
        authorized = true;
      }
    } catch (_) {
      // Not a valid JWT, fall through to admin check
    }

    if (!authorized) {
      // Check for admin JWT
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        const { data: roleData } = await supabaseAuth
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        if (roleData) authorized = true;
      }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const BATCH_SIZE = 25;
  const SEND_DELAY_MS = 600;
  const LOCK_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Get all active campaigns
    const { data: campaigns, error: campErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "active");

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ message: "No active campaigns" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get all unsubscribed emails
    const { data: unsubs } = await supabase.from("unsubscribes").select("email");
    const unsubEmails = new Set((unsubs || []).map(u => u.email.toLowerCase()));

    // Get all registered user emails
    const { data: profiles } = await supabase.from("profiles").select("email");
    const registeredEmails = new Set((profiles || []).map(p => p.email.toLowerCase()));

    let totalSent = 0;
    let totalBounced = 0;

    for (const campaign of campaigns) {
      // ── RACE CONDITION GUARD ──
      const fiveMinutesAgo = new Date(Date.now() - LOCK_WINDOW_MS).toISOString();

      if (campaign.last_batch_at && campaign.last_batch_at > fiveMinutesAgo) {
        console.log(`[campaign-sender] Campaign ${campaign.id} recently processed at ${campaign.last_batch_at}, skipping`);
        continue;
      }

      // Claim this campaign by stamping last_batch_at immediately
      // Only succeeds if still active AND not recently claimed
      // Use RPC or two-step: first verify, then update (PostgREST .or() breaks with ISO timestamps)
      const { data: claimCheck } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", campaign.id)
        .eq("status", "active")
        .or(`last_batch_at.is.null,last_batch_at.lt."${fiveMinutesAgo}"`)
        .single();

      if (!claimCheck) {
        console.log(`[campaign-sender] Campaign ${campaign.id} not claimable`);
        continue;
      }

      const { data: claimResult, error: claimErr } = await supabase
        .from("campaigns")
        .update({ last_batch_at: new Date().toISOString() })
        .eq("id", campaign.id)
        .eq("status", "active")
        .select("id");

      if (claimErr || !claimResult || claimResult.length === 0) {
        console.log(`[campaign-sender] Failed to claim campaign ${campaign.id}, another instance may be running`);
        continue;
      }

      console.log(`[campaign-sender] Claimed campaign ${campaign.id}, fetching pending contacts`);

      // ── FETCH PENDING CONTACTS ──
      const { data: contacts, error: contactErr } = await supabase
        .from("campaign_contacts")
        .select("*")
        .eq("campaign_id", campaign.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(BATCH_SIZE);

      if (contactErr) {
        console.error(`[campaign-sender] Error fetching contacts for campaign ${campaign.id}:`, contactErr);
        continue;
      }

      if (!contacts || contacts.length === 0) {
        // No pending contacts — check if campaign is fully done
        const { count: totalPending } = await supabase
          .from("campaign_contacts")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .eq("status", "pending");

        if (totalPending === 0) {
          await supabase.from("campaigns").update({ status: "completed" }).eq("id", campaign.id);
          console.log(`[campaign-sender] Campaign ${campaign.id} marked complete — all contacts processed`);
        }
        continue;
      }

      console.log(`[campaign-sender] Sending ${contacts.length} emails for campaign ${campaign.id}`);

      // ── SEND EMAILS ──
      let batchSent = 0;
      let batchBounced = 0;

      for (const contact of contacts) {
        const emailLower = contact.email.toLowerCase();

        // Skip unsubscribed
        if (unsubEmails.has(emailLower)) {
          await supabase.from("campaign_contacts").update({ status: "unsubscribed" }).eq("id", contact.id);
          continue;
        }

        // Skip converted (already signed up)
        if (registeredEmails.has(emailLower)) {
          await supabase.from("campaign_contacts").update({ status: "converted" }).eq("id", contact.id);
          continue;
        }

        // Personalise email
        let html = campaign.body_html
          .replace(/\{first_name\}/g, contact.first_name || "there")
          .replace(/\{company_name\}/g, contact.company_name || "your company");

        // Add tracking pixel
        const trackPixelUrl = `${supabaseUrl}/functions/v1/campaign-track?type=open&contact_id=${contact.id}`;
        html += `<img src="${trackPixelUrl}" width="1" height="1" style="display:none" alt="" />`;

        // Wrap links with click tracker
        html = html.replace(
          /href="(https?:\/\/[^"]+)"/g,
          (match, url) => {
            const clickUrl = `${supabaseUrl}/functions/v1/campaign-track?type=click&contact_id=${contact.id}&url=${encodeURIComponent(url)}`;
            return `href="${clickUrl}"`;
          }
        );

        // Add unsubscribe link
        const unsubUrl = `${supabaseUrl}/functions/v1/campaign-unsub?contact_id=${contact.id}&email=${encodeURIComponent(contact.email)}`;
        html += `<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;">
          <a href="${unsubUrl}" style="color:#999;text-decoration:underline;">Unsubscribe from future emails</a>
        </div>`;

        // Throttle to stay under Resend rate limit
        await delay(SEND_DELAY_MS);

        try {
          const emailPayload: any = {
            from: "PayNudge <hello@paynudge.co>",
            to: [contact.email],
            subject: campaign.subject,
            html,
          };

          // Attach PDF if campaign has one
          if (campaign.attachment_url) {
            try {
              const attachRes = await fetch(campaign.attachment_url);
              if (attachRes.ok) {
                const arrayBuf = await attachRes.arrayBuffer();
                const uint8 = new Uint8Array(arrayBuf);
                let binary = "";
                const chunkSize = 8192;
                for (let i = 0; i < uint8.length; i += chunkSize) {
                  binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
                }
                const base64 = btoa(binary);
                emailPayload.attachments = [{
                  filename: "invoice-sample.pdf",
                  content: base64,
                  content_type: "application/pdf",
                }];
              }
            } catch (attachErr) {
              console.error("[campaign-sender] Failed to fetch attachment:", attachErr);
            }
          }

          let res: Response | null = null;
          const MAX_RETRIES = 3;
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(emailPayload),
            });

            if (res.status === 429) {
              const backoff = Math.pow(2, attempt) * 1000;
              console.warn(`[campaign-sender] Rate limited on ${contact.email}, retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
              await delay(backoff);
              continue;
            }
            break;
          }

          if (res && res.ok) {
            await supabase.from("campaign_contacts")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", contact.id);
            batchSent++;
          } else {
            const errText = res ? await res.text() : "No response";
            await supabase.from("campaign_contacts")
              .update({ status: "bounced", error_message: errText })
              .eq("id", contact.id);
            batchBounced++;
          }
        } catch (sendErr: any) {
          await supabase.from("campaign_contacts")
            .update({ status: "bounced", error_message: sendErr.message })
            .eq("id", contact.id);
          batchBounced++;
        }
      }

      // ── UPDATE PROGRESS (re-count from DB as source of truth) ──
      const [
        { count: sentCount },
        { count: openCount },
        { count: clickCount },
        { count: bounceCount },
        { count: unsubCount },
        { count: pendingCount },
      ] = await Promise.all([
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id).in("status", ["sent", "opened", "clicked"]),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id).in("status", ["opened", "clicked"]),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("status", "clicked"),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("status", "bounced"),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("status", "unsubscribed"),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("status", "pending"),
      ]);

      const processedCount = (campaign.total_contacts || 0) - (pendingCount || 0);

      await supabase.from("campaigns").update({
        sent_count: sentCount || 0,
        open_count: openCount || 0,
        click_count: clickCount || 0,
        bounce_count: bounceCount || 0,
        unsub_count: unsubCount || 0,
        contacts_processed: processedCount,
        last_batch_at: new Date().toISOString(),
      }).eq("id", campaign.id);

      // If this batch cleared the last pending contacts, mark complete
      if (pendingCount === 0) {
        await supabase.from("campaigns").update({ status: "completed" }).eq("id", campaign.id);
        console.log(`[campaign-sender] Campaign ${campaign.id} completed after final batch`);
      }

      totalSent += batchSent;
      totalBounced += batchBounced;

      console.log(`[campaign-sender] Campaign ${campaign.id} batch done: sent=${batchSent}, bounced=${batchBounced}, remaining=${pendingCount}`);
    }

    // Audit log
    if (totalSent > 0 || totalBounced > 0) {
      await supabase.from("audit_log").insert({
        action: "Campaign batch sent",
        detail: `Sent: ${totalSent}, Bounced: ${totalBounced}`,
        level: "info",
      });
    }

    return new Response(JSON.stringify({ sent: totalSent, bounced: totalBounced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[campaign-sender] Fatal error:", error);
    await supabase.from("audit_log").insert({
      action: "Campaign sender error",
      detail: error.message,
      level: "error",
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
