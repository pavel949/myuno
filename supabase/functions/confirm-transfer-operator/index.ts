// Operator confirms transfer booking via HMAC-signed link
// GET /functions/v1/confirm-transfer-operator?id=<order_id>&t=<exp.sig>
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { NOTIFY_CORS as corsHeaders } from '../_shared/notify-utils.ts';

const sb = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function verifyToken(orderId: string, token: string): Promise<boolean> {
  const [expStr, sigHex] = token.split('.');
  if (!expStr || !sigHex) return false;
  const exp = parseInt(expStr, 10);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false;

  const { data } = await sb().from('system_settings').select('value').eq('key', 'transfer_operator_confirm_secret').single();
  const secret = (typeof data?.value === 'string' ? data.value : JSON.parse(JSON.stringify(data?.value))) as string;
  if (!secret) return false;

  const payload = `${orderId}.${exp}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedHex === sigHex;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json() : Object.fromEntries(new URL(req.url).searchParams);
    const orderId = body.id || body.order_id;
    const token = body.t || body.token;

    if (!orderId || !token) {
      return new Response(JSON.stringify({ error: 'Missing id or token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ok = await verifyToken(orderId, token);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order
    const { data: order, error: fetchErr } = await sb()
      .from('orders')
      .select('id, order_number, status, total_amount, currency, customer_email, customer_phone, customer_name, metadata')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'confirmed') {
      return new Response(JSON.stringify({ success: true, already_confirmed: true, order_number: order.order_number }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status
    await sb().from('orders').update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    }).eq('id', orderId);

    await sb().from('order_status_history').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: 'confirmed',
      changed_by_role: 'operator',
      note: 'Confirmed by operator via signed link',
    }).catch(() => {});

    // Meeting point info
    const { data: mp } = await sb()
      .from('transfer_meeting_points')
      .select('name_ru, name_en, address_ru, address_en, photo_url, instructions_ru, instructions_en, contact_phone')
      .eq('is_default', true)
      .maybeSingle();

    const { data: op } = await sb()
      .from('transfer_operators')
      .select('name, whatsapp_number')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Notify customer
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && order.customer_email) {
      const resend = new Resend(resendKey);
      const html = `
<div style="font-family:Arial;color:#333;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;border-radius:12px 12px 0 0">
    <h1 style="margin:0">✅ Бронирование подтверждено</h1>
    <p style="margin:6px 0 0;opacity:.9">Заказ #${order.order_number}</p>
  </div>
  <div style="background:#fff;padding:20px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
    <p>Здравствуйте, ${order.customer_name || ''}!</p>
    <p>Оператор <b>${op?.name || 'Klod'}</b> подтвердил ваш трансфер. Сумма к оплате: <b>${order.currency} ${Number(order.total_amount).toLocaleString()}</b>.</p>
    ${mp ? `
    <h3 style="margin-top:20px">📍 Точка встречи</h3>
    <p><b>${mp.name_ru || mp.name_en}</b><br/>${mp.address_ru || mp.address_en || ''}</p>
    ${mp.photo_url ? `<img src="${mp.photo_url}" alt="Meeting point" style="max-width:100%;border-radius:8px;margin:8px 0"/>` : ''}
    ${mp.instructions_ru ? `<p style="background:#fffbeb;padding:12px;border-radius:8px">${mp.instructions_ru}</p>` : ''}
    ` : ''}
    <h3>📱 Контакт оператора</h3>
    <p><b>${op?.name || 'Klod'}</b><br/>WhatsApp: <a href="https://wa.me/${(op?.whatsapp_number || '').replace(/[^0-9]/g, '')}">+${op?.whatsapp_number || ''}</a></p>
    ${mp?.contact_phone ? `<p>Доп. контакт: <a href="tel:${mp.contact_phone}">${mp.contact_phone}</a></p>` : ''}
  </div>
</div>`;
      await resend.emails.send({
        from: 'myUNO <noreply@resend.dev>',
        to: [order.customer_email],
        subject: `✅ Трансфер #${order.order_number} подтверждён`,
        html,
      }).catch(e => console.error('[email] customer confirm failed', e));
    }

    // WhatsApp customer
    const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
    const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');
    if (ultraMsgInstance && ultraMsgToken && order.customer_phone) {
      const waMsg = `✅ *Трансфер #${order.order_number} подтверждён*\n\nОператор ${op?.name || 'Klod'} принял ваш заказ.\nСумма: ฿${Number(order.total_amount).toLocaleString()}\n\n📱 Связь с водителем: +${op?.whatsapp_number || ''}\n${mp ? `\n📍 ${mp.name_ru || mp.name_en}` : ''}`;
      await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraMsgToken,
          to: `+${order.customer_phone.replace(/[^0-9]/g, '')}`,
          body: waMsg,
        }),
      }).catch(e => console.error('[WA] customer confirm failed', e));
    }

    await sb().from('booking_notifications_log').insert({
      order_id: orderId,
      notification_type: 'transfer_confirmed',
      channels: ['whatsapp', 'email'],
      recipients: { customer_email: order.customer_email, customer_phone: order.customer_phone },
      status: 'sent',
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, order_number: order.order_number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[confirm-transfer-operator] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
