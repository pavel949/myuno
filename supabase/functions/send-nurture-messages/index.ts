/**
 * Send Nurturing Sequences
 * 
 * Cron-triggered function that processes scheduled nurturing messages.
 * Checks `crm_nurture_queue` for messages due to be sent, sends them via
 * email or WhatsApp, and marks them as sent.
 * 
 * Designed to run daily via pg_cron.
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

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
    const supabase = createServiceClient();

    // Fetch pending nurture messages that are due
    const { data: pendingMessages, error } = await supabase
      .from("crm_nurture_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("[Nurture] Query error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch queue" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingMessages?.length) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, message: "No pending messages" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    let failCount = 0;

    for (const msg of pendingMessages) {
      try {
        let sent = false;

        if (msg.channel === "whatsapp" && msg.recipient_phone) {
          sent = await sendWhatsApp({
            to: msg.recipient_phone,
            body: msg.message_body,
          });
        } else if (msg.channel === "email" && msg.recipient_email) {
          // Send via send-email edge function
          const emailResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                to: msg.recipient_email,
                subject: msg.subject || "Update from MyUNO",
                html: msg.message_body,
              }),
            }
          );
          sent = emailResponse.ok;
        }

        // Update status
        await supabase
          .from("crm_nurture_queue")
          .update({
            status: sent ? "sent" : "failed",
            sent_at: sent ? new Date().toISOString() : null,
            error: sent ? null : "Send failed",
          })
          .eq("id", msg.id);

        if (sent) sentCount++;
        else failCount++;
      } catch (msgErr) {
        console.error(`[Nurture] Message ${msg.id} error:`, msgErr);
        await supabase
          .from("crm_nurture_queue")
          .update({ status: "failed", error: String(msgErr) })
          .eq("id", msg.id);
        failCount++;
      }
    }

    console.log(`[Nurture] Processed: ${sentCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ ok: true, processed: pendingMessages.length, sent: sentCount, failed: failCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Nurture] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
