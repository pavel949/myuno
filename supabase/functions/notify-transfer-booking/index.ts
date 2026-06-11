// Trilingual transfer booking notifier (RU/EN/TH)
// Recipients: Klod operator (WA+email), admin (WA+email), customer (email confirmation in their language)
// Email delivery via Lovable Emails (send-transactional-email) with built-in retry queue + suppression.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAdminEmails, getAdminWhatsApp } from '../_shared/admin-config.ts';
import { NOTIFY_CORS as corsHeaders } from '../_shared/notify-utils.ts';

async function sendEmail(
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await sb().functions.invoke('send-transactional-email', {
      body: { templateName, recipientEmail, idempotencyKey, templateData },
    });
    if (error) console.error('[email]', templateName, '->', recipientEmail, error);
  } catch (e) {
    console.error('[email] invoke failed', templateName, e);
  }
}

type Lang = 'ru' | 'en' | 'th';

interface TransferNotifyPayload {
  order_id: string;
  order_number: string;
  direction: 'from-airport' | 'to-airport';
  terminal?: string;
  flight_number?: string;
  vehicle_name: string;
  meeting_sign_name?: string;
  passengers: number;
  luggage?: number;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  total_amount: number;
  currency: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_language?: Lang;
  notes?: string;
  attachments?: Array<{ url: string; kind: string; filename?: string }>;
}

const sb = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const LANG_NAME: Record<Lang, string> = { ru: 'Russian', en: 'English', th: 'Thai' };

async function translate(text: string, targetLang: Lang): Promise<string> {
  if (!text?.trim()) return text;
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return text;
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `Detect the source language and translate the user's text into ${LANG_NAME[targetLang]}. Preserve proper names, addresses, flight numbers. If the text is already in ${LANG_NAME[targetLang]}, return it unchanged. Output ONLY the translation, no quotes, no explanations.` },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || text;
  } catch (e) {
    console.error('[translate] failed', e);
    return text;
  }
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
  const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');
  if (!ultraMsgInstance || !ultraMsgToken) {
    console.log('[WA] no UltraMSG config, skipping ->', to);
    return;
  }
  try {
    const res = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: ultraMsgToken, to: `+${to.replace(/[^0-9]/g, '')}`, body }),
    });
    const json = await res.json();
    console.log('[WA] sent to', to, JSON.stringify(json).slice(0, 200));
  } catch (e) {
    console.error('[WA] error', e);
  }
}

