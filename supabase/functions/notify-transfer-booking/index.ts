// Trilingual transfer booking notifier (RU/EN/TH)
// Recipients: Klod operator (WA+email), admin (WA+email), customer (email confirmation)
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAdminEmails, getAdminWhatsApp } from '../_shared/admin-config.ts';
import { NOTIFY_CORS as corsHeaders } from '../_shared/notify-utils.ts';

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
  notes?: string;
  attachments?: Array<{ url: string; kind: string; filename?: string }>;
}

const sb = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function translateField(text: string, targetLang: 'en' | 'th'): Promise<string> {
  if (!text?.trim()) return text;
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return text;
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `Translate Russian text to ${targetLang === 'en' ? 'English' : 'Thai'}. Output ONLY the translation, no explanations.` },
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

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    en: `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    ru: `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
  };
}

function buildOperatorMessage(p: TransferNotifyPayload, t: { pickup: { en: string; th: string }; dropoff: { en: string; th: string }; notes: { en: string; th: string } }, confirmUrl: string) {
  const date = fmtDate(p.scheduled_at);
  const dirEn = p.direction === 'from-airport' ? 'AIRPORT → HOTEL' : 'HOTEL → AIRPORT';
  const dirTh = p.direction === 'from-airport' ? 'สนามบิน → โรงแรม' : 'โรงแรม → สนามบิน';
  return `🚗 *NEW TRANSFER* / *การจองใหม่*

📋 #${p.order_number}
✈️ ${dirEn} / ${dirTh}
📅 ${date.en}
🛬 Flight: ${p.flight_number || '—'}
🚙 ${p.vehicle_name} · ${p.passengers}pax${p.luggage ? ` · ${p.luggage} bags` : ''}

📍 *Pickup (EN):* ${t.pickup.en}
📍 *Pickup (TH):* ${t.pickup.th}
📍 *Drop-off (EN):* ${t.dropoff.en}
📍 *Drop-off (TH):* ${t.dropoff.th}

👤 ${p.customer_name} · ${p.customer_phone}
💰 ฿${p.total_amount.toLocaleString()} (${p.payment_method})
${t.notes.en ? `\n📝 ${t.notes.en}\n📝 ${t.notes.th}` : ''}
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const p: TransferNotifyPayload = await req.json();
    console.log('[Transfer] notify', p.order_number);

    // Translate dynamic RU fields → EN + TH
    const [pickupEn, pickupTh, dropoffEn, dropoffTh, notesEn, notesTh] = await Promise.all([
      translateField(p.pickup_address, 'en'),
      translateField(p.pickup_address, 'th'),
      translateField(p.dropoff_address, 'en'),
      translateField(p.dropoff_address, 'th'),
      p.notes ? translateField(p.notes, 'en') : Promise.resolve(''),
      p.notes ? translateField(p.notes, 'th') : Promise.resolve(''),
    ]);

    // Persist translations
    await sb().from('order_translations').upsert({
      order_id: p.order_id,
      field_translations: {
        pickup_address: { ru: p.pickup_address, en: pickupEn, th: pickupTh },
        dropoff_address: { ru: p.dropoff_address, en: dropoffEn, th: dropoffTh },
        notes: { ru: p.notes || '', en: notesEn, th: notesTh },
      },
    }, { onConflict: 'order_id' });

    // Lookup operator (Klod by default) + admin contacts
    const { data: op } = await sb()
      .from('transfer_operators')
      .select('whatsapp_number, email, name')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const adminEmails = await getAdminEmails();
    const adminWA = await getAdminWhatsApp();
    const { data: secondaryWaRow } = await sb().from('system_settings').select('value').eq('key', 'transfer_admin_wa_secondary').single();
    const secondaryWA = typeof secondaryWaRow?.value === 'string' ? secondaryWaRow.value : JSON.parse(JSON.stringify(secondaryWaRow?.value));

    const baseUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://myuno.app';
    const token = await generateConfirmToken(p.order_id);
    const confirmUrl = `${baseUrl}/operate/transfers/confirm?id=${p.order_id}&t=${token}`;

    const tFields = {
      pickup: { en: pickupEn, th: pickupTh },
      dropoff: { en: dropoffEn, th: dropoffTh },
      notes: { en: notesEn, th: notesTh },
    };
    const opMessage = buildOperatorMessage(p, tFields, confirmUrl);

    // Send WhatsApp: operator Klod, admin primary, admin secondary
    const waTargets = [op?.whatsapp_number, adminWA, secondaryWA].filter(Boolean) as string[];
    const uniqueWA = Array.from(new Set(waTargets.map(w => w.replace(/[^0-9]/g, ''))));
    await Promise.all(uniqueWA.map(num => sendWhatsApp(num, opMessage)));

    // Emails
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const resend = new Resend(resendKey);
      const date = fmtDate(p.scheduled_at);
      const operatorHtml = `
<!DOCTYPE html><html><body style="font-family:Arial;color:#333">
<h2>🚗 Transfer #${p.order_number}</h2>
<p><b>${p.direction === 'from-airport' ? 'Airport → Hotel' : 'Hotel → Airport'}</b> · ${date.en}</p>
<p>Flight: ${p.flight_number || '—'} · ${p.vehicle_name} · ${p.passengers}pax</p>
<h3>Pickup</h3>
<p>🇷🇺 ${p.pickup_address}<br/>🇬🇧 ${pickupEn}<br/>🇹🇭 ${pickupTh}</p>
<h3>Drop-off</h3>
<p>🇷🇺 ${p.dropoff_address}<br/>🇬🇧 ${dropoffEn}<br/>🇹🇭 ${dropoffTh}</p>
${p.notes ? `<h3>Notes</h3><p>🇷🇺 ${p.notes}<br/>🇬🇧 ${notesEn}<br/>🇹🇭 ${notesTh}</p>` : ''}
<p><b>Customer:</b> ${p.customer_name} · ${p.customer_phone} · ${p.customer_email}</p>
<p><b>Total:</b> ฿${p.total_amount.toLocaleString()} (${p.payment_method})</p>
${p.attachments?.length ? `<h3>Attachments</h3><ul>${p.attachments.map(a => `<li><a href="${a.url}">${a.filename || a.kind}</a></li>`).join('')}</ul>` : ''}
<p style="margin-top:24px"><a href="${confirmUrl}" style="background:#059669;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">✅ Confirm Booking</a></p>
</body></html>`;

      // Operator
      if (op?.email) {
        await resend.emails.send({
          from: 'myUNO Transfer <noreply@resend.dev>',
          to: [op.email],
          subject: `🚗 NEW Transfer #${p.order_number} — ${date.en}`,
          html: operatorHtml,
        }).catch(e => console.error('[email] op failed', e));
      }
      // Admin
      await resend.emails.send({
        from: 'myUNO Transfer <noreply@resend.dev>',
        to: adminEmails,
        subject: `🚗 Transfer #${p.order_number} — ${date.en}`,
        html: operatorHtml,
      }).catch(e => console.error('[email] admin failed', e));

      // Customer "received"
      if (p.customer_email) {
        await resend.emails.send({
          from: 'myUNO <noreply@resend.dev>',
          to: [p.customer_email],
          subject: `Заявка #${p.order_number} принята — ждём подтверждения оператора`,
          html: `<div style="font-family:Arial">
<h2>Спасибо! Заявка на трансфер принята</h2>
<p>Номер заявки: <b>#${p.order_number}</b></p>
<p>Маршрут: ${p.pickup_address} → ${p.dropoff_address}</p>
<p>Дата: ${date.ru}</p>
<p>Оператор <b>${op?.name || 'Klod'}</b> свяжется с вами в течение ~30 минут для подтверждения.</p>
<p>Сумма: ฿${p.total_amount.toLocaleString()}</p>
</div>`,
        }).catch(e => console.error('[email] customer failed', e));
      }
    }

    // Log
    await sb().from('booking_notifications_log').insert({
      order_id: p.order_id,
      notification_type: 'transfer_new_booking',
      channels: ['whatsapp', 'email'],
      recipients: { operator_wa: op?.whatsapp_number, operator_email: op?.email, admin_wa: uniqueWA, admin_emails: adminEmails, customer_email: p.customer_email },
      status: 'sent',
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, operator: op?.name }), {
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
