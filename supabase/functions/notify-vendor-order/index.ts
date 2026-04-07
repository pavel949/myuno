/**
 * notify-vendor-order — Notifies vendor/supplier when they receive a new order.
 * Creates in-app notification + sends email via Resend.
 * Called from stripe-webhook after order is confirmed, or from order creation flow.
 */
import { Resend } from 'npm:resend@2.0.0';
import { createServiceClient } from '../_shared/supabase.ts';
import { sendWhatsApp } from '../_shared/whatsapp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VendorOrderPayload {
  order_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const { order_id }: VendorOrderPayload = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order with provider info
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, order_type, total_amount, currency, provider_org_id, customer_user_id, vertical, notes, start_at')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      console.error('Order not found:', order_id);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.provider_org_id) {
      console.log('No provider_org_id on order, skipping vendor notification');
      return new Response(
        JSON.stringify({ success: true, skipped: 'no_provider' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get provider org members (to notify vendor staff)
    const { data: provider } = await supabase
      .from('providers')
      .select('id, name_en, name_ru, email, phone, user_id')
      .eq('id', order.provider_org_id)
      .single();

    if (!provider) {
      console.log('Provider not found:', order.provider_org_id);
      return new Response(
        JSON.stringify({ success: true, skipped: 'provider_not_found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get customer name
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', order.customer_user_id)
      .single();

    const customerName = customerProfile?.full_name || 'Customer';
    const results = { notification: false, email: false, whatsapp: false };

    // 1. Create in-app notification for vendor owner
    if (provider.user_id) {
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: provider.user_id,
          title: '🔔 New Order Received!',
          body: `Order #${order.order_number || order.id.slice(0, 8).toUpperCase()} — ${order.total_amount} ${order.currency} from ${customerName}`,
          type: 'order',
          data: {
            order_id: order.id,
            order_type: order.order_type,
            total_amount: order.total_amount,
            action_url: `/vendor/bookings`,
          },
        });

      if (!notifErr) results.notification = true;
      else console.error('Notification error:', notifErr);
    }

    // 2. Send email to vendor
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && provider.email) {
      try {
        const resend = new Resend(resendKey);
        const scheduledAt = order.start_at
          ? new Date(order.start_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Not scheduled';

        await resend.emails.send({
          from: 'myUNO Orders <orders@resend.dev>',
          to: [provider.email],
          subject: `🔔 New Order #${order.order_number || order.id.slice(0, 8).toUpperCase()} — ${order.total_amount} ${order.currency}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🔔 New Order!</h1>
                <p style="margin: 8px 0 0; opacity: 0.9;">${order.order_type || 'Service'} order for ${provider.name_en}</p>
              </div>
              <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
                <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Order Number</p>
                  <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold;">#${order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Amount</p>
                  <p style="margin: 4px 0 0; font-size: 24px; font-weight: bold; color: #059669;">${order.total_amount} ${order.currency}</p>
                </div>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Customer</p>
                  <p style="margin: 4px 0 0; font-size: 16px;">${customerName}</p>
                </div>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Scheduled</p>
                  <p style="margin: 4px 0 0; font-size: 16px;">📅 ${scheduledAt}</p>
                </div>
                ${order.notes ? `<div style="background: white; padding: 16px; border-radius: 8px;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Notes</p><p style="margin: 4px 0 0;">${order.notes}</p></div>` : ''}
                <a href="https://uno.ae/vendor/bookings" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px; font-weight: bold;">View & Confirm Order →</a>
              </div>
              <div style="background: #1f2937; color: white; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
                <p style="margin: 0; font-size: 12px; opacity: 0.7;">myUNO Platform — Vendor Notification</p>
              </div>
            </div>
          `,
        });
        results.email = true;
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }
    }

    // 3. WhatsApp to vendor (if phone available)
    if (provider.phone) {
      const phone = provider.phone.replace(/[^0-9]/g, '');
      if (phone.length >= 9) {
        const sent = await sendWhatsApp({
          to: phone,
          body: `🔔 *New Order on myUNO!*\n\n📦 #${order.order_number || order.id.slice(0, 8).toUpperCase()}\n💰 ${order.total_amount} ${order.currency}\n👤 ${customerName}\n\n👉 Confirm: https://uno.ae/vendor/bookings`,
        });
        results.whatsapp = sent;
      }
    }

    console.log(`[notify-vendor-order] Results for order ${order_id}:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('notify-vendor-order error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
