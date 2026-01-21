import { Resend } from 'https://esm.sh/resend@2.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import {
  generateOrderConfirmationEmail,
  generateOrderCancellationEmail,
  generateWalletTopUpEmail,
} from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOrderEmailPayload {
  type: 'order_confirmation' | 'order_cancellation' | 'wallet_topup';
  order_id?: string;
  user_id?: string;
  // For wallet topup
  amount?: number;
  currency?: string;
  new_balance?: number;
  // Optional overrides
  language?: 'en' | 'ru';
  reason?: string;
  refund_amount?: number;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[SEND-ORDER-EMAIL] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      logStep('ERROR', 'RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendKey);
    const payload: SendOrderEmailPayload = await req.json();

    logStep('Processing email request', { type: payload.type, order_id: payload.order_id });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let customerEmail: string | null = null;
    let customerName = 'Customer';
    let language: 'en' | 'ru' = payload.language || 'en';

    // Get user info
    const userId = payload.user_id;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, preferred_language')
        .eq('id', userId)
        .single();

      if (profile?.full_name) {
        customerName = profile.full_name;
      }
      if (profile?.preferred_language === 'ru') {
        language = 'ru';
      }

      // Get email from auth.users
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        customerEmail = authUser.user.email;
      }
    }

    if (!customerEmail) {
      logStep('ERROR', 'Customer email not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Customer email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailContent: { subject: string; html: string };

    // ===== ORDER CONFIRMATION =====
    if (payload.type === 'order_confirmation' && payload.order_id) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(`
          order_number,
          order_type,
          total_amount,
          currency,
          scheduled_at,
          order_items (
            item_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', payload.order_id)
        .single();

      if (orderError || !order) {
        logStep('ERROR', `Order not found: ${payload.order_id}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const items = order.order_items?.map((item: { item_name: string | null; quantity: number; unit_price: number }) => ({
        name: item.item_name || 'Item',
        quantity: item.quantity || 1,
        price: item.unit_price || 0,
      })) || [];

      emailContent = generateOrderConfirmationEmail({
        customerName,
        orderNumber: order.order_number,
        orderType: order.order_type || 'general',
        totalAmount: order.total_amount || 0,
        currency: order.currency || 'THB',
        items,
        scheduledAt: order.scheduled_at,
        trackingUrl: `https://uno.ae/orders/${payload.order_id}`,
        language,
      });

      logStep('Generated order confirmation email', { orderNumber: order.order_number });
    }

    // ===== ORDER CANCELLATION =====
    else if (payload.type === 'order_cancellation' && payload.order_id) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('order_number, order_type, total_amount, currency')
        .eq('id', payload.order_id)
        .single();

      if (orderError || !order) {
        logStep('ERROR', `Order not found: ${payload.order_id}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      emailContent = generateOrderCancellationEmail({
        customerName,
        orderNumber: order.order_number,
        orderType: order.order_type || 'general',
        totalAmount: order.total_amount || 0,
        currency: order.currency || 'THB',
        reason: payload.reason,
        refundAmount: payload.refund_amount,
        language,
      });

      logStep('Generated order cancellation email', { orderNumber: order.order_number });
    }

    // ===== WALLET TOP-UP =====
    else if (payload.type === 'wallet_topup') {
      emailContent = generateWalletTopUpEmail({
        customerName,
        amount: payload.amount || 0,
        currency: payload.currency || 'THB',
        newBalance: payload.new_balance || 0,
        language,
      });

      logStep('Generated wallet top-up email');
    }

    else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email type or missing data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'myUNO <noreply@resend.dev>',
      to: [customerEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logStep('Email sent successfully', { emailId: emailResponse.data?.id, to: customerEmail });

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending order email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
