/**
 * E2E-only payment mock. Gated by `x-e2e-token` header matching the
 * `E2E_TEST_TOKEN` secret AND by `metadata.e2e_seed === true` on the
 * target order. Refuses to touch real production orders.
 *
 * Body: { order_id: string }
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-e2e-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const expected = Deno.env.get('E2E_TEST_TOKEN');
  if (!expected) return json({ error: 'e2e_token_not_configured' }, 503);
  const provided = req.headers.get('x-e2e-token');
  if (provided !== expected) return json({ error: 'forbidden' }, 403);

  let payload: { order_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const orderId = payload?.order_id;
  if (!orderId || typeof orderId !== 'string') return json({ error: 'order_id_required' }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('id, metadata, status, total_amount')
    .eq('id', orderId)
    .maybeSingle();
  if (fetchErr) return json({ error: 'db_error', detail: fetchErr.message }, 500);
  if (!order) return json({ error: 'order_not_found' }, 404);

  const meta = (order.metadata ?? {}) as Record<string, unknown>;
  if (meta.e2e_seed !== true) {
    return json({ error: 'not_an_e2e_order', hint: 'metadata.e2e_seed must be true' }, 403);
  }

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paid_at: now,
      metadata: { ...meta, e2e_paid_at: now, provider: 'e2e_mock' },
    })
    .eq('id', orderId);
  if (updErr) return json({ error: 'update_failed', detail: updErr.message }, 500);

  // Best-effort: record payment intent + ledger
  await supabase
    .from('payment_intents')
    .insert({
      order_id: orderId,
      provider: 'e2e_mock',
      status: 'succeeded',
      amount: order.total_amount ?? 0,
    })
    .then(() => null, () => null);

  await supabase.rpc('record_ledger_entries', { p_order_id: orderId }).then(
    () => null,
    () => null,
  );

  return json({ ok: true, order_id: orderId, paid_at: now });
});
