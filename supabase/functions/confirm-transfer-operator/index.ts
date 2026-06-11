// Operator confirms transfer booking via HMAC-signed link
// GET /functions/v1/confirm-transfer-operator?id=<order_id>&t=<exp.sig>
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { NOTIFY_CORS as corsHeaders } from '../_shared/notify-utils.ts';

type Lang = 'ru' | 'en' | 'th';

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

// Localized templates RU/EN/TH
const TPL = {
  ru: {
    emailSubject: (n: string) => `✅ Трансфер #${n} подтверждён`,
    title: 'Бронирование подтверждено',
    greet: (name: string) => `Здравствуйте, ${name}!`,
    confirmedBy: (op: string, total: string) => `Оператор <b>${op}</b> подтвердил ваш трансфер. Сумма к оплате: <b>${total}</b>.`,
    meetingPoint: '📍 Точка встречи',
    operatorContact: '📱 Контакт оператора',
    extraContact: 'Доп. контакт',
    waMsg: (n: string, op: string, total: string, opPhone: string, mp?: string) =>
      `✅ *Трансфер #${n} подтверждён*\n\nОператор ${op} принял ваш заказ.\nСумма: ${total}\n\n📱 Связь с водителем: +${opPhone}${mp ? `\n\n📍 ${mp}` : ''}`,
  },
  en: {
    emailSubject: (n: string) => `✅ Transfer #${n} confirmed`,
    title: 'Booking confirmed',
    greet: (name: string) => `Hello ${name}!`,
    confirmedBy: (op: string, total: string) => `Operator <b>${op}</b> has confirmed your transfer. Total: <b>${total}</b>.`,
    meetingPoint: '📍 Meeting point',
    operatorContact: '📱 Operator contact',
    extraContact: 'Additional contact',
    waMsg: (n: string, op: string, total: string, opPhone: string, mp?: string) =>
      `✅ *Transfer #${n} confirmed*\n\nOperator ${op} accepted your booking.\nTotal: ${total}\n\n📱 Driver contact: +${opPhone}${mp ? `\n\n📍 ${mp}` : ''}`,
  },
  th: {
    emailSubject: (n: string) => `✅ ยืนยันการรับส่ง #${n} แล้ว`,
    title: 'ยืนยันการจองแล้ว',
    greet: (name: string) => `สวัสดี ${name}!`,
    confirmedBy: (op: string, total: string) => `เจ้าหน้าที่ <b>${op}</b> ได้ยืนยันการรับส่งของคุณแล้ว ยอดรวม: <b>${total}</b>.`,
    meetingPoint: '📍 จุดนัดพบ',
    operatorContact: '📱 ติดต่อเจ้าหน้าที่',
    extraContact: 'ติดต่อเพิ่มเติม',
    waMsg: (n: string, op: string, total: string, opPhone: string, mp?: string) =>
      `✅ *ยืนยันการรับส่ง #${n} แล้ว*\n\nเจ้าหน้าที่ ${op} ยืนยันคำสั่งของคุณ\nยอดรวม: ${total}\n\n📱 ติดต่อคนขับ: +${opPhone}${mp ? `\n\n📍 ${mp}` : ''}`,
  },
} as const;

function pickMeetingPoint(mp: any, lang: Lang) {
  if (!mp) return null;
  const name = lang === 'th' ? (mp.name_th || mp.name_en) : lang === 'en' ? mp.name_en : (mp.name_ru || mp.name_en);
  const description = lang === 'th' ? (mp.description_th || mp.description_en) : lang === 'en' ? mp.description_en : (mp.description_ru || mp.description_en);
  return { name, description, photo_url: mp.photo_url, google_maps_url: mp.google_maps_url };
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

    // Record ledger entries (idempotent) so admin Финансы panel reflects this booking.
    await sb().rpc('record_ledger_entries', { p_order_id: orderId }).then(({ error }) => {
      if (error) console.error('[confirm] record_ledger_entries failed', error);
    });

    const meta = (order.metadata || {}) as Record<string, unknown>;
    const customerLang: Lang = (meta.language === 'en' || meta.language === 'th' || meta.language === 'ru')
      ? (meta.language as Lang)
      : 'ru';
    const t = TPL[customerLang];

    const { data: mp } = await sb()
      .from('transfer_meeting_points')
      .select('name_ru, name_en, name_th, description_ru, description_en, description_th, photo_url, google_maps_url')
      .eq('is_default', true)
      .maybeSingle();

    // NOTE: column is `phone_whatsapp` in transfer_operators.
    const { data: op } = await sb()
      .from('transfer_operators')
      .select('name, phone_whatsapp')
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const opName = op?.name || 'Klod';
    const opWa = op?.phone_whatsapp || '';
    const opPhone = opWa.replace(/[^0-9]/g, '');
    const totalStr = `${order.currency} ${Number(order.total_amount).toLocaleString()}`;
    const localMp = pickMeetingPoint(mp, customerLang);

    // Customer email — localized
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && order.customer_email) {
      const resend = new Resend(resendKey);
      const html = `
<div style="font-family:Arial;color:#333;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;border-radius:12px 12px 0 0">
    <h1 style="margin:0">✅ ${t.title}</h1>
    <p style="margin:6px 0 0;opacity:.9">#${order.order_number}</p>
  </div>
  <div style="background:#fff;padding:20px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
    <p>${t.greet(order.customer_name || '')}</p>
    <p>${t.confirmedBy(opName, totalStr)}</p>
    ${localMp ? `
    <h3 style="margin-top:20px">${t.meetingPoint}</h3>
    <p><b>${localMp.name || ''}</b></p>
    ${localMp.photo_url ? `<img src="${localMp.photo_url}" alt="Meeting point" style="max-width:100%;border-radius:8px;margin:8px 0"/>` : ''}
    ${localMp.description ? `<p style="background:#fffbeb;padding:12px;border-radius:8px">${localMp.description}</p>` : ''}
    ${localMp.google_maps_url ? `<p><a href="${localMp.google_maps_url}" target="_blank">Google Maps →</a></p>` : ''}
    ` : ''}
    <h3>${t.operatorContact}</h3>
    <p><b>${opName}</b><br/>WhatsApp: <a href="https://wa.me/${opPhone}">+${op?.whatsapp_number || ''}</a></p>
  </div>
</div>`;
      await resend.emails.send({
        from: 'myUNO <noreply@resend.dev>',
        to: [order.customer_email],
        subject: t.emailSubject(order.order_number),
        html,
      }).catch(e => console.error('[email] customer confirm failed', e));
    }

    // WhatsApp customer — localized
    const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
    const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');
    if (ultraMsgInstance && ultraMsgToken && order.customer_phone) {
      const waMsg = t.waMsg(order.order_number, opName, totalStr, opPhone, localMp?.name || undefined);
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
      recipients: { customer_email: order.customer_email, customer_phone: order.customer_phone, customer_language: customerLang },
      status: 'sent',
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, order_number: order.order_number, customer_language: customerLang }), {
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
