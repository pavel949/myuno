import { Resend } from 'npm:resend@2.0.0';
import { getAdminEmails, getAdminWhatsApp } from '../_shared/admin-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TransferNotifyPayload {
  order_id: string;
  order_number: string;
  direction: string;
  terminal: string;
  flight_number: string;
  vehicle_name: string;
  meeting_sign_name: string;
  passengers: number;
  luggage: number;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  total_amount: number;
  currency: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes?: string;
}

async function sendWhatsAppNotification(p: TransferNotifyPayload): Promise<void> {
  try {
    const dirEmoji = p.direction === 'from-airport' ? '✈️→🏠' : '🏠→✈️';
    const dirLabel = p.direction === 'from-airport' ? 'Из аэропорта' : 'В аэропорт';
    const payLabel = p.payment_method === 'stripe' ? '💳 Stripe' : '🤝 Консьерж';
    
    const date = new Date(p.scheduled_at);
    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const message = `🚗 *ТРАНСФЕР — НОВЫЙ ЗАКАЗ*

${dirEmoji} *${dirLabel}*
📋 Заказ: #${p.order_number}

✈️ *Рейс:* ${p.flight_number}
🏢 *Терминал:* ${p.terminal === 'international' ? 'Международный' : 'Внутренний'}
📅 *Дата:* ${dateStr} в ${timeStr}

🚗 *Авто:* ${p.vehicle_name}
👥 *Пассажиры:* ${p.passengers} | 🧳 *Багаж:* ${p.luggage}
🪧 *Табличка:* ${p.meeting_sign_name}

📍 *Откуда:* ${p.pickup_address}
📍 *Куда:* ${p.dropoff_address}

💰 *Итого:* ${p.currency} ${p.total_amount.toLocaleString()}
${payLabel}

👤 *Клиент:* ${p.customer_name}
📱 ${p.customer_phone}
📧 ${p.customer_email}
${p.notes ? `\n📝 *Заметки:* ${p.notes}` : ''}`;

    console.log('[WhatsApp] Transfer notification for:', ADMIN_WHATSAPP);

    const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
    const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');

    if (ultraMsgInstance && ultraMsgToken) {
      const response = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraMsgToken,
          to: `+${ADMIN_WHATSAPP}`,
          body: message,
        }),
      });
      const result = await response.json();
      console.log('[WhatsApp] UltraMsg response:', result);
    } else {
      console.log('[WhatsApp] No API configured, logged message only');
    }
  } catch (error) {
    console.error('[WhatsApp] Error:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ADMIN_EMAIL = (await getAdminEmails())[0];
  const ADMIN_WHATSAPP = await getAdminWhatsApp();

  try {
    const p: TransferNotifyPayload = await req.json();
    console.log('[Transfer] Notify for order:', p.order_number);

    const date = new Date(p.scheduled_at);
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dirLabel = p.direction === 'from-airport' ? 'Airport → Hotel' : 'Hotel → Airport';
    const payLabel = p.payment_method === 'stripe' ? 'Online (Stripe)' : 'Concierge Advance';

    // 1. Send WhatsApp (non-blocking)
    sendWhatsAppNotification(p).catch(err => console.error('[WhatsApp] Failed:', err));

    // 2. Send emails
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const resend = new Resend(resendKey);

      // Admin email
      const adminHtml = `
<!DOCTYPE html><html><head><style>
  body{font-family:Arial,sans-serif;color:#333;line-height:1.6;margin:0;padding:0}
  .c{max-width:600px;margin:0 auto}
  .h{background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;border-radius:12px 12px 0 0}
  .b{background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px}
  .d{background:#fff;padding:16px;border-radius:8px;margin:12px 0;border:1px solid #f3f4f6}
  .l{font-weight:700;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
  .v{font-size:16px;font-weight:600;margin-top:4px}
  .price{font-size:28px;font-weight:800;color:#059669}
</style></head><body>
<div class="c">
  <div class="h">
    <h1 style="margin:0;font-size:22px">🚗 Airport Transfer</h1>
    <p style="margin:6px 0 0;opacity:.9">${dirLabel} · ${p.flight_number} · ${dateStr}</p>
  </div>
  <div class="b">
    <div class="d">
      <div class="l">Order</div>
      <div class="v">#${p.order_number}</div>
    </div>
    <div class="d">
      <div class="l">Flight & Schedule</div>
      <div class="v">${p.flight_number} · ${p.terminal === 'international' ? 'International' : 'Domestic'} Terminal</div>
      <div>📅 ${dateStr} at ${timeStr}</div>
    </div>
    <div class="d">
      <div class="l">Vehicle</div>
      <div class="v">${p.vehicle_name}</div>
      <div>👥 ${p.passengers} pax · 🧳 ${p.luggage} bags</div>
    </div>
    <div class="d">
      <div class="l">Route</div>
      <div>📍 <strong>From:</strong> ${p.pickup_address}</div>
      <div>📍 <strong>To:</strong> ${p.dropoff_address}</div>
    </div>
    <div class="d">
      <div class="l">Meeting Sign</div>
      <div class="v">🪧 ${p.meeting_sign_name}</div>
    </div>
    <div class="d">
      <div class="l">Payment</div>
      <div class="price">${p.currency} ${p.total_amount.toLocaleString()}</div>
      <div>${payLabel}</div>
    </div>
    <div class="d">
      <div class="l">Customer</div>
      <div class="v">${p.customer_name}</div>
      <div>📱 ${p.customer_phone} · 📧 ${p.customer_email}</div>
      ${p.notes ? `<div style="margin-top:8px;padding:8px;background:#fffbeb;border-radius:6px">📝 ${p.notes}</div>` : ''}
    </div>
  </div>
</div>
</body></html>`;

      await resend.emails.send({
        from: 'myUNO Transfer <noreply@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `🚗 Transfer #${p.order_number} — ${p.flight_number} · ${dateStr}`,
        html: adminHtml,
      });
      console.log('[Email] Admin email sent to', ADMIN_EMAIL);

      // Customer confirmation email
      if (p.customer_email) {
        const customerHtml = `
<!DOCTYPE html><html><head><style>
  body{font-family:Arial,sans-serif;color:#333;line-height:1.6;margin:0;padding:0}
  .c{max-width:600px;margin:0 auto}
  .h{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center}
  .b{background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px}
  .d{background:#fff;padding:16px;border-radius:8px;margin:12px 0;border:1px solid #f3f4f6}
  .l{font-weight:700;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
  .v{font-size:16px;font-weight:600;margin-top:4px}
  .badge{display:inline-block;background:#dcfce7;color:#166534;padding:4px 12px;border-radius:20px;font-weight:600;font-size:13px}
  .sign{font-size:24px;font-weight:800;color:#4f46e5;text-align:center;padding:16px;background:#eef2ff;border-radius:8px;margin:12px 0}
  .footer{text-align:center;padding:16px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="c">
  <div class="h">
    <h1 style="margin:0;font-size:22px">✅ Transfer Confirmed</h1>
    <p style="margin:8px 0 0;opacity:.9">Order #${p.order_number}</p>
  </div>
  <div class="b">
    <p style="text-align:center"><span class="badge">🚗 ${p.vehicle_name}</span></p>
    
    <div class="d">
      <div class="l">✈️ Flight</div>
      <div class="v">${p.flight_number}</div>
      <div>📅 ${dateStr} at ${timeStr}</div>
      <div>🏢 ${p.terminal === 'international' ? 'International' : 'Domestic'} Terminal</div>
    </div>

    ${p.direction === 'from-airport' ? `<div class="sign">🪧 ${p.meeting_sign_name}</div>
    <p style="text-align:center;color:#6b7280;font-size:13px">Your driver will meet you with this name sign at the terminal exit</p>` : ''}

    <div class="d">
      <div class="l">📍 Route</div>
      <div style="margin-top:6px"><strong>From:</strong> ${p.pickup_address}</div>
      <div><strong>To:</strong> ${p.dropoff_address}</div>
    </div>

    <div class="d" style="text-align:center">
      <div class="l">💰 Total</div>
      <div style="font-size:28px;font-weight:800;color:#059669;margin-top:4px">${p.currency} ${p.total_amount.toLocaleString()}</div>
    </div>

    <div class="footer">
      <p>Need help? Contact us via WhatsApp</p>
      <p>myUNO · Your Phuket Concierge</p>
    </div>
  </div>
</div>
</body></html>`;

        await resend.emails.send({
          from: 'myUNO <noreply@resend.dev>',
          to: [p.customer_email],
          subject: `✅ Transfer Confirmed — ${p.flight_number} · ${dateStr}`,
          html: customerHtml,
        });
        console.log('[Email] Customer email sent to', p.customer_email);
      }
    } else {
      console.log('[Email] RESEND_API_KEY not configured');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[Transfer Notify] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
