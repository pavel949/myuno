// Admin-only: marks a manual_payment_request as confirmed, records the payment,
// flips the underlying order to 'confirmed', and notifies the guest.
//
// Service-role + caller role check (must have admin app_role).
//
// POST body: { request_id, amount_rub_actual, payment_method, proof_file_path? }

import { Resend } from 'npm:resend@2.0.0';
import { createClient, createServiceClient } from '../_shared/supabase.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

interface Payload {
  request_id: string;
  amount_rub_actual: number;
  payment_method: string;
  proof_file_path?: string | null;
}

Deno.serve(async (req) => {
  // Restrict CORS to allow-listed origins — this endpoint confirms money
  // movements (manual RUB payments → order confirmed + ledger entries).
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is an admin
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userRes.user.id;

    const sb = createServiceClient();
    const { data: roleRows } = await sb
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .in('role', ['admin', 'super_admin']);

    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Payload;
    const { request_id, amount_rub_actual, payment_method, proof_file_path } = body;
    if (!request_id || !amount_rub_actual || amount_rub_actual <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch request + order
    const { data: mpr, error: mprErr } = await sb
      .from('manual_payment_requests')
      .select(`
        id, order_id, user_id, status, amount_listing, currency_listing, amount_rub_estimate,
        guest_name, guest_email,
        orders ( id, order_number, metadata, total_amount, currency )
      `)
      .eq('id', request_id)
      .single();

    if (mprErr || !mpr) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((mpr as any).status === 'confirmed') {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderId = (mpr as any).order_id as string;
    const orderNumber = (mpr as any).orders?.order_number as string;
    const listingAmount = Number((mpr as any).amount_listing);
    const listingCurrency = String((mpr as any).currency_listing || '').toUpperCase();
    const rubEstimate = Number((mpr as any).amount_rub_estimate);
    if (!Number.isFinite(listingAmount) || listingAmount <= 0 || !listingCurrency) {
      return new Response(JSON.stringify({ error: 'Manual payment request has no trusted listing amount' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // The browser RUB estimate is informational only. Until an approved FX
    // settlement contract exists, RUB confirmation cannot be converted into a
    // THB ledger amount without inventing financial truth.
    if (listingCurrency !== 'RUB') {
      return new Response(JSON.stringify({ error: 'Manual settlement currency contract not approved' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (Math.abs(amount_rub_actual - listingAmount) > 0.01) {
      return new Response(JSON.stringify({ error: 'Received amount does not match approved manual-payment amount' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Update the manual_payment_requests row
    const { error: updErr } = await sb
      .from('manual_payment_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: callerId,
        amount_rub_actual,
        payment_method_actual: payment_method,
        proof_file_path: proof_file_path ?? null,
      })
      .eq('id', request_id);
    if (updErr) throw updErr;

    // 2. Persist verified receipt evidence only. Do not mark the full order paid
    // and do not call record_ledger_entries(order_id): that legacy RPC posts the
    // full order total and would overstate a deposit/partial receipt.
    const { error: intentErr } = await sb.from('payment_intents').insert({
      order_id: orderId,
      amount: amount_rub_actual,
      currency: 'RUB',
      method: payment_method,
      status: 'succeeded',
      provider_ref: `manual:${request_id}`,
      metadata: {
        manual_payment_request_id: request_id,
        confirmed_by: callerId,
        proof_file_path: proof_file_path ?? null,
        amount_received: amount_rub_actual,
        currency_received: 'RUB',
      },
    });
    if (intentErr) throw intentErr;

    // Order-level paid/confirmed state is deliberately not inferred from a
    // receipt unless the verified received amount covers the order in the same
    // accounting currency. RUB→THB conversion is blocked until approved FX
    // snapshot/rounding rules exist.
    const orderMetaUpd = {
      ...((mpr as any).orders?.metadata || {}),
      payment_channel: 'rub_manual',
      manual_payment: {
        confirmed_at: new Date().toISOString(),
        confirmed_by: callerId,
        amount_received: amount_rub_actual,
        currency_received: 'RUB',
        payment_method,
        proof_file_path: proof_file_path ?? null,
        settlement_state: 'receipt_verified_fx_pending',
      },
    };
    const { error: orderMetaErr } = await sb.from('orders')
      .update({ metadata: orderMetaUpd })
      .eq('id', orderId);
    if (orderMetaErr) throw orderMetaErr;

    // 3. Notify guest in-app
    await sb.from('notifications').insert({
      user_id: (mpr as any).user_id,
      title: 'Оплата подтверждена',
      body: `Оплата по заявке #${orderNumber} получена и ожидает финансовой сверки.`,
      type: 'booking',
      is_read: false,
      data: { order_id: orderId, order_number: orderNumber, channel: 'rub_manual' },
    });

    // 4. Email guest (best effort)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const guestEmail = (mpr as any).guest_email as string;
    const guestName = (mpr as any).guest_name as string;
    if (resendKey && guestEmail) {
      try {
        const resend = new Resend(resendKey);
        const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;background:#fafafa;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#10b981;padding:24px;color:#fff">
      <h1 style="margin:0;font-size:20px">✓ Оплата получена</h1>
      <p style="margin:6px 0 0;opacity:.9;font-size:14px">Booking #${orderNumber}</p>
    </div>
    <div style="padding:24px;font-size:14px">
      <p>Здравствуйте, ${guestName}!</p>
      <p>Мы получили вашу оплату <strong>${amount_rub_actual.toLocaleString('ru-RU')} ₽</strong> и передали платёж на финансовую сверку. Подтверждение бронирования будет отдельным сообщением.</p>
      <p>Ваучер и детали будут направлены отдельным письмом / в личном кабинете.</p>
      <p style="margin-top:24px"><a href="https://myuno.app/bookings/${orderId}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Открыть бронирование</a></p>
    </div>
  </div>
</body></html>`;
        await resend.emails.send({
          from: 'myUNO <noreply@notify.myuno.app>',
          to: [guestEmail],
          subject: `✓ Оплата получена · Booking #${orderNumber}`,
          html,
        });
      } catch (e) {
        console.error('[confirm-manual-payment] email error:', e);
      }
    }

    // 5. Generate voucher (non-blocking)
    sb.functions.invoke('generate-booking-voucher', { body: { order_id: orderId } })
      .catch((e) => console.error('[confirm-manual-payment] voucher gen:', e));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[confirm-manual-payment] fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
