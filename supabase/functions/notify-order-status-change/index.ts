import { createNotifyHandler, sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(createNotifyHandler("notify-order-status-change", async (body) => {
  const { order_id, new_status, reason } = body as {
    order_id: string; new_status: string; reason?: string | null;
  };

  const supabase = createServiceClient();

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("order_number, order_type, total_amount, currency, customer_user_id, start_at")
    .eq("id", order_id)
    .single();

  if (orderError || !order) throw new Error("Order not found");

  // Fetch customer profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_language")
    .eq("id", order.customer_user_id)
    .single();

  // Fetch customer email
  const { data: authUser } = await supabase.auth.admin.getUserById(order.customer_user_id);
  const customerEmail = authUser?.user?.email;
  if (!customerEmail) throw new Error("Customer email not found");

  const customerName = profile?.full_name || "Customer";
  const language: "en" | "ru" = profile?.preferred_language === "ru" ? "ru" : "en";
  const orderNum = order.order_number || order_id.slice(0, 8);

  // Build status-specific color
  const statusColors: Record<string, string> = {
    confirmed: "#10b981", in_progress: "#3b82f6",
    completed: "#10b981", cancelled: "#ef4444",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmed", in_progress: "In Progress",
    completed: "Completed", cancelled: "Cancelled",
  };

  const sections = [
    { label: "Order", value: `#${orderNum}` },
    { label: "Type", value: order.order_type || "general" },
    { label: "Amount", value: `${order.total_amount || 0} ${order.currency || "THB"}` },
    { label: "Status", value: statusLabels[new_status] || new_status },
    ...(reason ? [{ label: "Reason", value: reason }] : []),
  ];

  const html = buildEmailHtml({
    title: `Order ${statusLabels[new_status] || new_status}`,
    subtitle: `Hi ${customerName}, your order status has been updated`,
    color: statusColors[new_status] || "#6b7280",
    sections,
    ctaText: "View Your Orders",
    ctaUrl: "https://uno.ae/bookings",
  });

  await sendEmail({
    to: customerEmail,
    subject: `Order #${orderNum} — ${statusLabels[new_status] || new_status}`,
    html,
    from: "myUNO <noreply@resend.dev>",
  });

  // Create in-app notification
  const notifTexts: Record<string, { en: { title: string; body: string }; ru: { title: string; body: string } }> = {
    confirmed: {
      en: { title: "Order Confirmed!", body: `Your order #${order.order_number} has been confirmed.` },
      ru: { title: "Заказ подтверждён!", body: `Ваш заказ #${order.order_number} подтверждён.` },
    },
    in_progress: {
      en: { title: "Order In Progress", body: `Your order #${order.order_number} is being processed.` },
      ru: { title: "Заказ в работе", body: `Ваш заказ #${order.order_number} в обработке.` },
    },
    completed: {
      en: { title: "Order Completed!", body: `Your order #${order.order_number} has been completed. Thank you!` },
      ru: { title: "Заказ выполнен!", body: `Ваш заказ #${order.order_number} выполнен. Спасибо!` },
    },
    cancelled: {
      en: { title: "Order Cancelled", body: `Your order #${order.order_number} has been cancelled.${reason ? ` Reason: ${reason}` : ""}` },
      ru: { title: "Заказ отменён", body: `Ваш заказ #${order.order_number} отменён.${reason ? ` Причина: ${reason}` : ""}` },
    },
  };

  const notif = notifTexts[new_status]?.[language];
  if (notif) {
    await supabase.from("notifications").insert({
      user_id: order.customer_user_id,
      type: "order_status",
      title: notif.title,
      body: notif.body,
      data: { order_id, status: new_status },
    });
  }

  return { success: true };
}));
