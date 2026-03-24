import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

interface LifecycleTemplate {
  id: string;
  trigger_type: string;
  channel: string;
  title_ru: string;
  title_en: string;
  body_ru: string;
  body_en: string;
  promo_code: string | null;
  discount_percent: number | null;
  is_active: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();

    // Get active templates
    const { data: templates, error: tplErr } = await supabase
      .from("lifecycle_templates")
      .select("*")
      .eq("is_active", true);

    if (tplErr) throw tplErr;

    // Get user segments
    const { data: segments, error: segErr } = await supabase
      .from("user_segments")
      .select("user_id, lifecycle_stage, value_segment, days_since_last_visit, total_spent");

    if (segErr) throw segErr;

    const results = {
      welcome: 0,
      at_risk: 0,
      dormant: 0,
      vip: 0,
      errors: 0,
    };

    for (const seg of segments || []) {
      try {
        let triggerType: string | null = null;

        // Determine trigger based on segment
        if (seg.lifecycle_stage === "new" && (seg.days_since_last_visit ?? 0) <= 7) {
          triggerType = "welcome";
        } else if (seg.lifecycle_stage === "at_risk") {
          triggerType = "at_risk_reactivation";
        } else if (seg.lifecycle_stage === "dormant" || seg.lifecycle_stage === "churned") {
          triggerType = "dormant_winback";
        } else if (seg.value_segment === "vip") {
          triggerType = "vip_reward";
        }

        if (!triggerType) continue;

        // Check if we already sent this type today
        const today = new Date().toISOString().split("T")[0];
        const { data: existing } = await supabase
          .from("booking_notifications_log")
          .select("id")
          .eq("notification_type", `lifecycle_${triggerType}`)
          .gte("created_at", `${today}T00:00:00Z`)
          .eq("metadata->>user_id", seg.user_id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Find matching templates
        const matchingTemplates = (templates || []).filter(
          (t: LifecycleTemplate) => t.trigger_type === triggerType
        );

        for (const tpl of matchingTemplates) {
          // Log the notification
          await supabase.from("booking_notifications_log").insert({
            notification_type: `lifecycle_${triggerType}`,
            channel: tpl.channel,
            subject: tpl.title_ru,
            body: tpl.body_ru,
            metadata: {
              user_id: seg.user_id,
              template_id: tpl.id,
              trigger_type: triggerType,
              promo_code: tpl.promo_code,
              discount_percent: tpl.discount_percent,
            },
          });

          // If email channel, invoke send-promotions
          if (tpl.channel === "email") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", seg.user_id)
              .single();

            if (profile?.email) {
              try {
                await supabase.functions.invoke("send-promotions", {
                  body: {
                    to: [profile.email],
                    subject: tpl.title_ru,
                    html: `<h2>${tpl.title_ru}</h2><p>${tpl.body_ru}</p>${
                      tpl.promo_code
                        ? `<p><strong>Промокод: ${tpl.promo_code} (-${tpl.discount_percent}%)</strong></p>`
                        : ""
                    }`,
                  },
                });
              } catch {
                // Email sending failed, but notification is logged
              }
            }
          }
        }

        // Increment counter
        if (triggerType === "welcome") results.welcome++;
        else if (triggerType === "at_risk_reactivation") results.at_risk++;
        else if (triggerType === "dormant_winback") results.dormant++;
        else if (triggerType === "vip_reward") results.vip++;
      } catch {
        results.errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
