// Trilingual transfer booking notifier (RU/EN/TH)
// Recipients: configured myUNO admins, customer receipt. No supplier fan-out.
// Email delivery via Lovable Emails (send-transactional-email) with built-in retry queue + suppression.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAdminEmails, getAdminWhatsApp } from '../_shared/admin-config.ts';
import { NOTIFY_CORS as corsHeaders } from '../_shared/notify-utils.ts';
import { transferAdminTargets, transferEmailOutcome, transferWhatsAppOutcome, transferAdminHandoff, type TransferEmailOutcome, type TransferWhatsAppOutcome } from './intake-routing.ts';
import { getTransferMarkupMultiplier } from '../_shared/transfer-commission.ts';

async function sendEmail(
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown>,
): Promise<TransferEmailOutcome> {
  try {
    const { data, error } = await sb().functions.invoke('send-transactional-email', {
      body: { templateName, recipientEmail, idempotencyKey, templateData },
    });
    return transferEmailOutcome(data, error);
  } catch (e) {
    console.error('[email] enqueue failed');
    return 'failed';
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

async function sendWhatsApp(to: string, body: string): Promise<TransferWhatsAppOutcome> {
  const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
  const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');
  if (!ultraMsgInstance || !ultraMsgToken) {
    return 'not_configured';
  }
  try {
    const res = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ token: ultraMsgToken, to: `+${to.replace(/[^0-9]/g, '')}`, body }),
    });
    const json = await res.json();
    return transferWhatsAppOutcome(res.ok, json);
  } catch (e) {
    console.error('[WA] Provider request failed');
    return 'failed';
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
    subject: (n: string) => `Заявка #${n} принята — ждём подтверждения myUNO`,
    title: 'Спасибо! Заявка на трансфер принята',
    orderLabel: 'Номер заявки',
    routeLabel: 'Маршрут',
    dateLabel: 'Дата',
    operatorLine: (name: string) => `Команда <b>${name}</b> проверит заявку и свяжется с вами. Бронирование ещё не подтверждено.`,
    amountLabel: 'Сумма',
    locale: 'ru-RU',
  },
  en: {
    subject: (n: string) => `Booking #${n} received — awaiting myUNO confirmation`,
    title: 'Thank you! Your transfer request has been received',
    orderLabel: 'Booking number',
    routeLabel: 'Route',
    dateLabel: 'Date',
    operatorLine: (name: string) => `The <b>${name}</b> team will review your request and contact you. Your booking is not confirmed yet.`,
    amountLabel: 'Total',
    locale: 'en-GB',
  },
  th: {
    subject: (n: string) => `รับคำขอ #${n} แล้ว — รอการยืนยันจาก myUNO`,
    title: 'ขอบคุณ! เราได้รับคำขอจองรถรับส่งของคุณแล้ว',
    orderLabel: 'หมายเลขการจอง',
    routeLabel: 'เส้นทาง',
    dateLabel: 'วันที่',
    operatorLine: (name: string) => `ทีม <b>${name}</b> จะตรวจสอบคำขอและติดต่อคุณ การจองยังไม่ได้รับการยืนยัน`,
    amountLabel: 'ยอดรวม',
    locale: 'th-TH',
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const p: TransferNotifyPayload = await req.json();
    const customerLang: Lang = p.customer_language || 'ru';
    console.info('[Transfer] notify', p.order_number, 'lang=', customerLang);

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
    const operatorMissing = !op;
    if (operatorMissing) {
      console.error('[Transfer] CRITICAL: no active operator found for order', p.order_number);
    }

    // Persist operator_id + financial split on order so admin sees the chain.
    // Markup multiplier is read from `vertical_commission_rules` (vertical='transfer').
    // vendor_payout = total / multiplier, platform_fee = remainder.
    try {
      const multiplier = await getTransferMarkupMultiplier();
      const { data: ord } = await sb()
        .from('orders')
        .select('total_amount, platform_fee_amount, metadata')
        .eq('id', p.order_id)
        .single();
      if (ord) {
        const total = Number(ord.total_amount) || p.total_amount;
        const vendorPayout = Math.round(total / multiplier);
        const platformFee = total - vendorPayout;
        const meta = {
          ...(ord.metadata as Record<string, unknown> || {}),
          operator_id: op?.id || null,
          operator_name: op?.name || null,
          markup_multiplier: multiplier,
        };
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

    // Do not add operator contacts: myUNO owns the customer conversation.
    const targets = transferAdminTargets(adminEmails, adminWA, secondaryWA);
    const whatsappOutcomes = await Promise.all(targets.whatsapp.map(num => sendWhatsApp(num, alertPrefix + opMessage)));

    // Emails — via Lovable Emails (queue, retries, suppression, unsubscribe handled centrally)
    const dateEn = fmtDate(p.scheduled_at, 'en-GB');
    const directionLabel = p.direction === 'from-airport' ? 'Airport → Hotel' : 'Hotel → Airport';
    const vehicleLine = `${p.vehicle_name} · ${p.passengers}pax${p.luggage ? ` · ${p.luggage} bags` : ''}`;
    const operatorTemplateData = {
      orderNumber: p.order_number,
      directionLabel,
      dateLabel: dateEn,
      flightNumber: p.flight_number || '—',
      vehicleLine,
      pickupRu: tr.pickup.ru,
      pickupEn: tr.pickup.en,
      pickupTh: tr.pickup.th,
      dropoffRu: tr.dropoff.ru,
      dropoffEn: tr.dropoff.en,
      dropoffTh: tr.dropoff.th,
      notesRu: tr.notes.ru,
      notesEn: tr.notes.en,
      notesTh: tr.notes.th,
      customerName: p.customer_name,
      customerPhone: p.customer_phone,
      customerEmail: p.customer_email,
      customerLang: customerLang,
      totalLabel: `฿${p.total_amount.toLocaleString()}`,
      paymentMethod: p.payment_method,
      attachments: p.attachments || [],
      confirmUrl,
      operatorMissing,
    };

    // Preserve the existing durable admin email queue and idempotency keys.
    const emailOutcomes: TransferEmailOutcome[] = [];
    for (const adminEmail of targets.emails) {
      emailOutcomes.push(await sendEmail('transfer-operator-new', adminEmail, `transfer-admin-${p.order_id}-${adminEmail}`, operatorTemplateData));
    }
    const handoff = transferAdminHandoff(emailOutcomes, whatsappOutcomes);
    if (!handoff.anyAccepted) console.error('[Transfer] No admin notification accepted');

    // Customer "received" — localized
    if (p.customer_email) {
      const c = CUSTOMER_RECEIVED[customerLang];
      const localDate = fmtDate(p.scheduled_at, c.locale);
      await sendEmail('transfer-customer-received', p.customer_email, `transfer-cust-recv-${p.order_id}`, {
        subjectText: c.subject(p.order_number),
        title: c.title,
        orderNumber: p.order_number,
        orderLabel: c.orderLabel,
        routeLabel: c.routeLabel,
        routeValue: `${tr.pickup[customerLang]} → ${tr.dropoff[customerLang]}`,
        dateLabel: c.dateLabel,
        dateValue: localDate,
        operatorLine: c.operatorLine('myUNO').replace(/<\/?b>/g, ''),
        amountLabel: c.amountLabel,
        amountValue: `฿${p.total_amount.toLocaleString()}`,
      });
    }

    // Log — booking_notifications_log columns: channel(single), notification_type, metadata(jsonb)
    await sb().from('booking_notifications_log').insert({
      channel: 'whatsapp+email',
      notification_type: operatorMissing ? 'transfer_new_booking_no_operator' : 'transfer_new_booking',
      sent_at: new Date().toISOString(),
      metadata: {
        order_id: p.order_id,
        order_number: p.order_number,
        recipients: { admin_wa: targets.whatsapp, admin_emails: targets.emails, customer_email: p.customer_email, customer_language: customerLang },
        status: handoff.status,
        supplier_dispatch: 'suppressed_myuno_managed_intake',
        admin_channels: { email: emailOutcomes, whatsapp: whatsappOutcomes },
      },
    }).catch((e) => console.error('[log]', e));

    return new Response(JSON.stringify({ success: handoff.anyAccepted, admin_handoff: handoff.status, supplier_dispatch: 'suppressed_myuno_managed_intake', customer_language: customerLang }), {
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
