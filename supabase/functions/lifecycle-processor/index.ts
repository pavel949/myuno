import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

/**
 * Lifecycle Processor — cron-triggered Edge Function
 * 
 * 1. Finds confirmed property_bookings
 * 2. Schedules lifecycle_executions based on lifecycle_templates
 * 3. Sends pending executions (email via Resend, in_app via insert to notifications)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;

    const supabase = createServiceClient();
    const now = new Date();
    const results = { scheduled: 0, sent: 0, failed: 0, emails: 0 };

    // Step 1: Get active templates
    const { data: templates } = await supabase
      .from("lifecycle_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (!templates?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No active templates", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get confirmed bookings within lifecycle window (7 days before to 7 days after)
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 7);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const { data: bookings } = await supabase
      .from("property_bookings")
      .select("id, guest_user_id, check_in, check_out, status, property_id")
      .in("status", ["confirmed", "checked_in", "checked_out"])
      .gte("check_out", windowStart.toISOString().split("T")[0])
      .lte("check_in", windowEnd.toISOString().split("T")[0])
      .limit(100);

    if (!bookings?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No bookings in window", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Schedule missing executions
    for (const booking of bookings) {
      if (!booking.guest_user_id) continue;

      for (const tmpl of templates) {
        // Calculate scheduled_at based on stage + offset
        let anchorDate: Date;
        if (tmpl.stage === "pre_arrival" || tmpl.stage === "check_in" || tmpl.stage === "mid_stay") {
          anchorDate = new Date(booking.check_in + "T14:00:00+07:00"); // 2 PM Thailand
        } else {
          anchorDate = new Date(booking.check_out + "T11:00:00+07:00"); // 11 AM Thailand
        }

        const scheduledAt = new Date(anchorDate.getTime() + tmpl.offset_hours * 3600000);

        // Upsert execution (idempotent)
        const { error } = await supabase
          .from("lifecycle_executions")
          .upsert({
            booking_id: booking.id,
            template_id: tmpl.id,
            guest_user_id: booking.guest_user_id,
            channel: tmpl.channel,
            status: "pending",
            scheduled_at: scheduledAt.toISOString(),
          }, { onConflict: "booking_id,template_id,channel", ignoreDuplicates: true });

        if (!error) results.scheduled++;
      }
    }

    // Step 4: Send pending executions that are due
    const { data: pendingExecs } = await supabase
      .from("lifecycle_executions")
      .select("*, lifecycle_templates(*)")
      .eq("status", "pending")
      .lte("scheduled_at", now.toISOString())
      .order("scheduled_at")
      .limit(20);

    for (const exec of pendingExecs || []) {
      try {
        const tmpl = exec.lifecycle_templates;
        if (!tmpl) continue;

        // Replace {bookingId} in CTA URL
        const ctaUrl = tmpl.cta_url?.replace("{bookingId}", exec.booking_id) || "";

        if (exec.channel === "in_app") {
          // Insert into notifications table for in-app display
          await supabase.from("notifications").insert({
            user_id: exec.guest_user_id,
            title: tmpl.title_en,
            body: tmpl.body_en,
            type: "booking",
            data: {
              title_ru: tmpl.title_ru,
              body_ru: tmpl.body_ru,
              cta_label_en: tmpl.cta_label_en,
              cta_label_ru: tmpl.cta_label_ru,
              cta_url: ctaUrl,
              lifecycle_stage: tmpl.stage,
              booking_id: exec.booking_id,
            },
          });
          results.sent++;
        } else if (exec.channel === "email") {
          // Send email via Resend
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            // Get guest email
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, preferred_language")
              .eq("id", exec.guest_user_id)
              .single();

            if (profile?.email) {
              const isRu = profile.preferred_language === "ru";
              const title = isRu ? tmpl.title_ru : tmpl.title_en;
              const body = isRu ? tmpl.body_ru : tmpl.body_en;
              const ctaLabel = isRu ? (tmpl.cta_label_ru || "Подробнее") : (tmpl.cta_label_en || "Learn more");
              const baseUrl = Deno.env.get("SITE_URL") || "https://uno.ae";

              const emailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "myUNO <notify@www.myuno.app>",
                  to: [profile.email],
                  subject: title,
                  html: `
                    <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
                      <div style="text-align:center;margin-bottom:24px;">
                        <h1 style="font-size:20px;color:#1a1a2e;margin:0;">${title}</h1>
                      </div>
                      <p style="font-size:15px;color:#4a4a6a;line-height:1.6;margin:0 0 24px;">${body}</p>
                      ${ctaUrl ? `<div style="text-align:center;">
                        <a href="${baseUrl}${ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${ctaLabel}</a>
                      </div>` : ""}
                      <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center;">myUNO — Your lifestyle concierge in Thailand</p>
                    </div>
                  `,
                }),
              });

              if (emailRes.ok) {
                results.emails++;
                results.sent++;
              } else {
                console.error("Email send failed:", await emailRes.text());
                results.failed++;
              }
            }
          } else {
            console.warn("RESEND_API_KEY not configured, skipping email");
            results.failed++;
          }
        }

        // Mark as sent
        await supabase
          .from("lifecycle_executions")
          .update({ status: "sent", sent_at: now.toISOString() })
          .eq("id", exec.id);

      } catch (err) {
        console.error("Execution error:", err);
        await supabase
          .from("lifecycle_executions")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", exec.id);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, checked_at: now.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("lifecycle-processor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
