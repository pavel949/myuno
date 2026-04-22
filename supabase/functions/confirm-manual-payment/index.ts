// Admin-only: marks a manual_payment_request as confirmed, records the payment,
// flips the underlying order to 'confirmed', and notifies the guest.
//
// Service-role + caller role check (must have admin app_role).
//
// POST body: { request_id, amount_rub_actual, payment_method, proof_file_path? }

import { Resend } from 'npm:resend@2.0.0';
import { createClient, createServiceClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  request_id: string;
  amount_rub_actual: number;
  payment_method: string;
  proof_file_path?: string | null;
}

Deno.serve(async (req) => {
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
        id, order_id, user_id, status, amount_listing, currency_listing,
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

    // 2. Flip the order to confirmed
    const orderMetaUpd = {
      ...((mpr as any).orders?.metadata || {}),
      payment_channel: 'rub_manual',
      manual_payment: {
        confirmed_at: new Date().toISOString(),
        confirmed_by: callerId,
        amount_rub_actual,
        payment_method,
        proof_file_path: proof_file_path ?? null,
      },
    };
    await sb
      .from('orders')
      .update({
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        metadata: orderMetaUpd,
      })
      .eq('id', orderId);

    // 3. Notify guest in-app
    await sb.from('notifications').insert({
      user_id: (mpr as any).user_id,
      title: 'Оплата подтверждена',
      body: `Бронирование #${orderNumber} подтверждено.`,
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
      <h1 style="margin:0;font-size:20px">✓ Оплата подтверждена</h1>
      <p style="margin:6px 0 0;opacity:.9;font-size:14px">Booking #${orderNumber}</p>
    </div>
    <div style="padding:24px;font-size:14px">
      <p>Здравствуйте, ${guestName}!</p>
      <p>Мы получили вашу оплату <strong>${amount_rub_actual.toLocaleString('ru-RU')} ₽</strong> и подтвердили бронирование.</p>
      <p>Ваучер и детали будут направлены отдельным письмом / в личном кабинете.</p>
      <p style="margin-top:24px"><a href="https://myuno.app/bookings/${orderId}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Открыть бронирование</a></p>
    </div>
  </div>
</body></html>`;
        await resend.emails.send({
          from: 'myUNO <noreply@notify.myuno.app>',
          to: [guestEmail],
          subject: `✓ Оплата подтверждена · Booking #${orderNumber}`,
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