function fmtDate(iso: string, locale: string) {
  const d = new Date(iso);
  // Always format in Phuket time — operator and customer expect local ICT.
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Bangkok' };
  const date = d.toLocaleDateString(locale, { ...opts, day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(locale, { ...opts, hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time} ICT`;
}

function buildOperatorMessage(p: TransferNotifyPayload, tr: Record<string, Record<Lang, string>>, confirmUrl: string) {
  const date = fmtDate(p.scheduled_at, 'en-GB');
  const dirEn = p.direction === 'from-airport' ? 'AIRPORT → HOTEL' : 'HOTEL → AIRPORT';
  const dirTh = p.direction === 'from-airport' ? 'สนามบิน → โรงแรม' : 'โรงแรม → สนามบิน';
  return `🚗 *NEW TRANSFER* / *การจองใหม่*

📋 #${p.order_number}
✈️ ${dirEn} / ${dirTh}
📅 ${date}
🛬 Flight: ${p.flight_number || '—'}
🚙 ${p.vehicle_name} · ${p.passengers}pax${p.luggage ? ` · ${p.luggage} bags` : ''}

📍 *Pickup (EN):* ${tr.pickup.en}
📍 *Pickup (TH):* ${tr.pickup.th}
📍 *Drop-off (EN):* ${tr.dropoff.en}
📍 *Drop-off (TH):* ${tr.dropoff.th}

👤 ${p.customer_name} · ${p.customer_phone}
🌐 Lang: ${(p.customer_language || 'ru').toUpperCase()}
💰 ฿${p.total_amount.toLocaleString()} (${p.payment_method})
${tr.notes.en ? `\n📝 EN: ${tr.notes.en}\n📝 TH: ${tr.notes.th}` : ''}
${p.attachments?.length ? `\n📎 ${p.attachments.length} attachment(s)` : ''}

✅ CONFIRM: ${confirmUrl}`;
}

async function generateConfirmToken(orderId: string): Promise<string> {
  const { data } = await sb().from('system_settings').select('value').eq('key', 'transfer_operator_confirm_secret').single();
  const secret = (typeof data?.value === 'string' ? data.value : JSON.parse(JSON.stringify(data?.value))) as string;
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  const payload = `${orderId}.${exp}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${exp}.${sigHex}`;
}

// Customer "received" email — localized
const CUSTOMER_RECEIVED = {
  ru: {
    subject: (n: string) => `Заявка #${n} принята — ждём подтверждения оператора`,
    title: 'Спасибо! Заявка на трансфер принята',
    orderLabel: 'Номер заявки',
    routeLabel: 'Маршрут',
    dateLabel: 'Дата',
    operatorLine: (name: string) => `Оператор <b>${name}</b> свяжется с вами в течение ~30 минут для подтверждения.`,
    amountLabel: 'Сумма',
    locale: 'ru-RU',
  },
  en: {
    subject: (n: string) => `Booking #${n} received — awaiting operator confirmation`,
    title: 'Thank you! Your transfer request has been received',
    orderLabel: 'Booking number',
    routeLabel: 'Route',
    dateLabel: 'Date',
    operatorLine: (name: string) => `Operator <b>${name}</b> will contact you within ~30 minutes to confirm.`,
    amountLabel: 'Total',
    locale: 'en-GB',
  },
  th: {
    subject: (n: string) => `รับคำขอ #${n} แล้ว — รอการยืนยันจากเจ้าหน้าที่`,
    title: 'ขอบคุณ! เราได้รับคำขอจองรถรับส่งของคุณแล้ว',
    orderLabel: 'หมายเลขการจอง',
    routeLabel: 'เส้นทาง',
    dateLabel: 'วันที่',
    operatorLine: (name: string) => `เจ้าหน้าที่ <b>${name}</b> จะติดต่อคุณภายในประมาณ 30 นาทีเพื่อยืนยัน`,
    amountLabel: 'ยอดรวม',
    locale: 'th-TH',
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const p: TransferNotifyPayload = await req.json();
    const customerLang: Lang = p.customer_language || 'ru';
    console.log('[Transfer] notify', p.order_number, 'lang=', customerLang);

    // Always produce EN+TH for operator; also produce customer-language version
    const langsNeeded: Lang[] = Array.from(new Set<Lang>(['ru', 'en', 'th']));

    const fields = ['pickup', 'dropoff', 'notes'] as const;
    const sources: Record<string, string> = {
      pickup: p.pickup_address,
      dropoff: p.dropoff_address,
      notes: p.notes || '',
    };

    // Translate every field to every needed language (source detected automatically).
    const tr: Record<string, Record<Lang, string>> = { pickup: {} as any, dropoff: {} as any, notes: {} as any };
    await Promise.all(
      fields.flatMap((f) =>
        langsNeeded.map(async (lang) => {
          tr[f][lang] = sources[f] ? await translate(sources[f], lang) : '';
        })
      )
    );

    // Persist row-based translations
    const rows: Array<{ order_id: string; field: string; lang: Lang; value: string }> = [];
    for (const f of fields) {
      for (const lang of langsNeeded) {
        if (tr[f][lang]) rows.push({ order_id: p.order_id, field: `${f}_address`.replace('notes_address', 'notes'), lang, value: tr[f][lang] });
      }
    }
    if (rows.length) {
      await sb().from('order_translations').upsert(rows, { onConflict: 'order_id,field,lang' }).then(({ error }) => {
        if (error) console.error('[translations] upsert error', error);
      });
    }

    // Lookup operator (Klod by default) + admin contacts.
    // NOTE: column is `phone_whatsapp` in transfer_operators (NOT `whatsapp_number`).
    const { data: op } = await sb()
      .from('transfer_operators')
      .select('id, phone_whatsapp, email, name')
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    const opWa = op?.phone_whatsapp || '';
    const operatorMissing = !op;
    if (operatorMissing) {
      console.error('[Transfer] CRITICAL: no active operator found for order', p.order_number);
    }

    // Persist operator_id + financial split on order so admin sees the chain.
    // Vehicle markup_pct=35 → vendor_payout = total / 1.35, platform_fee = remainder.
    try {
      const { data: ord } = await sb()
        .from('orders')
        .select('total_amount, platform_fee_amount, metadata')
        .eq('id', p.order_id)
        .single();
      if (ord) {
        const total = Number(ord.total_amount) || p.total_amount;
        const vendorPayout = Math.round(total / 1.35);
        const platformFee = total - vendorPayout;
        const meta = { ...(ord.metadata as Record<string, unknown> || {}), operator_id: op?.id || null, operator_name: op?.name || null };
        await sb().from('orders').update({
          metadata: meta,
          vendor_payout_amount: vendorPayout,
          platform_fee_amount: ord.platform_fee_amount ?? platformFee,
        }).eq('id', p.order_id);
      }
    } catch (e) {
      console.error('[Transfer] order enrich failed', e);
    }

    // For cash / concierge_advance: record ledger entries immediately so admin
    // financial dashboard reflects revenue & vendor payout owed to Klod.
    if (p.payment_method === 'cash' || p.payment_method === 'concierge_advance') {
      const { error: ledgerErr } = await sb().rpc('record_ledger_entries', { p_order_id: p.order_id });
      if (ledgerErr) console.error('[Transfer] record_ledger_entries failed', ledgerErr);
    }

    const adminEmails = await getAdminEmails();
    const adminWA = await getAdminWhatsApp();
    const { data: secondaryWaRow } = await sb().from('system_settings').select('value').eq('key', 'transfer_admin_wa_secondary').maybeSingle();
    const secondaryWA = secondaryWaRow?.value
      ? (typeof secondaryWaRow.value === 'string' ? secondaryWaRow.value : JSON.parse(JSON.stringify(secondaryWaRow.value)))
      : null;

    const baseUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://myuno.app';
    const token = await generateConfirmToken(p.order_id);
    const confirmUrl = `${baseUrl}/operate/transfers/confirm?id=${p.order_id}&t=${token}`;

    const opMessage = buildOperatorMessage(p, tr, confirmUrl);

    // ALERT if no operator is configured — admin gets a separate prefixed message so
    // they immediately escalate, BEFORE the customer waits silently.
    const alertPrefix = operatorMissing
      ? `🚨 *NO ACTIVE OPERATOR* — admin must assign manually\n\n`
      : '';

    // Send WhatsApp: operator Klod (if any), admin primary, admin secondary
    const waTargets = [opWa, adminWA, secondaryWA].filter(Boolean) as string[];
    const uniqueWA = Array.from(new Set(waTargets.map(w => w.replace(/[^0-9]/g, ''))));
    await Promise.all(uniqueWA.map(num => sendWhatsApp(num, alertPrefix + opMessage)));

    // Emails
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const resend = new Resend(resendKey);
      const mailFrom = await getMailFrom();
      const dateEn = fmtDate(p.scheduled_at, 'en-GB');
      const alertBanner = operatorMissing
        ? `<div style="background:#fee2e2;color:#991b1b;padding:14px;border-radius:8px;margin:0 0 16px;font-weight:600">🚨 NO ACTIVE OPERATOR — assign manually before customer waits</div>`
        : '';
      const operatorHtml = `
<!DOCTYPE html><html><body style="font-family:Arial;color:#333">
${alertBanner}
<h2>🚗 Transfer #${p.order_number}</h2>
<p><b>${p.direction === 'from-airport' ? 'Airport → Hotel' : 'Hotel → Airport'}</b> · ${dateEn}</p>
<p>Flight: ${p.flight_number || '—'} · ${p.vehicle_name} · ${p.passengers}pax</p>
<h3>Pickup</h3>
<p>🇷🇺 ${tr.pickup.ru}<br/>🇬🇧 ${tr.pickup.en}<br/>🇹🇭 ${tr.pickup.th}</p>
<h3>Drop-off</h3>
<p>🇷🇺 ${tr.dropoff.ru}<br/>🇬🇧 ${tr.dropoff.en}<br/>🇹🇭 ${tr.dropoff.th}</p>
${p.notes ? `<h3>Notes</h3><p>🇷🇺 ${tr.notes.ru}<br/>🇬🇧 ${tr.notes.en}<br/>🇹🇭 ${tr.notes.th}</p>` : ''}
<p><b>Customer:</b> ${p.customer_name} · ${p.customer_phone} · ${p.customer_email} · lang=${customerLang.toUpperCase()}</p>
<p><b>Total:</b> ฿${p.total_amount.toLocaleString()} (${p.payment_method})</p>
${p.attachments?.length ? `<h3>Attachments</h3><ul>${p.attachments.map(a => `<li><a href="${a.url}">${a.filename || a.kind}</a></li>`).join('')}</ul>` : ''}
<p style="margin-top:24px"><a href="${confirmUrl}" style="background:#059669;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">✅ Confirm Booking</a></p>
</body></html>`;

      // Operator
      if (op?.email) {
        await resend.emails.send({
          from: mailFrom,
          to: [op.email],
          subject: `🚗 NEW Transfer #${p.order_number} — ${dateEn}`,
          html: operatorHtml,
        }).catch(e => console.error('[email] op failed', e));
      }
      // Admin — always, with alert subject prefix when operator missing
      await resend.emails.send({
        from: mailFrom,
        to: adminEmails,
        subject: `${operatorMissing ? '🚨 NO OPERATOR — ' : ''}🚗 Transfer #${p.order_number} — ${dateEn}`,
        html: operatorHtml,
      }).catch(e => console.error('[email] admin failed', e));

      // Customer "received" — localized to customer_language
      if (p.customer_email) {
        const c = CUSTOMER_RECEIVED[customerLang];
        const localDate = fmtDate(p.scheduled_at, c.locale);
        const customerHtml = `<div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 12px">${c.title}</h2>
<p>${c.orderLabel}: <b>#${p.order_number}</b></p>
<p>${c.routeLabel}: ${tr.pickup[customerLang]} → ${tr.dropoff[customerLang]}</p>
<p>${c.dateLabel}: ${localDate}</p>
<p>${c.operatorLine(op?.name || 'Klod')}</p>
<p>${c.amountLabel}: ฿${p.total_amount.toLocaleString()}</p>
</div>`;
        await resend.emails.send({
          from: mailFrom,
          to: [p.customer_email],
          subject: c.subject(p.order_number),
          html: customerHtml,
        }).catch(e => console.error('[email] customer failed', e));
      }
    }

    // Log
    await sb().from('booking_notifications_log').insert({
      order_id: p.order_id,
      notification_type: operatorMissing ? 'transfer_new_booking_no_operator' : 'transfer_new_booking',
      channels: ['whatsapp', 'email'],
      recipients: { operator_wa: opWa, operator_email: op?.email, admin_wa: uniqueWA, admin_emails: adminEmails, customer_email: p.customer_email, customer_language: customerLang },
      status: operatorMissing ? 'partial' : 'sent',
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, operator: op?.name || null, operator_missing: operatorMissing, customer_language: customerLang }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[Transfer Notify] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
