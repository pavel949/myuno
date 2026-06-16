#!/usr/bin/env node
/**
 * Transfer smoke test — fires a fake booking through the production
 * notify-transfer-booking Edge Function and confirms the WhatsApp +
 * email side-effects reach the active primary operator (Klod).
 *
 * Usage:
 *   SUPABASE_URL=https://kakkwibljrjsawxgnupk.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/transfer-smoke-test.mjs
 *
 * What it does:
 *   1. Confirms Klod (or another primary operator) exists in
 *      transfer_operators with a non-placeholder WhatsApp number.
 *   2. INSERTS a test order (status=pending, marked
 *      metadata.smoke_test=true so it's easy to find later).
 *   3. INVOKES the notify-transfer-booking Edge Function with the
 *      booking payload — the function looks up the primary operator,
 *      sends WhatsApp via UltraMsg, sends emails via Lovable Emails,
 *      and writes an audit row into booking_notifications_log.
 *   4. Prints the function response + a Supabase Dashboard link to
 *      the test order so you can clean it up after verifying.
 *
 * The customer "passenger" is a fake one — phone +66600000001, email
 * smoke-test+<ts>@myuno.app. Pavel's WhatsApp ALSO gets the message
 * because admin_whatsapp is set to his number in system_settings.
 *
 * Safe to run on production: status=pending so the order doesn't
 * trigger any payouts / ledger entries until you (or Klod) confirm
 * it. To remove the smoke test order afterwards:
 *   DELETE FROM orders WHERE id = '<id_printed_below>';
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  console.error('   SUPABASE_URL example:               https://kakkwibljrjsawxgnupk.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY example:  eyJhbGciOi...  (from Supabase dashboard → API settings → service_role)');
  process.exit(1);
}

const HEADERS = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const sb = {
  async select(table, qs = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`SELECT ${table} ${res.status}: ${await res.text()}`);
    return res.json();
  },
  async insert(table, row, returning = 'representation') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: `return=${returning}` },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(`INSERT ${table} ${res.status}: ${await res.text()}`);
    return res.json();
  },
  async fn(name, body) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* keep text */ }
    return { ok: res.ok, status: res.status, body: json ?? text };
  },
};

// ─────────────────────────────────────────────────────────────────────────

console.log('\n🚗  myUNO transfer smoke test\n');

// 1. Confirm the primary operator is set up
const ops = await sb.select(
  'transfer_operators',
  'select=name,phone_whatsapp,email,is_primary,is_active&is_active=eq.true&is_primary=eq.true',
);
if (ops.length === 0) {
  console.error('❌ No active primary operator in transfer_operators.');
  console.error('   Run migration 20260616062718_transfer_launch_followups.sql first.');
  process.exit(1);
}
const klod = ops[0];
const isPlaceholder = klod.phone_whatsapp === '66000000000';
console.log(`✓ Primary operator: ${klod.name}   WhatsApp: +${klod.phone_whatsapp}${isPlaceholder ? '  ⚠️ PLACEHOLDER' : ''}`);
if (isPlaceholder) {
  console.error('\n⚠️  Operator has the placeholder WhatsApp number. Update it first:');
  console.error(`   UPDATE transfer_operators SET phone_whatsapp = '<real number>' WHERE name = '${klod.name}';`);
  process.exit(1);
}

// 2. Insert a test order
const ts = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const customerEmail = `smoke-test+${ts}@myuno.app`;
const orderNumber = `SMOKE-${ts}`;

const orderRow = {
  order_number: orderNumber,
  order_type: 'vehicle',
  status: 'pending',
  total_amount: 800,
  currency: 'THB',
  start_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  notes: 'Smoke test booking — please ignore. Created by scripts/transfer-smoke-test.mjs.',
  metadata: {
    smoke_test: true,
    transfer_type: 'airport',
    direction: 'from-airport',
    terminal: 'international',
    flight_number: 'TEST-001',
    vehicle_type: 'standard-van',
    vehicle_name: 'Test van (smoke-test)',
    vehicle_class: 'van',
    passengers: 2,
    luggage: 2,
    meeting_sign_name: 'Smoke Test',
    language: 'ru',
    base_price: 800,
    night_surcharge_applied: false,
    night_surcharge_amount: 0,
    vendor_payout_amount: 593,
    platform_fee_amount: 207,
    meeting_point: 'Стойка туристической полиции (Tourist Police 1155) в зоне прилёта',
  },
};

console.log('\n→ Inserting test order…');
const [order] = await sb.insert('orders', orderRow);
console.log(`✓ Order created   id=${order.id}   number=${order.order_number}`);

await sb.insert('order_items', {
  order_id: order.id,
  item_name: 'Airport Transfer - Test van (smoke-test)',
  item_type: 'transport',
  unit_price: 800,
  amount: 800,
  qty: 1,
  metadata: { vehicle_type: 'standard-van', direction: 'from-airport' },
});
await sb.insert('order_participants', {
  order_id: order.id,
  role: 'primary',
  name: 'Smoke Test Passenger',
  phone: '+66600000001',
  email: customerEmail,
});

// 3. Invoke notify-transfer-booking
const notifyPayload = {
  order_id: order.id,
  order_number: order.order_number,
  direction: 'from-airport',
  terminal: 'international',
  flight_number: 'TEST-001',
  vehicle_name: 'Test van (smoke-test)',
  meeting_sign_name: 'Smoke Test',
  passengers: 2,
  luggage: 2,
  pickup_address: 'Phuket International Airport — Tourist Police desk (1155)',
  dropoff_address: 'Banyan Tree Phuket, Bangtao',
  scheduled_at: orderRow.start_at,
  total_amount: 800,
  currency: 'THB',
  payment_method: 'concierge_advance',
  customer_name: 'Smoke Test Passenger',
  customer_phone: '+66600000001',
  customer_email: customerEmail,
  customer_language: 'ru',
  notes: 'Smoke test — please ignore. WhatsApp + email channels checked.',
};

console.log('\n→ Invoking notify-transfer-booking…');
const result = await sb.fn('notify-transfer-booking', notifyPayload);
if (!result.ok) {
  console.error(`❌ Function returned ${result.status}`);
  console.error(result.body);
  console.error(`\nLeftover test order: ${order.id}`);
  console.error(`Clean up:   DELETE FROM orders WHERE id = '${order.id}';`);
  process.exit(1);
}

console.log(`✓ Function responded ${result.status}`);
console.log(JSON.stringify(result.body, null, 2));

console.log('\n────────────────────────────────────────────────────────────────');
console.log(`✅ Notification fired.  Check Klod's WhatsApp (+${klod.phone_whatsapp})`);
console.log('   The message should arrive within ~5 seconds (UltraMsg queue).');
console.log('   It will look like:');
console.log('');
console.log(`     🆕 *Transfer #${order.order_number}*`);
console.log('     Airport → Hotel · 2 pax · 2 bags');
console.log('     …');
console.log('     ✅ CONFIRM:  https://myuno.app/operate/transfers/confirm?id=…&t=…');
console.log('');
console.log(`   Order: ${SUPABASE_URL.replace('//', '//app.supabase.com/project/').replace('.supabase.co', '')}/editor/.../orders?filter=id.eq.${order.id}`);
console.log('');
console.log('   Cleanup:   DELETE FROM orders WHERE id = \'' + order.id + '\';');
console.log('────────────────────────────────────────────────────────────────\n');
