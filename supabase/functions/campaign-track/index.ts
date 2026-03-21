import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// 1x1 transparent GIF
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const contactId = url.searchParams.get("contact_id");
  const redirectUrl = url.searchParams.get("url");

  if (!contactId || !type) {
    return new Response(PIXEL, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    if (type === "open") {
      // Only update if not already opened/clicked
      const { data: contact } = await supabase
        .from("campaign_contacts")
        .select("status, campaign_id")
        .eq("id", contactId)
        .single();

      if (contact && (contact.status === "sent" || contact.status === "pending")) {
        await supabase.from("campaign_contacts")
          .update({ status: "opened", opened_at: new Date().toISOString() })
          .eq("id", contactId);

        // Update campaign open_count
        const { count } = await supabase
          .from("campaign_contacts")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", contact.campaign_id)
          .in("status", ["opened", "clicked"]);

        await supabase.from("campaigns")
          .update({ open_count: count || 0 })
          .eq("id", contact.campaign_id);
      }

      return new Response(PIXEL, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store" },
      });
    }

    if (type === "click") {
      const { data: contact } = await supabase
        .from("campaign_contacts")
        .select("status, campaign_id")
        .eq("id", contactId)
        .single();

      if (contact && contact.status !== "clicked") {
        await supabase.from("campaign_contacts")
          .update({
            status: "clicked",
            clicked_at: new Date().toISOString(),
            opened_at: new Date().toISOString(),
          })
          .eq("id", contactId);

        // Update campaign counts
        const [{ count: openCount }, { count: clickCount }] = await Promise.all([
          supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", contact.campaign_id).in("status", ["opened", "clicked"]),
          supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", contact.campaign_id).eq("status", "clicked"),
        ]);

        await supabase.from("campaigns").update({
          open_count: openCount || 0,
          click_count: clickCount || 0,
        }).eq("id", contact.campaign_id);
      }

      if (redirectUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: decodeURIComponent(redirectUrl) },
        });
      }

      return new Response(PIXEL, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache" },
      });
    }
  } catch (err) {
    console.error("Campaign track error:", err);
  }

  return new Response(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache" },
  });
});
