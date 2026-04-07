import { Resend } from 'npm:resend@2.0.0';
import { createServiceClient } from '../_shared/supabase.ts';
import { generateOrderStatusChangeEmail } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusChangePayload {
  order_id: string;
  new_status: string;
  reason?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendKey);
    const payload: StatusChangePayload = await req.json();
    const { order_id, new_status, reason } = payload;

    console.log(`[notify-order-status-change] Processing: order=${order_id}, status=${new_status}`);

    const supabaseAdmin = createServiceClient();

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('order_number, order_type, total_amount, currency, customer_user_id, start_at')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', order_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch customer profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, preferred_language')
      .eq('id', order.customer_user_id)
      .single();

    // Fetch customer email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.customer_user_id);
    const customerEmail = authUser?.user?.email;

    if (!customerEmail) {
      console.error('Customer email not found for user:', order.customer_user_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Customer email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerName = profile?.full_name || 'Customer';
    const language: 'en' | 'ru' = profile?.preferred_language === 'ru' ? 'ru' : 'en';

    // Generate email
    const emailContent = generateOrderStatusChangeEmail({
      customerName,
      orderNumber: order.order_number || order_id.slice(0, 8),
      orderType: order.order_type || 'general',
      totalAmount: order.total_amount || 0,
      currency: order.currency || 'THB',
      newStatus: new_status,
      reason: reason || undefined,
      trackingUrl: `https://uno.ae/bookings`,
      language,
    });

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'myUNO <noreply@resend.dev>',
      to: [customerEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('[notify-order-status-change] Email sent:', emailResponse.data?.id);

    // Create in-app notification
    const notifTexts: Record<string, { en: { title: string; body: string }; ru: { title: string; body: string } }> = {
      confirmed: {
        en: { title: 'Order Confirmed!', body: `Your order #${order.order_number} has been confirmed.` },
        ru: { title: 'Заказ подтверждён!', body: `Ваш заказ #${order.order_number} подтверждён.` },
      },
      in_progress: {
        en: { title: 'Order In Progress', body: `Your order #${order.order_number} is being processed.` },
        ru: { title: 'Заказ в работе', body: `Ваш заказ #${order.order_number} в обработке.` },
      },
      completed: {
        en: { title: 'Order Completed!', body: `Your order #${order.order_number} has been completed. Thank you!` },
        ru: { title: 'Заказ выполнен!', body: `Ваш заказ #${order.order_number} выполнен. Спасибо!` },
      },
      cancelled: {
        en: { title: 'Order Cancelled', body: `Your order #${order.order_number} has been cancelled.${reason ? ` Reason: ${reason}` : ''}` },
        ru: { title: 'Заказ отменён', body: `Ваш заказ #${order.order_number} отменён.${reason ? ` Причина: ${reason}` : ''}` },
      },
    };

    const notif = notifTexts[new_status]?.[language];
    if (notif) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.customer_user_id,
        type: 'order_status',
        title: notif.title,
        body: notif.body,
        data: { order_id, status: new_status },
      });
      console.log('[notify-order-status-change] In-app notification created');
    }

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[notify-order-status-change] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
