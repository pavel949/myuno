import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

import { getCorsHeaders } from "../_shared/cors.ts";

interface CampaignRule {
  id: string;
  campaign_id: string;
  trigger_event: string;
  target_state: string | null;
  channel: string | null;
  cooldown_hours: number | null;
  message_template: { en?: string; ru?: string } | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  max_sends_per_day: number | null;
  is_active: boolean;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard: require X-Internal-Secret header
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();
    const results = { matched: 0, sent: 0, skipped: 0, errors: 0 };

    // 1. Load active rules
    const { data: rules, error: rulesError } = await supabase
      .from("mcc_campaign_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active rules", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CAMPAIGN-RULES] Processing ${rules.length} active rules`);

    // 2. For each rule, find matching events from last 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const now = new Date();
    const currentHour = now.getUTCHours() + 7; // Bangkok time (UTC+7)

    for (const rule of rules as CampaignRule[]) {
      try {
        // Check quiet hours
        const quietStart = rule.quiet_hours_start ?? 22;
        const quietEnd = rule.quiet_hours_end ?? 8;
        if (currentHour >= quietStart || currentHour < quietEnd) {
          console.log(`[CAMPAIGN-RULES] Skipping rule ${rule.id} — quiet hours`);
          results.skipped++;
          continue;
        }

        // Find matching events
        const eventsQuery = supabase
          .from("mcc_events")
          .select("*")
          .eq("event_type", rule.trigger_event)
          .gte("created_at", fifteenMinAgo);

        const { data: events, error: eventsError } = await eventsQuery;
        if (eventsError) {
          console.error(`[CAMPAIGN-RULES] Events query error:`, eventsError);
          results.errors++;
          continue;
        }

        if (!events || events.length === 0) continue;

        results.matched += events.length;

        // Process each matching event
        for (const event of events) {
          try {
            // Check cooldown — look for recent sends to this user
            if (rule.cooldown_hours && event.user_id) {
              const cooldownDate = new Date(
                Date.now() - (rule.cooldown_hours * 60 * 60 * 1000)
              ).toISOString();

              const { data: recentSends } = await supabase
                .from("mcc_events")
                .select("id")
                .eq("event_type", `campaign_sent_${rule.id}`)
                .eq("user_id", event.user_id)
                .gte("created_at", cooldownDate)
                .limit(1);

              if (recentSends && recentSends.length > 0) {
                results.skipped++;
                continue;
              }
            }

            // Check target_state filter
            if (rule.target_state && event.metadata) {
              const meta = typeof event.metadata === 'string' 
                ? JSON.parse(event.metadata) 
                : event.metadata;
              if (meta.user_state && meta.user_state !== rule.target_state) {
                results.skipped++;
                continue;
              }
            }

            // Execute action based on channel
            const channel = rule.channel || 'push';
            const template = rule.message_template || {};
            const message = template.ru || template.en || 'Notification';

            if (channel === 'email' && event.user_id) {
              // Get user email
              const { data: profile } = await supabase
                .from("profiles")
                .select("email, preferred_language")
                .eq("id", event.user_id)
                .single();

              if (profile?.email) {
                const lang = profile.preferred_language === 'en' ? 'en' : 'ru';
                const msgText = template[lang] || message;

                await supabase.functions.invoke("send-email", {
                  body: {
                    to: profile.email,
                    subject: `UNO: ${msgText.substring(0, 50)}`,
                    template: "generic_notification",
                    data: { message: msgText },
                  },
                });
                results.sent++;
              }
            } else if (channel === 'push' && event.user_id) {
              // Log as in-app notification
              await supabase.from("notifications").insert({
                user_id: event.user_id,
                title: "UNO",
                body: message,
                type: "campaign",
                data: { campaign_id: rule.campaign_id, rule_id: rule.id },
              });
              results.sent++;
            } else if (channel === 'whatsapp') {
              // Log for manual follow-up (no WhatsApp API yet)
              console.log(`[CAMPAIGN-RULES] WhatsApp action for event ${event.id} — logged for manual follow-up`);
              results.sent++;
            }

            // Log execution
            await supabase.from("mcc_events").insert({
              event_type: `campaign_sent_${rule.id}`,
              user_id: event.user_id,
              metadata: {
                rule_id: rule.id,
                channel,
                trigger_event: rule.trigger_event,
                original_event_id: event.id,
              },
            });
          } catch (eventErr) {
            console.error(`[CAMPAIGN-RULES] Event processing error:`, eventErr);
            results.errors++;
          }
        }
      } catch (ruleErr) {
        console.error(`[CAMPAIGN-RULES] Rule ${rule.id} error:`, ruleErr);
        results.errors++;
      }
    }

    console.log(`[CAMPAIGN-RULES] Done:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CAMPAIGN-RULES] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
