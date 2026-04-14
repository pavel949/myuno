/**
 * notify-vendor-order — Notifies vendor/supplier when they receive a new order.
 * Creates in-app notification + sends email via Resend + WhatsApp.
 */
import { createNotifyHandler, sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

Deno.serve(createNotifyHandler("notify-vendor-order", async (body) => {
  const { order_id } = body as { order_id: string };
  if (!order_id) throw new Error("order_id required");

  const supabase = createServiceClient();

  // Fetch order with provider info
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, order_number, order_type, total_amount, currency, provider_org_id, customer_user_id, vertical, notes, start_at")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) throw new Error("Order not found");
  if (!order.provider_org_id) return { success: true, skipped: "no_provider" };

  // Get provider
  const { data: provider } = await supabase
    .from("providers")
    .select("id, name_en, name_ru, email, phone, user_id")
    .eq("id", order.provider_org_id)
    .single();

  if (!provider) return { success: true, skipped: "provider_not_found" };

  // Get customer name
  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", order.customer_user_id)
    .single();

  const customerName = customerProfile?.full_name || "Customer";
  const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();
  const results = { notification: false, email: false, whatsapp: false };

  // 1. Create in-app notification for vendor owner
  if (provider.user_id) {
    const { error: notifErr } = await supabase
      .from("notifications")
      .insert({
        user_id: provider.user_id,
        title: "New Order Received!",
        body: `Order #${orderNum} — ${order.total_amount} ${order.currency} from ${customerName}`,
        type: "order",
        data: {
          order_id: order.id,
          order_type: order.order_type,
          total_amount: order.total_amount,
          action_url: "/vendor/bookings",
        },
      });
    if (!notifErr) results.notification = true;
    else console.error("Notification error:", notifErr);
  }

  // 2. Send email to vendor
  if (provider.email) {
    const scheduledAt = order.start_at
      ? new Date(order.start_at).toLocaleString("en-GB", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "Not scheduled";

    const sections = [
      { label: "Order Number", value: `#${orderNum}` },
      { label: "Amount", value: `${order.total_amount} ${order.currency}` },
      { label: "Customer", value: customerName },
      { label: "Scheduled", value: scheduledAt },
      ...(order.notes ? [{ label: "Notes", value: order.notes }] : []),
    ];

    const html = buildEmailHtml({
      title: "New Order!",
      subtitle: `${order.order_type || "Service"} order for ${provider.name_en}`,
      color: "#10b981",
      sections,
      ctaText: "View & Confirm Order",
      ctaUrl: "https://uno.ae/vendor/bookings",
      footer: "myUNO Platform — Vendor Notification",
    });

    const emailResult = await sendEmail({
      to: provider.email,
      subject: `New Order #${orderNum} — ${order.total_amount} ${order.currency}`,
      html,
      from: "myUNO Orders <orders@resend.dev>",
    });
    results.email = emailResult.success;
  }

  // 3. WhatsApp to vendor (if phone available)
  if (provider.phone) {
    const phone = provider.phone.replace(/[^0-9]/g, "");
    if (phone.length >= 9) {
      results.whatsapp = await sendWhatsApp({
        to: phone,
        body: `*New Order on myUNO!*\n\n#${orderNum}\n${order.total_amount} ${order.currency}\n${customerName}\n\nConfirm: https://uno.ae/vendor/bookings`,
      });
    }
  }

  console.log(`[notify-vendor-order] Results for order ${order_id}:`, results);
  return { success: true, results };
}));
