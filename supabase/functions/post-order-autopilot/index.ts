import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();
    const results = { review_requests: 0, review_reminders: 0, cross_sell: 0, errors: 0 };
    const now = new Date();

    // Get post_order templates
    const { data: templates } = await supabase
      .from("lifecycle_templates")
      .select("*")
      .in("trigger_type", ["post_order_review", "cross_sell"])
      .eq("is_active", true);

    const reviewTemplate = (templates || []).find(
      (t) => t.trigger_type === "post_order_review"
    );
    const crossSellTemplate = (templates || []).find(
      (t) => t.trigger_type === "cross_sell"
    );

    // 1. Orders completed 2+ hours ago — send review request
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, user_id, updated_at")
      .eq("status", "completed")
      .gte("updated_at", fourHoursAgo.toISOString())
      .lte("updated_at", twoHoursAgo.toISOString())
      .limit(50);

    for (const order of recentOrders || []) {
      try {
        // Check if notification already sent
        const { data: existing } = await supabase
          .from("booking_notifications_log")
          .select("id")
          .eq("notification_type", "post_order_review")
          .eq("metadata->>order_id", order.id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        if (reviewTemplate) {
          await supabase.from("booking_notifications_log").insert({
            notification_type: "post_order_review",
            channel: reviewTemplate.channel,
            subject: reviewTemplate.title_ru,
            body: reviewTemplate.body_ru,
            metadata: {
              user_id: order.user_id,
              order_id: order.id,
              template_id: reviewTemplate.id,
              automated: true,
            },
          });
          results.review_requests++;
        }
      } catch {
        results.errors++;
      }
    }

    // 2. Orders completed 24+ hours ago with no review — reminder
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: dayOldOrders } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("status", "completed")
      .gte("updated_at", twoDaysAgo.toISOString())
      .lte("updated_at", oneDayAgo.toISOString())
      .limit(50);

    for (const order of dayOldOrders || []) {
      try {
        // Check if reminder already sent
        const { data: existing } = await supabase
          .from("booking_notifications_log")
          .select("id")
          .eq("notification_type", "post_order_review_reminder")
          .eq("metadata->>order_id", order.id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Check if user already left a review
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id")
          .eq("user_id", order.user_id)
          .eq("order_id", order.id)
          .limit(1);

        if (reviews && reviews.length > 0) continue;

        await supabase.from("booking_notifications_log").insert({
          notification_type: "post_order_review_reminder",
          channel: "push",
          subject: "Не забудьте оставить отзыв ⭐",
          body: "Ваше мнение очень важно для нас и других пользователей.",
          metadata: {
            user_id: order.user_id,
            order_id: order.id,
            automated: true,
          },
        });
        results.review_reminders++;
      } catch {
        results.errors++;
      }
    }

    // 3. Orders completed 7+ days ago — cross-sell
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const { data: weekOldOrders } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("status", "completed")
      .gte("updated_at", eightDaysAgo.toISOString())
      .lte("updated_at", sevenDaysAgo.toISOString())
      .limit(30);

    for (const order of weekOldOrders || []) {
      try {
        const { data: existing } = await supabase
          .from("booking_notifications_log")
          .select("id")
          .eq("notification_type", "cross_sell")
          .eq("metadata->>order_id", order.id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        if (crossSellTemplate) {
          await supabase.from("booking_notifications_log").insert({
            notification_type: "cross_sell",
            channel: crossSellTemplate.channel,
            subject: crossSellTemplate.title_ru,
            body: crossSellTemplate.body_ru,
            metadata: {
              user_id: order.user_id,
              order_id: order.id,
              template_id: crossSellTemplate.id,
              automated: true,
            },
          });
          results.cross_sell++;
        }
      } catch {
        results.errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
