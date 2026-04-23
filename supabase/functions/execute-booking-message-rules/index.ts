/**
 * execute-booking-message-rules
 * P1: Executes booking_message_rules for orders (property bookings).
 * Invoke via cron (e.g. hourly) with X-Internal-Secret.
 * Matches rules by trigger_event + timing, sends via channel, logs to booking_notifications_log.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const NOTIFICATION_TYPE = "booking_message_rule";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const immediateOrderId = body.immediate_order_id as string | undefined;

    const secretGuard = requireInternalSecret(req, corsHeaders);
    const hasInternalSecret = !secretGuard;

    if (!hasInternalSecret) {
      if (!immediateOrderId) return secretGuard!;
      const authResult = await requireAuth(req, corsHeaders);
      if (authResult instanceof Response) return authResult;
    }

    const supabase = createServiceClient();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const nowMs = now.getTime();

    const { data: rules, error: rulesErr } = await supabase
      .from("booking_message_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return json({ processed: 0, message: "No active rules" });
    }

    let processed = 0;
    let errors = 0;

    for (const rule of rules) {
      if (immediateOrderId && rule.trigger_event !== "booking_confirmed") continue;
      try {
        const matches = immediateOrderId
          ? await fetchOrderById(supabase, immediateOrderId, rule)
          : await findMatchingOrders(supabase, rule, today, nowMs);
        for (const order of matches) {
          const alreadySent = await alreadySentFor(supabase, order.id, rule.id);
          if (alreadySent) continue;

          const guestEmail = order.order_participants?.find((p: { role: string }) => p.role === "guest")?.email;
          const guestName = order.order_participants?.find((p: { role: string }) => p.role === "guest")?.name || "Guest";
          const subject = rule.custom_subject_ru || rule.custom_subject || `Booking: ${rule.trigger_event}`;
          const body = rule.custom_body_ru || rule.custom_body || `Hello ${guestName}, your booking details.`;

          if (rule.channel === "in_app") {
            await supabase.from("booking_notifications_log").insert({
              booking_id: null,
              notification_type: NOTIFICATION_TYPE,
              channel: "in_app",
              subject,
              body,
              sent_at: now.toISOString(),
              metadata: { order_id: order.id, rule_id: rule.id, trigger_event: rule.trigger_event },
            });
          } else if (rule.channel === "email" && guestEmail) {
            const resendKey = Deno.env.get("RESEND_API_KEY");
            if (resendKey) {
              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "myUNO <noreply@myuno.ai>",
                  to: [guestEmail],
                  subject,
                  html: `<p>${body.replace(/\n/g, "</p><p>")}</p>`,
                }),
              });
              if (!res.ok) throw new Error(await res.text());
            }
            await supabase.from("booking_notifications_log").insert({
              booking_id: null,
              notification_type: NOTIFICATION_TYPE,
              channel: "email",
              subject,
              body,
              sent_at: now.toISOString(),
              metadata: { order_id: order.id, rule_id: rule.id, trigger_event: rule.trigger_event },
            });
          }
          processed++;
        }
      } catch (err) {
        console.error(`[execute-booking-message-rules] Rule ${rule.id}:`, err);
        errors++;
      }
    }

    return json({ processed, errors });
  } catch (error) {
    console.error("[execute-booking-message-rules]", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchOrderById(supabase: any, orderId: string, rule: any) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, start_at, end_at, status,
      order_items!inner(id, resource_id, start_at, end_at),
      order_participants(id, role, name, email)
    `)
    .eq("id", orderId)
    .eq("vertical", "property")
    .is("deleted_at", null)
    .single();
  if (error || !data) return [];
  if (rule.property_id && data.order_items?.[0]?.resource_id !== rule.property_id) return [];
  return [data];
}

async function findMatchingOrders(supabase: any, rule: any, today: string, nowMs: number) {
  const propertyFilter = rule.property_id ? { "order_items.resource_id": rule.property_id } : {};
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, start_at, end_at, status,
      order_items!inner(id, resource_id, start_at, end_at),
      order_participants(id, role, name, email)
    `)
    .eq("vertical", "property")
    .eq("order_items.item_type", "property")
    .is("deleted_at", null)
    .not("status", "eq", "cancelled");

  if (error || !orders) return [];

  let filtered = orders;
  if (rule.property_id) {
    filtered = orders.filter((o: any) => o.order_items?.[0]?.resource_id === rule.property_id);
  }

  const matches: any[] = [];
  const delayH = rule.delay_hours || 0;
  const delayMs = delayH * 60 * 60 * 1000;

  for (const o of filtered) {
    const item = o.order_items?.[0];
    const checkIn = item?.start_at ? new Date(item.start_at) : new Date(o.start_at);
    const checkOut = item?.end_at ? new Date(item.end_at) : new Date(o.end_at);
    const checkInDate = checkIn.toISOString().split("T")[0];
    const checkOutDate = checkOut.toISOString().split("T")[0];

    let match = false;
    switch (rule.trigger_event) {
      case "booking_confirmed":
        match = false;
        break;
      case "pre_check_in":
        match = nowMs >= checkIn.getTime() - delayMs && nowMs < checkIn.getTime();
        break;
      case "check_in_day":
        match = today === checkInDate;
        break;
      case "post_check_in":
        match = nowMs >= checkIn.getTime() + delayMs && today === checkInDate;
        break;
      case "pre_check_out":
        match = nowMs >= checkOut.getTime() - delayMs && nowMs < checkOut.getTime();
        break;
      case "check_out_day":
        match = today === checkOutDate;
        break;
      case "post_check_out":
      case "review_request":
        match = nowMs >= checkOut.getTime() + delayMs;
        break;
      default:
        break;
    }
    if (match) matches.push(o);
  }

  return matches;
}

async function alreadySentFor(supabase: any, orderId: string, ruleId: string): Promise<boolean> {
  const { data } = await supabase
    .from("booking_notifications_log")
    .select("id")
    .eq("notification_type", NOTIFICATION_TYPE)
    .eq("metadata->>order_id", orderId)
    .eq("metadata->>rule_id", ruleId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

function json(obj: object) {
  return new Response(JSON.stringify(obj), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
