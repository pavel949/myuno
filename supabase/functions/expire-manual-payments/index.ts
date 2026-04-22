// Cron — runs hourly, finds manual_payment_requests whose hold_expires_at is past
// and are still in awaiting_admin/contacted state, marks them expired, and
// cancels the corresponding orders so dates free up.

import { createServiceClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createServiceClient();
    const nowIso = new Date().toISOString();

    const { data: expiring, error: selErr } = await sb
      .from('manual_payment_requests')
      .select('id, order_id, user_id')
      .lt('hold_expires_at', nowIso)
      .in('status', ['awaiting_admin', 'contacted']);

    if (selErr) throw selErr;
    if (!expiring || expiring.length === 0) {
      return new Response(JSON.stringify({ ok: true, expired: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let expiredCount = 0;
    for (const row of expiring) {
      const { error: updErr } = await sb
        .from('manual_payment_requests')
        .update({ status: 'expired' })
        .eq('id', row.id);
      if (updErr) {
        console.error('[expire-manual-payments] update', row.id, updErr);
        continue;
      }

      // Cancel the order
      await sb.from('orders').update({ status: 'cancelled' }).eq('id', row.order_id);

      // Notify guest
      await sb.from('notifications').insert({
        user_id: row.user_id,
        title: 'Срок ожидания истёк',
        body: 'Ваша заявка на оплату в рублях истекла. Даты освобождены — напишите нам, если хотите забронировать снова.',
        type: 'booking',
        is_read: false,
        data: { order_id: row.order_id, channel: 'rub_manual', reason: 'expired' },
      });

      expiredCount += 1;
    }

    return new Response(JSON.stringify({ ok: true, expired: expiredCount }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[expire-manual-payments] fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
