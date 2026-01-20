import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderNotificationPayload {
  order_id: string;
  order_number: string;
  order_type: string;
  total_amount: number;
  currency: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  scheduled_at?: string;
  notes?: string;
  provider_name?: string;
}

const ADMIN_EMAIL = 'admin@uno.ae'; // Default admin email

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
    const payload: OrderNotificationPayload = await req.json();

    console.log('Sending admin notification for order:', payload.order_number);

    // Format order type for display
    const orderTypeLabels: Record<string, string> = {
      restaurant: '🍽️ Restaurant Order',
      flowers: '💐 Flower Delivery',
      yacht: '🛥️ Yacht Charter',
      tour: '🗺️ Tour Booking',
      transport: '🚗 Transport',
      cleaning: '🧹 Cleaning Service',
      beauty: '💅 Beauty Service',
      medical: '🏥 Medical Appointment',
      pet: '🐾 Pet Service',
      education: '📚 Education',
      legal: '⚖️ Legal Service',
      event: '🎉 Event Booking',
      property: '🏠 Property Rental',
      water_activity: '🌊 Water Activity',
      general: '📦 General Order',
    };

    const orderTypeLabel = orderTypeLabels[payload.order_type] || `📦 ${payload.order_type}`;

    // Format items list
    const itemsList = payload.items?.map(item => 
      `• ${item.name} x${item.quantity} - ${item.price} ${payload.currency}`
    ).join('\n') || 'No items specified';

    // Format scheduled time
    const scheduledTime = payload.scheduled_at 
      ? new Date(payload.scheduled_at).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Not scheduled';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; }
          .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; margin-bottom: 10px; }
          .total { font-size: 24px; font-weight: bold; color: #059669; }
          .items { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; white-space: pre-line; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 New Order Received!</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${orderTypeLabel}</p>
          </div>
          
          <div class="content">
            <div class="order-details">
              <div class="label">Order Number</div>
              <div class="value" style="font-size: 20px; font-weight: bold;">#${payload.order_number}</div>
              
              <div class="label">Total Amount</div>
              <div class="total">${payload.total_amount} ${payload.currency}</div>
            </div>

            <div class="order-details">
              <div class="label">Customer Information</div>
              <div class="value">
                <strong>${payload.customer_name || 'Guest'}</strong><br>
                ${payload.customer_email ? `📧 ${payload.customer_email}<br>` : ''}
                ${payload.customer_phone ? `📱 ${payload.customer_phone}` : ''}
              </div>
            </div>

            ${payload.provider_name ? `
            <div class="order-details">
              <div class="label">Provider</div>
              <div class="value">${payload.provider_name}</div>
            </div>
            ` : ''}

            <div class="order-details">
              <div class="label">Items Ordered</div>
              <div class="items">${itemsList}</div>
            </div>

            <div class="order-details">
              <div class="label">Scheduled For</div>
              <div class="value">📅 ${scheduledTime}</div>
              
              ${payload.notes ? `
              <div class="label" style="margin-top: 10px;">Notes</div>
              <div class="value">${payload.notes}</div>
              ` : ''}
            </div>

            <a href="https://uno.ae/admin/operations" class="button">
              View in Operations Hub →
            </a>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">UNO Platform - Operations Team</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated notification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'UNO Orders <orders@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `🔔 New Order #${payload.order_number} - ${orderTypeLabel}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending admin notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
