// Operator confirms transfer booking via HMAC-signed link
// GET /functions/v1/confirm-transfer-operator?id=<order_id>&t=<exp.sig>
// Email delivery via Lovable Emails (send-transactional-email).
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
    const action: 'confirm' | 'reject' = body.action === 'reject' ? 'reject' : 'confirm';
    const rejectReason: string | null = body.reason || null;

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
      .select('id, order_number, status, total_amount, currency, metadata, order_participants(name, email, phone, role)')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Surface customer contacts from order_participants (primary role preferred).
    const participants = (order.order_participants || []) as Array<{ name?: string; email?: string; phone?: string; role?: string }>;
    const primary = participants.find((p) => p.role === 'primary') || participants[0] || {};
    const customerEmail = primary.email || null;
    const customerPhone = primary.phone || null;
    const customerName = primary.name || '';

    // ===== REJECT FLOW =====
    if (action === 'reject') {
      if (order.status === 'cancelled') {
        return new Response(JSON.stringify({ success: true, already_cancelled: true, order_number: order.order_number }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: rejUpd } = await sb()
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .not('status', 'in', '(cancelled,refunded)')
        .select('id');

      if (!rejUpd || rejUpd.length === 0) {
        return new Response(JSON.stringify({ success: true, already_cancelled: true, order_number: order.order_number }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await sb().from('order_status_history').insert({
        order_id: orderId,
        from_status: order.status,
        to_status: 'cancelled',
        changed_by_role: 'operator',
        note: `Rejected by operator via signed link${rejectReason ? `: ${rejectReason}` : ''}`,
      }).catch(() => {});

      // Auto-refund (idempotent inside the function).
      const { data: refundResult, error: refundErr } = await sb().functions.invoke('refund-transfer-order', {
        body: { order_id: orderId, reason: rejectReason || 'operator_reject' },
      });
      if (refundErr) console.error('[reject] refund failed', refundErr);

      await sb().from('booking_notifications_log').insert({
        channel: 'system',
        notification_type: 'transfer_rejected',
        sent_at: new Date().toISOString(),
        metadata: {
          order_id: orderId,
          order_number: order.order_number,
          recipients: { customer_email: customerEmail },
          status: refundErr ? 'partial' : 'sent',
          reject_reason: rejectReason,
        },
      }).catch((e) => console.error('[log]', e));

      return new Response(JSON.stringify({
        success: true,
        rejected: true,
        order_number: order.order_number,
        refund: refundResult || null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== CONFIRM FLOW =====
    if (order.status === 'confirmed') {
      return new Response(JSON.stringify({ success: true, already_confirmed: true, order_number: order.order_number }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Atomic transition: only succeeds if status is still NOT 'confirmed'.
    // Prevents double-click / parallel-tab race from running side-effects twice.
    const { data: updated, error: updErr } = await sb()
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)
      .neq('status', 'confirmed')
      .select('id');

    if (updErr) {
      console.error('[confirm] atomic update failed', updErr);
      return new Response(JSON.stringify({ error: 'Update failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!updated || updated.length === 0) {
      // Someone else confirmed between our SELECT and UPDATE — treat as success, skip side effects.
      return new Response(JSON.stringify({ success: true, already_confirmed: true, order_number: order.order_number }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Customer email — via Lovable Emails (queue + retries + suppression).
    if (customerEmail) {
      const stripBold = (s: string) => s.replace(/<\/?b>/g, '');
      const { error: emailErr } = await sb().functions.invoke('send-transactional-email', {
        body: {
          templateName: 'transfer-customer-confirmed',
          recipientEmail: customerEmail,
          idempotencyKey: `transfer-confirmed-${orderId}`,
          templateData: {
            subjectText: t.emailSubject(order.order_number),
            title: t.title,
            orderNumber: order.order_number,
            greet: t.greet(customerName),
            confirmedLine: stripBold(t.confirmedBy(opName, totalStr)),
            meetingPointLabel: t.meetingPoint,
            meetingPointName: localMp?.name || '',
            meetingPointPhoto: localMp?.photo_url || '',
            meetingPointDescription: localMp?.description || '',
            meetingPointMapUrl: localMp?.google_maps_url || '',
            operatorContactLabel: t.operatorContact,
            operatorName: opName,
            operatorWa: opWa,
            operatorWaLink: opPhone ? `https://wa.me/${opPhone}` : '',
          },
        },
      });
      if (emailErr) console.error('[email] customer confirm failed', emailErr);
    }

    // WhatsApp customer — localized
    const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
    const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');
    if (ultraMsgInstance && ultraMsgToken && customerPhone) {
      const waMsg = t.waMsg(order.order_number, opName, totalStr, opPhone, localMp?.name || undefined);
      await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraMsgToken,
          to: `+${customerPhone.replace(/[^0-9]/g, '')}`,
          body: waMsg,
        }),
      }).catch(e => console.error('[WA] customer confirm failed', e));
    }

    await sb().from('booking_notifications_log').insert({
      channel: 'whatsapp+email',
      notification_type: 'transfer_confirmed',
      sent_at: new Date().toISOString(),
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        recipients: { customer_email: customerEmail, customer_phone: customerPhone, customer_language: customerLang },
        status: 'sent',
      },
    }).catch((e) => console.error('[log]', e));


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
