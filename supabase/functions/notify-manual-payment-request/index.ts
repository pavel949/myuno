// Notifies admins, host, and creates in-app notification when a guest submits
// a manual RUB payment request. Mirrors notify-admin-order patterns:
// Resend email + UltraMsg WhatsApp + supabase.from('notifications').insert.
//
// Triggered from PropertyInquiry.tsx after a successful INSERT into
// manual_payment_requests + orders. Service-role only via Authorization header.

import { Resend } from 'npm:resend@2.0.0';
import { createServiceClient } from '../_shared/supabase.ts';
import { getAdminEmails, getAdminWhatsApp } from '../_shared/admin-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  request_id: string;
}

async function sendWhatsApp(message: string, toPhone: string): Promise<void> {
  const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
  const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');
  if (!ultraMsgInstance || !ultraMsgToken) {
    console.log('[WA] UltraMsg not configured, message would be sent to', toPhone);
    console.log(message);
    return;
  }
  try {
    const r = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: ultraMsgToken,
        to: `+${toPhone.replace(/[^0-9]/g, '')}`,
        body: message,
      }),
    });
    const out = await r.json();
    console.log('[WA] sent to', toPhone, out);
  } catch (err) {
    console.error('[WA] error:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id } = (await req.json()) as Payload;
    if (!request_id) {
      return new Response(JSON.stringify({ error: 'request_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createServiceClient();

    // Fetch request + joined order + property info
    const { data: req_, error: reqErr } = await sb
      .from('manual_payment_requests')
      .select(`
        *,
        orders ( order_number, metadata ),
        properties:property_id ( id, owner_id, title_en, title_ru )
      `)
      .eq('id', request_id)
      .single();

    if (reqErr || !req_) {
      console.error('[notify-manual-payment-request] not found:', reqErr);
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderNumber = (req_ as any).orders?.order_number || request_id.slice(0, 8);
    const orderMeta = ((req_ as any).orders?.metadata || {}) as Record<string, any>;
    const propertyTitle = orderMeta.property_title
      || (req_ as any).properties?.title_en
      || 'Property';
    const checkIn = orderMeta.check_in || '';
    const checkOut = orderMeta.check_out || '';
    const nights = Number(orderMeta.nights || 0);
    const guests = Number(orderMeta.guests || 0);

    const guestName = (req_ as any).guest_name as string;
    const guestPhone = (req_ as any).guest_phone as string;
    const guestEmail = (req_ as any).guest_email as string;
    const amountListing = Number((req_ as any).amount_listing);
    const currencyListing = (req_ as any).currency_listing as string;
    const amountRubEstimate = (req_ as any).amount_rub_estimate as number | null;
    const holdExpiresAt = (req_ as any).hold_expires_at as string;

    const adminEmails = await getAdminEmails();
    const adminWhatsApp = await getAdminWhatsApp();

    // ── Owner / manager contacts ──
    const ownerId = (req_ as any).properties?.owner_id as string | null;
    let managerEmail: string | null = orderMeta.manager_email || null;
    let managerPhone: string | null = orderMeta.manager_phone || null;
    if (ownerId) {
      const { data: ownerProfile } = await sb
        .from('profiles')
        .select('email, phone')
        .eq('user_id', ownerId)
        .maybeSingle();
      if (ownerProfile) {
        managerEmail = managerEmail || (ownerProfile as any).email || null;
        managerPhone = managerPhone || (ownerProfile as any).phone || null;
      }
    }

    // ── WhatsApp message ──
    const waMsg = `🇷🇺 *RUB PAYMENT REQUEST* #${orderNumber}
🏠 ${propertyTitle}
📅 ${checkIn} → ${checkOut}${nights ? ` · ${nights}n` : ''}${guests ? ` · ${guests}g` : ''}
💰 ≈ ${amountRubEstimate ? amountRubEstimate.toLocaleString('ru-RU') + ' ₽' : '—'} (${currencyListing} ${amountListing.toLocaleString()})

👤 ${guestName}
📱 ${guestPhone}
📧 ${guestEmail}

⏱ Hold until ${new Date(holdExpiresAt).toLocaleString('ru-RU', { timeZone: 'Asia/Bangkok' })}
🔗 Reply: https://wa.me/${guestPhone.replace(/[^0-9]/g, '')}
🔗 Admin: https://myuno.app/admin/operations?tab=manual-payments`;

    // Fire-and-forget — don't block on WhatsApp
    sendWhatsApp(waMsg, adminWhatsApp).catch((e) => console.error('admin wa', e));
    if (managerPhone && managerPhone.replace(/[^0-9]/g, '') !== adminWhatsApp.replace(/[^0-9]/g, '')) {
      sendWhatsApp(waMsg, managerPhone).catch((e) => console.error('manager wa', e));
    }

    // ── Email ──
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;background:#fafafa;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#fde68a;padding:20px 24px;border-bottom:3px solid #f59e0b">
      <h1 style="margin:0;font-size:18px;color:#7c2d12">🇷🇺 RUB Payment Request — Action Required</h1>
      <p style="margin:6px 0 0;color:#7c2d12;opacity:.9;font-size:13px">#${orderNumber}</p>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;font-size:15px">Booking</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#6b7280">Property</td><td style="padding:6px 0;text-align:right;font-weight:600">${propertyTitle}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Dates</td><td style="padding:6px 0;text-align:right">${checkIn} → ${checkOut}${nights ? ` (${nights}n)` : ''}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Guests</td><td style="padding:6px 0;text-align:right">${guests}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Total</td><td style="padding:6px 0;text-align:right;font-weight:700">≈ ${amountRubEstimate ? amountRubEstimate.toLocaleString('ru-RU') + ' ₽' : '—'} <span style="color:#9ca3af;font-weight:400">(${currencyListing} ${amountListing.toLocaleString()})</span></td></tr>
      </table>

      <h2 style="margin:20px 0 12px;font-size:15px">Guest</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#6b7280">Name</td><td style="padding:6px 0;text-align:right">${guestName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="padding:6px 0;text-align:right"><a href="tel:${guestPhone}" style="color:#2563eb">${guestPhone}</a> · <a href="https://wa.me/${guestPhone.replace(/[^0-9]/g, '')}" style="color:#16a34a">WhatsApp</a></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0;text-align:right"><a href="mailto:${guestEmail}" style="color:#2563eb">${guestEmail}</a></td></tr>
      </table>

      <div style="margin:20px 0;padding:12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#7c2d12">
        ⏱ Hold until <strong>${new Date(holdExpiresAt).toLocaleString('ru-RU', { timeZone: 'Asia/Bangkok' })}</strong> — dates auto-release after expiry.
      </div>

      <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap">
        <a href="https://wa.me/${guestPhone.replace(/[^0-9]/g, '')}" style="display:inline-block;padding:10px 18px;background:#25D366;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px">💬 WhatsApp guest</a>
        <a href="https://myuno.app/admin/operations?tab=manual-payments" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px">🔗 Open in admin</a>
      </div>
    </div>
    <div style="background:#374151;color:#9ca3af;padding:12px 24px;font-size:11px;text-align:center">
      myUNO · Russian-Ruble manual payment channel
    </div>
  </div>
</body></html>`;

        const recipients = [...adminEmails];
        if (managerEmail && !recipients.includes(managerEmail)) recipients.push(managerEmail);

        await resend.emails.send({
          from: 'myUNO <noreply@notify.myuno.app>',
          to: recipients,
          subject: `🇷🇺 RUB Payment Request — #${orderNumber}`,
          html,
        });
      } catch (e) {
        console.error('[notify-manual-payment-request] resend error:', e);
      }
    } else {
      console.log('[notify-manual-payment-request] RESEND_API_KEY not set, skipping email');
    }

    // ── In-app notifications for admins ──
    try {
      const { data: adminUserIds } = await sb
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'super_admin']);

      const rows = (adminUserIds || []).map((u: { user_id: string }) => ({
        user_id: u.user_id,
        title: `🇷🇺 RUB Payment Request #${orderNumber}`,
        body: `${guestName} · ≈ ${amountRubEstimate ? amountRubEstimate.toLocaleString('ru-RU') + ' ₽' : currencyListing + ' ' + amountListing.toLocaleString()}`,
        type: 'manual_payment_request',
        is_read: false,
        data: {
          request_id,
          order_id: (req_ as any).order_id,
          order_number: orderNumber,
          amount_rub_estimate: amountRubEstimate,
          hold_expires_at: holdExpiresAt,
          deeplink: '/admin/operations?tab=manual-payments',
        },
      }));

      if (rows.length > 0) {
        const { error: notifErr } = await sb.from('notifications').insert(rows);
        if (notifErr) console.error('[notify] notifications insert error:', notifErr);
      }
    } catch (e) {
      console.error('[notify] in-app insert error:', e);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[notify-manual-payment-request] fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
