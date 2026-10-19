import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';

// Run both actual Edge entrypoints and their shared writer with synthetic clients.
// No production credentials, network, RPC, database or notification transport exists.
const root = new URL('../../', import.meta.url);
const calendar = { id: 'calendar-a', property_id: 'property-a', owner_id: 'owner-a', name: 'Airbnb', ical_url: 'https://example.invalid/feed.ics', is_active: true, auto_sync: true };
const moneyFields = ['total_amount', 'currency', 'deposit_amount', 'service_fee', 'cleaning_fee', 'platform_commission', 'refund_amount'];
const protectedFields = ['order_id', 'marketplace_booking_id', 'guest_id', 'deposit_paid_at', 'deposit_payment_method', 'deposit_stripe_session_id', 'refund_status', 'refund_processed_at', 'confirmed_at', 'confirmed_by'];
function block(extra = {}) {
  return { id: 'block-a', property_id: calendar.property_id, owner_id: calendar.owner_id, source_calendar_id: calendar.id,
    external_id: 'event-a', source: 'ical', status: 'blocked', check_in: '2026-11-01', check_out: '2026-11-04',
    ...Object.fromEntries([...moneyFields, ...protectedFields].map(key => [key, null])), ...extra };
}
function event(extra = '') {
  return `BEGIN:VEVENT\r\nUID:event-a\r\nDTSTART;VALUE=DATE:20261101\r\nDTEND;VALUE=DATE:20261104\r\nSUMMARY:Not available\r\n${extra}END:VEVENT\r\n`;
}
function feed(events = event()) { return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}END:VCALENDAR\r\n`; }
function code(path) {
  return stripTypeScriptTypes(readFileSync(new URL(path, root), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''));
}

async function run(kind, options = {}) {
  const state = { property_bookings: structuredClone(options.rows || []), property_external_calendars: [structuredClone(calendar)],
    orders: structuredClone(options.orders || []), order_items: structuredClone(options.items || []),
    properties: [{ id: calendar.property_id, owner_id: options.owner === undefined ? calendar.owner_id : options.owner }], calendar_sync_logs: [] };
  const writes = [], reads = [];
  let handler;
  let raceInserted = false;
  const sb = { from(table) {
    assert.ok(Object.hasOwn(state, table), `unexpected table ${table}: no commercial writer or pricing lookup`);
    let action = 'select', payload, singular = false;
    const filters = [];
    const q = {
      select(columns = '*') { reads.push({ table, columns }); return q; },
      eq(key, value) { filters.push(row => row[key] === value); return q; },
      is(key, value) { filters.push(row => (row[key] ?? null) === value); return q; },
      in(key, values) { filters.push(row => values.includes(row[key])); return q; },
      contains(key, value) { filters.push(row => Object.entries(value).every(([k, v]) => row[key]?.[k] === v)); return q; },
      or(expression) { const id = expression.split(',')[0].split('.').at(-1); filters.push(row => row.resource_id === id || row.metadata?.property_id === id); return q; },
      single() { singular = true; return q; }, maybeSingle() { singular = true; return q; },
      update(value) { action = 'update'; payload = value; return q; },
      insert(value) { action = 'insert'; payload = value; return q; },
      then(resolve, reject) {
        const failure = options.fail;
        if (['orders', 'order_items'].includes(table)) assert.equal(action, 'select', 'legacy commercial records are strictly read-only');
        let error = null, data;
        if (failure === `${table}:${action}` || (failure === 'timestamp' && table === 'property_external_calendars' && payload?.last_synced_at)) {
          error = { code: 'XX000', message: 'Synthetic read/write failure' };
        }
        if (action === 'select') {
          data = state[table].filter(row => filters.every(f => f(row)));
        } else if (!error) {
          const candidates = action === 'update' ? state[table].filter(row => filters.every(f => f(row))) : [payload];
          if (table === 'property_bookings') {
            if (options.conflict || (options.secondConflict && payload?.external_id === 'event-b')) error = { code: '23P01', message: 'Synthetic exclusion violation' };
            if (action === 'insert') {
              if (options.race && !raceInserted) { state.property_bookings.push(block({ ...payload, id: 'raced-id' })); raceInserted = true; }
              if (state.property_bookings.some(row => row.external_id === payload.external_id)) error = { code: '23505', message: 'Synthetic unique UID collision' };
            }
            if (!error) {
              for (const candidate of candidates) {
                const changed = { ...candidate, ...payload };
                assert.ok(changed.check_in < changed.check_out, 'half-open nonempty dates');
                if (state.property_bookings.some(row => row.id !== candidate.id && row.property_id === changed.property_id && !['cancelled', 'rejected', 'expired'].includes(row.status) && row.status != null && row.check_in < changed.check_out && changed.check_in < row.check_out)) error = { code: '23P01', message: 'Synthetic exclusion violation' };
              }
            }
          }
          if (!error) {
            if (options.convertBeforeUpdate && table === 'property_bookings' && action === 'update') {
              // Simulate commercial adoption between the read and guarded UPDATE.
              for (const row of state.property_bookings) { row.order_id = 'committed-order'; row.total_amount = 1234; }
              candidates.splice(0, candidates.length, ...state[table].filter(row => filters.every(f => f(row))));
            }
            writes.push({ table, action, payload: structuredClone(payload), ids: candidates.map(row => row.id) });
            if (action === 'insert') { data = [{ ...payload, id: payload.id || `new-${state[table].length}` }]; state[table].push(...data); }
            else { candidates.forEach(row => Object.assign(row, payload)); data = candidates; }
          }
        }
        const result = { error, count: (data?.length ?? 0) + (options.truncated === table ? 1 : 0), data: error ? null : singular ? data?.[0] ?? null : data };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return q;
  } };
  const context = vm.createContext({ createClient: () => sb,
    Deno: { serve(fn) { handler = fn; }, env: { get: () => 'synthetic-test-placeholder' } },
    withRateLimit: async () => null, RATE_LIMITS: { publicRead: {} },
    authorizeICalSync: async () => ({ calendars: [calendar], userId: calendar.owner_id }),
    requireInternalSecret: () => null,
    validateExternalUrlForSSRF: () => ({ allowed: !options.ssrfDenied, reason: 'Synthetic denied destination' }),
    propertyBookingHoldsInventory: status => status != null && !['cancelled', 'rejected', 'expired'].includes(status),
    propertyOrderHoldsInventory: status => status != null && !['cancelled', 'refunded', 'expired'].includes(status),
    console: { info() {}, warn() {}, error() {} }, Response, Request, URL, Date, Set, Map,
    fetch: async (url, init) => {
      assert.equal(url, calendar.ical_url, 'only fixture calendar fetch allowed');
      if (options.fetchFail) throw Error('Synthetic network failure');
      if (options.redirect) {
        assert.equal(init.redirect, 'error', 'external redirect must not bypass the SSRF guard');
        throw Error('Synthetic redirect refusal');
      }
      return new Response(options.content ?? feed(), { status: 200 });
    },
  });
  vm.runInContext(code('supabase/functions/_shared/cors.ts'), context);
  const shared = new URL('supabase/functions/_shared/ical-inventory-sync.ts', root);
  if (existsSync(shared)) vm.runInContext(code('supabase/functions/_shared/ical-inventory-sync.ts'), context);
  vm.runInContext(code(`supabase/functions/${kind}/index.ts`), context);
  const response = await handler(new Request('https://fixture.invalid/sync', { method: 'POST', body: '{}' }));
  const body = await response.json();
  assert.equal(response.status, kind === 'ical-sync' && body.results.some(result => !result.success) ? 502 : 200);
  return { body, result: body.results[0], state, writes, reads };
}
function assertFailed(out) {
  assert.equal(out.result.success, false);
  assert.ok(out.result.error);
  assert.ok(!out.writes.some(w => w.table === 'property_external_calendars' && w.payload.last_synced_at), 'no fresh success timestamp');
}

for (const kind of ['ical-sync', 'ical-scheduled-sync']) {
  test(`${kind}: unavailable block has no fabricated money, guest stay or commercial writes`, async () => {
    const out = await run(kind, { content: feed(event('X-AIRBNB-PRICE:693000\r\nDESCRIPTION:Email guest@example.invalid; +66999999999\r\n')) });
    assert.equal(out.result.success, true);
    const [row] = out.state.property_bookings;
    assert.equal(row.status, 'blocked'); assert.equal(row.source, 'ical'); assert.equal(row.source_calendar_id, calendar.id);
    assert.equal(row.check_in, '2026-11-01'); assert.equal(row.check_out, '2026-11-04');
    for (const key of moneyFields) assert.equal(row[key], null, key);
    assert.equal(row.guest_name, null); assert.equal(row.guest_email, null); assert.equal(row.guest_phone, null);
    assert.match(row.notes, /availability block/i);
    assert.ok(!out.reads.some(r => /price/.test(r.columns)), 'no catalogue price lookup');
    assert.ok(!out.writes.some(w => /orders|participants|ledger|payment/.test(w.table)));
    if (kind === 'ical-scheduled-sync') { assert.deepEqual(out.result.new_order_ids, []); assert.equal(out.body.summary.total_new_orders, 0); }
  });
  test(`${kind}: unchanged owned block is idempotent`, async () => {
    const out = await run(kind, { rows: [block()] });
    assert.equal(out.result.success, true); assert.equal(out.state.property_bookings.length, 1);
    assert.equal(out.state.property_bookings[0].id, 'block-a');
  });
  test(`${kind}: changed owned block preserves null money and identity`, async () => {
    const out = await run(kind, { rows: [block()], content: feed(event().replace('20261104', '20261105')) });
    assert.equal(out.result.success, true); assert.equal(out.state.property_bookings[0].check_out, '2026-11-05');
    assert.equal(out.state.property_bookings[0].total_amount, null);
  });
  test(`${kind}: retry after a duplicate insert race resolves only exact owned block`, async () => {
    const out = await run(kind, { race: true });
    assert.equal(out.result.success, true); assert.equal(out.state.property_bookings.length, 1);
  });
  test(`${kind}: same-day turnover is non-overlapping`, async () => {
    const out = await run(kind, { rows: [block({ id: 'previous', external_id: 'previous', source_calendar_id: 'calendar-b', check_in: '2026-10-30', check_out: '2026-11-01' })] });
    assert.equal(out.result.success, true); assert.equal(out.state.property_bookings.length, 2);
  });
  for (const extra of [
    { source_calendar_id: 'calendar-b' }, { property_id: 'property-b' },
    { order_id: 'order-committed' }, { total_amount: 693000, status: 'confirmed' },
    { source: 'manual' }, { marketplace_booking_id: 'marketplace-order' }, { deposit_paid_at: '2026-10-01' },
  ]) test(`${kind}: foreign/commercial UID cannot be adopted ${JSON.stringify(extra)}`, async () => {
    const original = block(extra); const out = await run(kind, { rows: [original] });
    assertFailed(out); assert.deepEqual(out.state.property_bookings, [original]);
  });
  for (const content of [
    '<html>upstream unavailable</html>', feed().replace('END:VCALENDAR', ''), feed().replace('END:VEVENT', ''),
    feed(event().replace('20261104', '20261101')), feed(event().replace('20261104', '20260230')),
    feed(event().replace('DTEND;VALUE=DATE:20261104\r\n', '')), feed(event() + event()),
    feed(event('RRULE:FREQ=DAILY\r\n')), feed(event('STATUS:CANCELLED\r\n')),
  ]) test(`${kind}: invalid/partial/unsupported feed retains inventory ${content.slice(-45)}`, async () => {
    const original = block(); const out = await run(kind, { rows: [original], content });
    assertFailed(out); assert.deepEqual(out.state.property_bookings, [original]);
  });
  test(`${kind}: missing UID and empty feeds never cancel/release known inventory`, async () => {
    for (const content of [feed(''), feed(event().replace('UID:event-a', 'UID:event-b'))]) {
      const original = block(); const out = await run(kind, { rows: [original], content });
      assertFailed(out); assert.ok(out.state.property_bookings.some(row => row.id === original.id && row.status === 'blocked'));
      assert.ok(!out.writes.some(w => w.payload.status === 'cancelled' || w.action === 'delete'));
    }
  });
  for (const fail of ['properties:select', 'property_bookings:select', 'property_bookings:insert', 'timestamp']) test(`${kind}: query failure is not success (${fail})`, async () => {
    assertFailed(await run(kind, { fail }));
  });
  test(`${kind}: update error retains old block and does not report success`, async () => {
    const original = block(); const out = await run(kind, { rows: [original], fail: 'property_bookings:update', content: feed(event().replace('20261104', '20261105')) });
    assertFailed(out); assert.deepEqual(out.state.property_bookings, [original]);
  });
  test(`${kind}: concurrent commercial adoption prevents update`, async () => {
    const out = await run(kind, { rows: [block()], convertBeforeUpdate: true, content: feed(event().replace('20261104', '20261105')) });
    assertFailed(out); assert.equal(out.state.property_bookings[0].check_out, '2026-11-04'); assert.equal(out.state.property_bookings[0].total_amount, 1234);
  });
  test(`${kind}: overlapping inventory is reported as failure`, async () => { assertFailed(await run(kind, { conflict: true })); });
  test(`${kind}: partial write preserves successful blocks and reports failed sync`, async () => {
    const second = event().replace('UID:event-a', 'UID:event-b').replace('20261101', '20261104').replace('20261104\r\nSUMMARY', '20261105\r\nSUMMARY');
    const out = await run(kind, { content: feed(event() + second), secondConflict: true });
    assertFailed(out); assert.equal(out.state.property_bookings.length, 1); assert.equal(out.state.property_bookings[0].status, 'blocked');
  });
  test(`${kind}: missing/mismatched canonical property owner fails closed`, async () => {
    for (const owner of [null, 'different-owner']) { const out = await run(kind, { owner }); assertFailed(out); assert.equal(out.state.property_bookings.length, 0); }
  });
  test(`${kind}: denied URLs, failed fetch and redirects cannot mutate inventory`, async () => {
    for (const options of [{ ssrfDenied: true }, { fetchFail: true }, { redirect: true }]) {
      const out = await run(kind, options); assertFailed(out); assert.equal(out.state.property_bookings.length, 0);
    }
  });
  test(`${kind}: orphaned legacy calendar/UID order is retained and blocks adoption`, async () => {
    const order = { id: 'legacy-order', status: 'confirmed', vertical: 'property', deleted_at: null,
      start_at: '2026-11-01T14:00:00Z', end_at: '2026-11-04T12:00:00Z', total_amount: 693000,
      metadata: { source: 'ical', source_calendar_id: calendar.id, external_id: 'event-a' } };
    const out = await run(kind, { orders: [order] });
    assertFailed(out); assert.equal(out.state.property_bookings.length, 0); assert.deepEqual(out.state.orders, [order]);
  });
  for (const content of [feed(''), feed(event().replace('UID:event-a', 'UID:unrelated-event'))]) test(`${kind}: omitted legacy calendar UID cannot report synchronization success (${content.length})`, async () => {
    const order = { id: 'legacy-omitted', status: 'confirmed', vertical: 'property', deleted_at: null,
      start_at: '2026-11-01T14:00:00Z', end_at: '2026-11-04T12:00:00Z', total_amount: 693000,
      metadata: { source: 'ical', source_calendar_id: calendar.id, external_id: 'event-a' } };
    const out = await run(kind, { orders: [order], content });
    assertFailed(out); assert.deepEqual(out.state.orders, [order]);
    assert.match(out.result.error, /legacy.*reconciliation/i);
  });
  test(`${kind}: metadata-only property order overlap requires reconciliation`, async () => {
    const order = { id: 'legacy-overlap', status: 'confirmed', vertical: 'property', deleted_at: null,
      start_at: '2026-11-02T14:00:00Z', end_at: '2026-11-03T12:00:00Z', metadata: {} };
    const item = { order_id: order.id, item_type: 'property', resource_id: null, metadata: { property_id: calendar.property_id } };
    const out = await run(kind, { orders: [order], items: [item] });
    assertFailed(out); assert.equal(out.state.property_bookings.length, 0); assert.deepEqual(out.state.orders, [order]);
  });
  test(`${kind}: canonical resource property order overlap is also retained`, async () => {
    const order = { id: 'order-a', status: 'confirmed', vertical: 'property', deleted_at: null,
      start_at: '2026-11-02T14:00:00Z', end_at: '2026-11-03T12:00:00Z', metadata: {} };
    const out = await run(kind, { orders: [order], items: [{ order_id: order.id, item_type: 'property', resource_id: calendar.property_id }] });
    assertFailed(out); assert.equal(out.state.property_bookings.length, 0);
  });
  test(`${kind}: legacy-order turnover respects exclusive checkout`, async () => {
    const order = { id: 'order-departure', status: 'confirmed', vertical: 'property', deleted_at: null,
      start_at: '2026-10-30T14:00:00Z', end_at: '2026-11-01T12:00:00Z', metadata: {} };
    const out = await run(kind, { orders: [order], items: [{ order_id: order.id, item_type: 'property', resource_id: calendar.property_id }] });
    assert.equal(out.result.success, true); assert.equal(out.state.property_bookings.length, 1);
  });
  for (const table of ['orders', 'order_items', 'property_bookings']) test(`${kind}: failed/truncated ${table} read cannot authorize inventory writes`, async () => {
    for (const options of [{ fail: `${table}:select` }, { truncated: table }]) {
      const out = await run(kind, options); assertFailed(out); assert.equal(out.state.property_bookings.length, 0);
    }
  });

}
