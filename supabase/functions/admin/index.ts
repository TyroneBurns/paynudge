import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth + admin check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized: admin role required");

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── STATS ───
    if (action === "stats") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [
        { count: totalUsers },
        { count: paidUsers },
        { count: freeUsers },
        { count: newUsersToday },
        { count: newUsersWeek },
        { count: newUsersMonth },
        { count: totalInvoices },
        { count: totalReminders },
        { count: remindersToday },
        { count: emailReminders },
        { count: smsReminders },
        { count: emailFailures },
        { count: smsFailures },
        { count: xeroConnected },
        { count: gmailConnected },
        { count: churnThisMonth },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "free"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("reminders").select("*", { count: "exact", head: true }),
        supabase.from("reminders").select("*", { count: "exact", head: true }).gte("sent_at", todayStart),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("method", "email"),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("method", "sms"),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("method", "email").eq("status", "failed"),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("method", "sms").eq("status", "failed"),
        supabase.from("organisations").select("*", { count: "exact", head: true }).not("xero_tenant_id", "is", null),
        supabase.from("organisations").select("*", { count: "exact", head: true }).not("gmail_email", "is", null),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "cancelled").gte("updated_at", monthStart),
      ]);

      // Campaign aggregate stats
      const [
        { count: campaignEmailsSent },
        { count: campaignOpens },
        { count: campaignClicks },
        { count: campaignBounces },
        { count: campaignUnsubs },
      ] = await Promise.all([
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).in("status", ["sent", "opened", "clicked"]),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).in("status", ["opened", "clicked"]),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("status", "clicked"),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("status", "bounced"),
        supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
      ]);

      // Active users — users with audit_log entries in last 30 days
      const { data: activeUserRows } = await supabase
        .from("audit_log")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo)
        .not("user_id", "is", null);
      const activeUsers = new Set((activeUserRows || []).map(r => r.user_id)).size;

      // Visitor analytics
      const { count: uniqueVisitorsToday } = await supabase
        .from("page_views")
        .select("visitor_id", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // For true unique count we need distinct visitor_ids
      const { data: todayVisitors } = await supabase
        .from("page_views")
        .select("visitor_id")
        .gte("created_at", todayStart);
      const uniqueToday = new Set((todayVisitors || []).map(v => v.visitor_id)).size;

      // Total page views today
      const { count: pageViewsToday } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // Source breakdown (all time)
      const { data: sourceRows } = await supabase
        .from("page_views")
        .select("source");
      const sourceCounts: Record<string, number> = {};
      for (const row of sourceRows || []) {
        sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1;
      }

      // Top countries
      const { data: countryRows } = await supabase
        .from("page_views")
        .select("country")
        .not("country", "is", null);
      const countryCounts: Record<string, number> = {};
      for (const row of countryRows || []) {
        if (row.country) {
          countryCounts[row.country] = (countryCounts[row.country] || 0) + 1;
        }
      }
      const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));

      const mrr = (paidUsers || 0) * 2900; // cents
      const emailSuccessRate = (emailReminders || 0) > 0
        ? (((emailReminders || 0) - (emailFailures || 0)) / (emailReminders || 0) * 100).toFixed(1)
        : "100.0";
      const smsSuccessRate = (smsReminders || 0) > 0
        ? (((smsReminders || 0) - (smsFailures || 0)) / (smsReminders || 0) * 100).toFixed(1)
        : "100.0";

      const cSent = campaignEmailsSent || 0;
      const cOpens = campaignOpens || 0;
      const cClicks = campaignClicks || 0;
      const cUnsubs = campaignUnsubs || 0;
      const campaignOpenRate = cSent > 0 ? parseFloat(((cOpens / cSent) * 100).toFixed(1)) : 0;
      const campaignClickRate = cSent > 0 ? parseFloat(((cClicks / cSent) * 100).toFixed(1)) : 0;
      const campaignUnsubRate = cSent > 0 ? parseFloat(((cUnsubs / cSent) * 100).toFixed(1)) : 0;

      return new Response(JSON.stringify({
        total_users: totalUsers || 0,
        paid_users: paidUsers || 0,
        free_users: freeUsers || 0,
        mrr,
        arr: mrr * 12,
        new_users_today: newUsersToday || 0,
        new_users_this_week: newUsersWeek || 0,
        new_users_this_month: newUsersMonth || 0,
        active_users_last_30_days: activeUsers,
        total_invoices_synced: totalInvoices || 0,
        total_reminders_sent: totalReminders || 0,
        reminders_sent_today: remindersToday || 0,
        email_success_rate: parseFloat(emailSuccessRate),
        sms_success_rate: parseFloat(smsSuccessRate),
        emails_sent: emailReminders || 0,
        sms_sent: smsReminders || 0,
        xero_connected_count: xeroConnected || 0,
        gmail_connected_count: gmailConnected || 0,
        churn_this_month: churnThisMonth || 0,
        conversion_rate: (totalUsers || 0) > 0
          ? parseFloat(((paidUsers || 0) / (totalUsers || 0) * 100).toFixed(1))
          : 0,
        campaign_emails_sent: cSent,
        campaign_open_rate: campaignOpenRate,
        campaign_click_rate: campaignClickRate,
        campaign_bounces: campaignBounces || 0,
        campaign_unsub_rate: campaignUnsubRate,
        campaign_unsubs: cUnsubs,
        // Visitor analytics
        unique_visitors_today: uniqueToday,
        page_views_today: pageViewsToday || 0,
        traffic_sources: sourceCounts,
        top_countries: topCountries,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── USERS (full join) ───
    if (action === "users") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: orgs } = await supabase
        .from("organisations")
        .select("user_id, xero_tenant_id, gmail_email");

      const { data: invoiceCounts } = await supabase
        .from("invoices")
        .select("organisation_id");

      const { data: reminderData } = await supabase
        .from("reminders")
        .select("invoice_id");

      const { data: invoiceOrgMap } = await supabase
        .from("invoices")
        .select("id, organisation_id");

      // Build lookup maps
      const orgByUser = new Map((orgs || []).map(o => [o.user_id, o]));
      const invoicesByOrg = new Map<string, number>();
      (invoiceCounts || []).forEach(i => {
        invoicesByOrg.set(i.organisation_id, (invoicesByOrg.get(i.organisation_id) || 0) + 1);
      });

      const invoiceToOrg = new Map((invoiceOrgMap || []).map(i => [i.id, i.organisation_id]));
      const remindersByOrg = new Map<string, number>();
      (reminderData || []).forEach(r => {
        const orgId = invoiceToOrg.get(r.invoice_id);
        if (orgId) remindersByOrg.set(orgId, (remindersByOrg.get(orgId) || 0) + 1);
      });

      // Get last sign in from auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const lastSignInMap = new Map((authUsers?.users || []).map(u => [u.id, u.last_sign_in_at]));

      const users = (profiles || []).map(p => {
        const org = orgByUser.get(p.user_id);
        // find org id for this user from orgs table
        const userOrgId = org ? undefined : undefined; // we need full org
        return {
          ...p,
          xero_connected: !!org?.xero_tenant_id,
          gmail_connected: !!org?.gmail_email,
          last_sign_in_at: lastSignInMap.get(p.user_id) || null,
          invoices_synced: 0, // will be set below
          reminders_sent: 0,
        };
      });

      // Second pass to get org IDs
      const { data: fullOrgs } = await supabase.from("organisations").select("id, user_id");
      const orgIdByUser = new Map((fullOrgs || []).map(o => [o.user_id, o.id]));

      users.forEach(u => {
        const orgId = orgIdByUser.get(u.user_id);
        if (orgId) {
          u.invoices_synced = invoicesByOrg.get(orgId) || 0;
          u.reminders_sent = remindersByOrg.get(orgId) || 0;
        }
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── AUDIT LOG ───
    if (action === "audit") {
      const level = url.searchParams.get("level");
      const days = parseInt(url.searchParams.get("days") || "7");
      const since = new Date(Date.now() - days * 86400000).toISOString();

      let query = supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);

      if (level) query = query.eq("level", level);

      const { data } = await query;
      return new Response(JSON.stringify({ logs: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CHART DATA: signups per day ───
    if (action === "signups-chart") {
      const days = parseInt(url.searchParams.get("days") || "30");
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      const byDay: Record<string, number> = {};
      (data || []).forEach(p => {
        const day = p.created_at.substring(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
      });

      // Fill gaps
      const result = [];
      const start = new Date(Date.now() - days * 86400000);
      for (let i = 0; i < days; i++) {
        const d = new Date(start.getTime() + i * 86400000);
        const key = d.toISOString().substring(0, 10);
        result.push({ date: key, count: byDay[key] || 0 });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CHART DATA: reminders per day ───
    if (action === "reminders-chart") {
      const days = parseInt(url.searchParams.get("days") || "30");
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data } = await supabase
        .from("reminders")
        .select("sent_at, method")
        .gte("sent_at", since)
        .order("sent_at", { ascending: true });

      const byDay: Record<string, { email: number; sms: number }> = {};
      (data || []).forEach(r => {
        const day = r.sent_at.substring(0, 10);
        if (!byDay[day]) byDay[day] = { email: 0, sms: 0 };
        byDay[day][r.method as "email" | "sms"]++;
      });

      const result = [];
      const start = new Date(Date.now() - days * 86400000);
      for (let i = 0; i < days; i++) {
        const d = new Date(start.getTime() + i * 86400000);
        const key = d.toISOString().substring(0, 10);
        result.push({ date: key, email: byDay[key]?.email || 0, sms: byDay[key]?.sms || 0 });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CHART DATA: cumulative paid users ───
    if (action === "paid-chart") {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, subscription_status")
        .eq("subscription_status", "active")
        .order("created_at", { ascending: true });

      let cumulative = 0;
      const byDay: Record<string, number> = {};
      (data || []).forEach(p => {
        cumulative++;
        const day = p.created_at.substring(0, 10);
        byDay[day] = cumulative;
      });

      const result = Object.entries(byDay).map(([date, count]) => ({ date, count }));
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── SYSTEM HEALTH ───
    if (action === "health") {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [
        { count: errorsWeek },
        { count: warningsWeek },
        { data: recentErrors },
        { data: lastXeroSync },
        { data: lastReminderRun },
        { count: emailFailures24h },
        { count: smsFailures24h },
        { data: brokenXeroOrgs },
      ] = await Promise.all([
        supabase.from("audit_log").select("*", { count: "exact", head: true }).eq("level", "error").gte("created_at", weekAgo),
        supabase.from("audit_log").select("*", { count: "exact", head: true }).eq("level", "warning").gte("created_at", weekAgo),
        supabase.from("audit_log").select("*").eq("level", "error").gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_log").select("created_at").eq("action", "Xero sync completed").order("created_at", { ascending: false }).limit(1),
        supabase.from("audit_log").select("created_at").ilike("action", "%reminder%").order("created_at", { ascending: false }).limit(1),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("method", "email").eq("status", "failed").gte("sent_at", oneDayAgo),
        supabase.from("reminders").select("*", { count: "exact", head: true }).eq("method", "sms").eq("status", "failed").gte("sent_at", oneDayAgo),
        supabase.from("organisations").select("id, user_id, company_name, xero_token_expiry").not("xero_tenant_id", "is", null).lt("xero_token_expiry", new Date().toISOString()),
      ]);

      // Get email for recent errors
      const userIds = [...new Set((recentErrors || []).map(e => e.user_id).filter(Boolean))];
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, email").in("user_id", userIds);
        (profiles || []).forEach(p => { emailMap[p.user_id] = p.email; });
      }

      const errorsWithEmail = (recentErrors || []).map(e => ({
        ...e,
        user_email: e.user_id ? (emailMap[e.user_id] || "Unknown") : "System",
      }));

      return new Response(JSON.stringify({
        errors_this_week: errorsWeek || 0,
        warnings_this_week: warningsWeek || 0,
        recent_errors: errorsWithEmail,
        last_xero_sync: lastXeroSync?.[0]?.created_at || null,
        last_reminder_run: lastReminderRun?.[0]?.created_at || null,
        email_failures_24h: emailFailures24h || 0,
        sms_failures_24h: smsFailures24h || 0,
        broken_xero_connections: brokenXeroOrgs || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── DORMANT USERS ───
    if (action === "dormant-users") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, created_at")
        .lt("created_at", sevenDaysAgo);

      const { data: orgsWithXero } = await supabase
        .from("organisations")
        .select("user_id")
        .not("xero_tenant_id", "is", null);

      const xeroUserIds = new Set((orgsWithXero || []).map(o => o.user_id));
      const dormant = (profiles || []).filter(p => !xeroUserIds.has(p.user_id));

      return new Response(JSON.stringify({ dormant_users: dormant }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── SEND ACTIVATION EMAIL ───
    if (action === "send-activation-email" && req.method === "POST") {
      const { email, name } = await req.json();
      if (!email) throw new Error("Email is required");

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) throw new Error("RESEND_API_KEY not configured");

      const firstName = name?.split(" ")[0] || "there";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "PayNudge <hello@paynudge.co>",
          to: [email],
          subject: "Get started with PayNudge — connect your Xero account",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 22px; margin-bottom: 16px;">Hey ${firstName} 👋</h1>
              <p style="color: #555; line-height: 1.6; margin-bottom: 16px;">
                We noticed you signed up for PayNudge but haven't connected your Xero account yet. 
                Once connected, PayNudge will automatically sync your invoices and start sending payment reminders — 
                so you get paid faster without lifting a finger.
              </p>
              <p style="margin-bottom: 24px;">
                <a href="https://paynudge.co/integrations" 
                   style="display: inline-block; background: #00D4A8; color: #000; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Connect Xero now →
                </a>
              </p>
              <p style="color: #888; font-size: 13px;">
                Need help? Just reply to this email and we'll get you sorted.
              </p>
              <p style="color: #888; font-size: 13px; margin-top: 24px;">— The PayNudge Team</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error: ${err}`);
      }

      // Log it
      await supabase.from("audit_log").insert({
        user_id: userData.user.id,
        action: "Activation email sent",
        detail: `To: ${email}`,
        level: "info",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── UPDATE USER SUBSCRIPTION ───
    if (action === "update-subscription" && req.method === "POST") {
      const { user_id, subscription_status } = await req.json();
      if (!user_id || !subscription_status) throw new Error("user_id and subscription_status required");

      await supabase.from("profiles").update({ subscription_status }).eq("user_id", user_id);

      await supabase.from("audit_log").insert({
        user_id: userData.user.id,
        action: "Subscription updated by admin",
        detail: `User ${user_id} → ${subscription_status}`,
        level: "info",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── DELETE USER ───
    if (action === "delete-user" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      // Get user email for logging
      const { data: targetProfile } = await supabase.from("profiles").select("email").eq("user_id", user_id).single();
      const targetEmail = targetProfile?.email || user_id;

      // Delete related data: org → clients, invoices, reminders, reminder_rules
      const { data: userOrg } = await supabase.from("organisations").select("id").eq("user_id", user_id).maybeSingle();
      if (userOrg) {
        // Delete reminders for user's invoices
        const { data: userInvoices } = await supabase.from("invoices").select("id").eq("organisation_id", userOrg.id);
        if (userInvoices && userInvoices.length > 0) {
          const invoiceIds = userInvoices.map(i => i.id);
          await supabase.from("reminders").delete().in("invoice_id", invoiceIds);
        }
        await supabase.from("invoices").delete().eq("organisation_id", userOrg.id);
        await supabase.from("clients").delete().eq("organisation_id", userOrg.id);
        await supabase.from("reminder_rules").delete().eq("organisation_id", userOrg.id);
        await supabase.from("organisations").delete().eq("id", userOrg.id);
      }

      // Delete notification prefs, profile, audit logs
      await supabase.from("notification_preferences").delete().eq("user_id", user_id);
      await supabase.from("audit_log").delete().eq("user_id", user_id);
      await supabase.from("profiles").delete().eq("user_id", user_id);
      await supabase.from("user_roles").delete().eq("user_id", user_id);

      // Delete auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
      if (deleteError) throw new Error(`Failed to delete auth user: ${deleteError.message}`);

      // Log it
      await supabase.from("audit_log").insert({
        user_id: userData.user.id,
        action: "User deleted by admin",
        detail: `Deleted user: ${targetEmail}`,
        level: "warning",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CANCEL STRIPE SUBSCRIPTION ───
    if (action === "cancel-subscription" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

      const { data: profile } = await supabase.from("profiles").select("email, stripe_customer_id").eq("user_id", user_id).single();
      if (!profile) throw new Error("Profile not found");

      let customerId = profile.stripe_customer_id;
      if (!customerId) {
        const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
        if (customers.data.length === 0) throw new Error("No Stripe customer found");
        customerId = customers.data[0].id;
      }

      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (subscriptions.data.length === 0) throw new Error("No active subscription found");

      await stripe.subscriptions.cancel(subscriptions.data[0].id);
      await supabase.from("profiles").update({ subscription_status: "cancelled" }).eq("user_id", user_id);

      await supabase.from("audit_log").insert({
        user_id: userData.user.id,
        action: "Subscription cancelled by admin",
        detail: `User: ${profile.email}, Sub: ${subscriptions.data[0].id}`,
        level: "warning",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REFUND LAST PAYMENT ───
    if (action === "refund" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

      const { data: profile } = await supabase.from("profiles").select("email, stripe_customer_id").eq("user_id", user_id).single();
      if (!profile) throw new Error("Profile not found");

      let customerId = profile.stripe_customer_id;
      if (!customerId) {
        const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
        if (customers.data.length === 0) throw new Error("No Stripe customer found");
        customerId = customers.data[0].id;
      }

      const payments = await stripe.paymentIntents.list({ customer: customerId, limit: 1 });
      if (payments.data.length === 0) throw new Error("No payments found to refund");

      const payment = payments.data[0];
      if (payment.status !== "succeeded") throw new Error("Last payment is not in a refundable state");

      const refund = await stripe.refunds.create({ payment_intent: payment.id });

      await supabase.from("audit_log").insert({
        user_id: userData.user.id,
        action: "Payment refunded by admin",
        detail: `User: ${profile.email}, Amount: £${(payment.amount / 100).toFixed(2)}, Refund: ${refund.id}`,
        level: "warning",
      });

      return new Response(JSON.stringify({ success: true, refund_id: refund.id, amount: payment.amount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});
