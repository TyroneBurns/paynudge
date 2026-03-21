import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { visitor_id, path, referrer } = await req.json();

    if (!visitor_id || !path) {
      return new Response(JSON.stringify({ error: "visitor_id and path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine source from referrer
    let source = "direct";
    if (referrer) {
      const ref = referrer.toLowerCase();
      if (ref.includes("campaign-track") || ref.includes("utm_source=campaign") || ref.includes("utm_source=email")) {
        source = "campaign_email";
      } else if (ref.includes("google.com") || ref.includes("google.co")) {
        source = "google";
      } else if (ref.includes("bing.com")) {
        source = "bing";
      } else if (ref.includes("facebook.com") || ref.includes("fb.com")) {
        source = "facebook";
      } else if (ref.includes("twitter.com") || ref.includes("x.com")) {
        source = "twitter";
      } else if (ref.includes("linkedin.com")) {
        source = "linkedin";
      } else if (ref.includes("reddit.com")) {
        source = "reddit";
      } else if (!ref.includes("paynudge.co") && !ref.includes("lovable.app") && ref.includes("http")) {
        source = "referral";
      }
    }

    // Check URL params for UTM source override
    try {
      const urlObj = new URL(`https://paynudge.co${path}`);
      const utmSource = urlObj.searchParams.get("utm_source");
      if (utmSource) {
        if (utmSource === "campaign" || utmSource === "email") {
          source = "campaign_email";
        } else {
          source = utmSource;
        }
      }
    } catch {}

    // Get country from headers or IP geolocation fallback
    let cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-country") || null;
    
    if (!cfCountry) {
      // Fallback: use free IP geolocation API
      try {
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
          || req.headers.get("x-real-ip");
        if (clientIp && clientIp !== "127.0.0.1") {
          const geoRes = await fetch(`https://ipapi.co/${clientIp}/country_name/`);
          if (geoRes.ok) {
            const countryName = await geoRes.text();
            if (countryName && !countryName.includes("Undefined") && countryName.length < 60) {
              cfCountry = countryName.trim();
            }
          }
        }
      } catch { /* ignore geo lookup failures */ }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabase.from("page_views").insert({
      visitor_id,
      path,
      referrer: referrer || null,
      source,
      country: cfCountry,
      user_agent: req.headers.get("user-agent") || null,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-visit error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
