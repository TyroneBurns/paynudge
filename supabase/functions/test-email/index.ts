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
    const { email, subject, html, attachment_url } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ success: false, error: "Valid email address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <div style="margin-bottom: 24px;">
          <div style="width: 20px; height: 20px; background: #00D4A8; border-radius: 4px; display: inline-block; vertical-align: middle; margin-right: 8px;"></div>
          <span style="font-weight: 800; font-size: 18px; vertical-align: middle;">PayNudge</span>
        </div>
        <h2 style="font-size: 20px; margin-bottom: 12px;">✅ Test Email Successful</h2>
        <p style="color: #666; line-height: 1.6;">This is a test email confirming your Resend integration is working correctly.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Sent from PayNudge Admin Dashboard</p>
      </div>
    `;

    const emailPayload: Record<string, unknown> = {
      from: "PayNudge <hello@paynudge.co>",
      to: [email],
      subject: subject || "PayNudge — Test Email",
      html: html || defaultHtml,
    };

    // Fetch and attach PDF if attachment_url provided
    if (attachment_url && typeof attachment_url === "string") {
      try {
        console.log("test-email: fetching attachment from", attachment_url);
        const attachRes = await fetch(attachment_url);
        if (attachRes.ok) {
          const arrayBuf = await attachRes.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuf);
          // Encode in chunks to avoid call stack overflow on large files
          let binary = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8.length; i += chunkSize) {
            binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
          }
          const base64 = btoa(binary);
          console.log(`test-email: attachment encoded, size=${uint8.length} bytes`);
          emailPayload.attachments = [{
            filename: "sample-invoice-reminder.pdf",
            content: base64,
            content_type: "application/pdf",
          }];
        } else {
          console.error("test-email: attachment fetch failed, status=", attachRes.status);
        }
      } catch (attachErr) {
        console.error("test-email: failed to fetch attachment:", attachErr);
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: resendData.message || resendData.error || "Resend API error",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("test-email error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
