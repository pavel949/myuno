import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
import { verifyInventoryHold } from '../../../supabase/functions/_shared/inventory-hold';

const room = '00000000-0000-4000-8000-000000000001';
const category = '00000000-0000-4000-8000-000000000002';
const actor = '00000000-0000-4000-8000-000000000003';
let directory: string;
let sql: ReturnType<typeof postgres>;
let started = false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
function resolvePostgresBinary(): string {
  try { return execFileSync('which', ['postgres'], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); }
  catch { return join(execFileSync('pg_config', ['--bindir'], { encoding: 'utf8' }).trim(), 'postgres'); }
}
const postgresBinary = resolvePostgresBinary();
const postgresRoot = dirname(dirname(realpathSync(postgresBinary)));
// Nix relocates binaries without pg_config; explicitly resolve its module path.
const libraryPath = existsSync(join(postgresRoot, 'lib', 'dict_snowball.so')) ? join(postgresRoot, 'lib') : null;
function run(binary: string, args: string[]) {
  const executable = existsSync(join(postgresRoot, 'bin', binary)) ? join(postgresRoot, 'bin', binary) : binary;
  return asRoot ? execFileSync('runuser', ['-u', owner, '--', executable, ...args], { encoding: 'utf8' })
    : execFileSync(executable, args, { encoding: 'utf8' });
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-inventory-'));
  chmodSync(directory, 0o700);
  if (asRoot) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libraryPath ? ['-c', `dynamic_library_path=${libraryPath}`] : [])]);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'postgres.log'), '-o', `-k ${directory} -p 55439 -c listen_addresses=''${libraryPath ? ` -c dynamic_library_path=${libraryPath}` : ''}`, '-w', 'start']);
  started = true;
  // Explicit socket path/user/database: no inherited production credentials.
  sql = postgres({ host: directory, port: 55439, database: 'postgres', username: owner, password: '', max: 4 });
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql', 'utf8'));
  await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql', 'utf8'));
  await sql.unsafe(readFileSync('drizzle/migrations/0020_preserve_property_booking_lifecycle_status.sql', 'utf8'));
  await sql.unsafe(readFileSync('supabase/migrations/20260208121930_ac8db36c-2587-4313-a47f-f5ff46232cd3.sql', 'utf8'));
  await sql.unsafe(`CREATE TRIGGER sync_order_to_property_booking AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_sync_order_to_property_booking()`);
  await sql`INSERT INTO properties VALUES (${room}, ${actor}, ${category}, true, '101')`;
}, 30000);

afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

// Unapplied critical-stage candidate, tested against dated live predecessors.
// Every test uses the disposable Unix-socket database above, never Supabase.
describe('atomic property-order review candidate', () => {
  const signature = 'public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)';
  const predecessor = JSON.parse(readFileSync('docs/convergence/atomic_property_order/predecessors.json', 'utf8')) as {
    rows: { proname: string; definition: string; hash: string }[];
  };
  const forward = readFileSync('docs/convergence/atomic_property_order/forward.sql', 'utf8');
  const rollback = readFileSync('docs/convergence/atomic_property_order/rollback.sql', 'utf8');
  const start = '2026-11-10T14:00:00Z', end = '2026-11-13T12:00:00Z';
  const items = [{ resource_id: room, item_type: 'property', metadata: { property_id: room } }];
  type Result = { success: boolean; order_id?: string; error?: string };
  async function create(input: { type?: string; start?: string | null; end?: string | null; items?: unknown } = {}): Promise<Result> {
    const [row] = await sql`SELECT create_order_atomic(
      p_order_type := ${input.type ?? 'property'}, p_customer_user_id := ${actor},
      p_start_at := ${input.start === undefined ? start : input.start},
      p_end_at := ${input.end === undefined ? end : input.end}, p_total_amount := 9000,
      p_items := ${sql.json((input.items === undefined ? items : input.items) as postgres.JSONValue)},
      p_participants := '[{"role":"guest","name":"Synthetic Guest"}]'::jsonb,
      p_payment_method := 'stripe', p_payment_amount := 900) AS result`;
    return row.result as Result;
  }
  async function restorePredecessors() {
    for (const row of predecessor.rows) await sql.unsafe(row.definition);
    await sql.unsafe(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated;
      GRANT EXECUTE ON FUNCTION ${signature} TO service_role`);
  }
  async function applyScript(script: string) {
    // The script includes BEGIN/COMMIT. Pin both commands and error recovery
    // to one connection while retaining the pool for actual race tests.
    const connection = await sql.reserve();
    try {
      await connection.unsafe(script);
    } catch (error) {
      await connection.unsafe('ROLLBACK');
      throw error;
    } finally { connection.release(); }
  }
  async function counts() {
    const [row] = await sql`SELECT (SELECT count(*)::int FROM orders) orders,
      (SELECT count(*)::int FROM order_items) items,
      (SELECT count(*)::int FROM order_participants) guests,
      (SELECT count(*)::int FROM payment_intents) intents,
      (SELECT count(*)::int FROM order_status_history) history,
      (SELECT count(*)::int FROM property_bookings) bookings,
      (SELECT count(*)::int FROM reconciliation_alerts) alerts`;
    return row;
  }
  beforeEach(async () => { await restorePredecessors(); await applyScript(forward); });
  afterAll(restorePredecessors);

  it('persists exactly one linked hold, guest, intent and history in one transaction', async () => {
    const result = await create();
    expect(result.success, result.error).toBe(true);
    expect(await counts()).toEqual({ orders: 1, items: 1, guests: 1, intents: 1, history: 1, bookings: 1, alerts: 0 });
    const [booking] = await sql`SELECT external_id, guest_name, status FROM property_bookings`;
    expect(booking).toMatchObject({ external_id: result.order_id, guest_name: 'Synthetic Guest', status: 'pending' });
  });

  it('two concurrent reservations produce one order and one hold, without an orphan or alert', async () => {
    const results = await Promise.all([create(), create()]);
    expect(results.filter(r => r.success)).toHaveLength(1);
    expect(results.find(r => !r.success)?.error).toBe('property_inventory_not_committed');
    expect(await counts()).toEqual({ orders: 1, items: 1, guests: 1, intents: 1, history: 1, bookings: 1, alerts: 0 });
  });

  it('does not steal an unlinked imported stay with identical dates', async () => {
    const [legacy] = await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status,guest_name)
      VALUES (${room},'2026-11-10','2026-11-13','confirmed','Original Guest') RETURNING id`;
    expect(await create()).toMatchObject({ success: false, error: 'property_inventory_not_committed' });
    const [booking] = await sql`SELECT id,external_id,guest_name FROM property_bookings`;
    expect(booking).toEqual({ id: legacy.id, external_id: null, guest_name: 'Original Guest' });
    expect(await counts()).toEqual({ orders: 0, items: 0, guests: 0, intents: 0, history: 0, bookings: 1, alerts: 0 });
  });

  it('preserves an explicit legacy order_id link without duplicating or adopting by dates', async () => {
    const [order] = await sql`INSERT INTO orders(order_type,status,start_at,end_at,total_amount,currency,metadata)
      VALUES ('property','confirmed',${start},${end},9000,'THB','{}') RETURNING id`;
    await sql`INSERT INTO order_participants(order_id,role,name) VALUES (${order.id},'guest','Original Guest')`;
    const [legacy] = await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status,guest_name,order_id)
      VALUES (${room},'2026-11-10','2026-11-13','confirmed','Original Guest',${order.id}) RETURNING id`;
    await sql`INSERT INTO order_items(order_id,item_type,resource_id) VALUES (${order.id},'property',${room})`;
    const [booking] = await sql`SELECT id,order_id,external_id,guest_name,status FROM property_bookings`;
    expect(booking).toEqual({ id: legacy.id, order_id: order.id, external_id: order.id, guest_name: 'Original Guest', status: 'confirmed' });
    expect((await create()).success).toBe(false);
    expect((await counts()).bookings).toBe(1);
  });

  it('allows the next arrival on checkout day', async () => {
    expect((await create()).success).toBe(true);
    expect((await create({ start: end, end: '2026-11-15T12:00:00Z' })).success).toBe(true);
    expect((await counts()).bookings).toBe(2);
  });

  it('rejects an already persisted manual block but excludes the checkout date', async () => {
    await sql`INSERT INTO property_availability VALUES (${room},'2026-11-13','blocked')`;
    expect((await create()).success).toBe(true);
    await sql.unsafe('TRUNCATE orders, order_items, order_participants, property_bookings, payment_intents, order_status_history');
    await sql`INSERT INTO property_availability VALUES (${room},'2026-11-11','blocked')`;
    expect(await create()).toMatchObject({ success: false, error: 'property_dates_blocked' });
    expect((await counts()).orders).toBe(0);
  });

  it.each([
    { start: null, error: 'invalid_property_stay_dates' },
    { end: start, error: 'invalid_property_stay_dates' },
    { end: '2026-11-09T12:00:00Z', error: 'invalid_property_stay_dates' },
    { items: [], error: 'one_property_item_required' },
    { items: null, error: 'one_property_item_required' },
    { items: [...items, ...items], error: 'one_property_item_required' },
    { items: [{ item_type: 'property' }], error: 'invalid_property_item_link' },
    { items: [{ ...items[0], metadata: { property_id: category } }], error: 'invalid_property_item_link' },
    { items: [{ ...items[0], resource_id: category, metadata: {} }], error: 'property_not_found' },
    { items: [{ ...items[0], start_at: '2026-11-11T14:00:00Z' }], error: 'property_item_dates_mismatch' },
  ])('rejects malformed inventory input before leaving any rows: $error', async ({ error, ...input }) => {
    expect(await create(input)).toMatchObject({ success: false, error });
    expect(await counts()).toEqual({ orders: 0, items: 0, guests: 0, intents: 0, history: 0, bookings: 0, alerts: 0 });
  });

  it.each(['UTC', 'Asia/Bangkok', 'America/Los_Angeles'])('uses Bangkok civil dates with database timezone %s', async zone => {
    // Pin this assertion to one connection: session settings must not leak
    // between pooled connections. The RPC itself is timezone independent.
    await sql.begin(async tx => {
      await tx`SELECT set_config('TimeZone', ${zone}, true)`;
      const [result] = await tx`SELECT create_order_atomic('property',${actor},NULL,
        '2026-11-10T18:00:00Z','2026-11-13T18:00:00Z',9000,'THB',NULL,'{}',${tx.json(items)}) AS result`;
      expect(result.result.success, result.result.error).toBe(true);
      const [booking] = await tx`SELECT check_in::text,check_out::text FROM property_bookings`;
      expect(booking).toEqual({ check_in: '2026-11-11', check_out: '2026-11-14' });
    });
  });

  it('a late history failure rolls back the inventory, payment intent and all order children', async () => {
    await sql.unsafe(`CREATE FUNCTION fail_atomic_history_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'synthetic_history_failure'; END $$;
      CREATE TRIGGER fail_atomic_history_fixture BEFORE INSERT ON order_status_history
        FOR EACH ROW EXECUTE FUNCTION fail_atomic_history_fixture()`);
    try {
      expect(await create()).toMatchObject({ success: false, error: 'synthetic_history_failure' });
      expect(await counts()).toEqual({ orders: 0, items: 0, guests: 0, intents: 0, history: 0, bookings: 0, alerts: 0 });
    } finally {
      await sql.unsafe('DROP TRIGGER fail_atomic_history_fixture ON order_status_history; DROP FUNCTION fail_atomic_history_fixture()');
    }
  });

  it('preserves service-only primitive access and denies direct customer/anonymous invocation', async () => {
    for (const role of ['anon', 'authenticated']) {
      await expect(sql.begin(async tx => {
        await tx.unsafe(`SET LOCAL ROLE ${role}`);
        return tx`SELECT create_order_atomic('property',${actor})`;
      })).rejects.toThrow(/permission denied/);
    }
    const [privileges] = await sql`SELECT has_function_privilege('service_role',${signature},'EXECUTE') AS service`;
    expect(privileges.service).toBe(true);
  });

  it('rejects predecessor drift atomically, without silently overwriting newer functions', async () => {
    const [before] = await sql`SELECT pg_get_functiondef('trg_sync_order_to_property_booking()'::regprocedure) AS definition`;
    const connection = await sql.reserve();
    try {
      await expect(connection.unsafe(forward)).rejects.toThrow(/predecessor_drift/);
      // Roll back the same connection after the intentionally rejected script.
      await connection.unsafe('ROLLBACK');
    } finally { connection.release(); }
    const [after] = await sql`SELECT pg_get_functiondef('trg_sync_order_to_property_booking()'::regprocedure) AS definition`;
    expect(after.definition).toBe(before.definition);
  });

  it('rollback disables property creation without restoring unlinked adoption or affecting service orders', async () => {
    await applyScript(rollback);
    expect(await create()).toMatchObject({ success: false, error: 'property_order_writer_disabled' });
    expect((await create({ type: 'service', items: [], start: null, end: null })).success).toBe(true);
    expect((await counts()).bookings).toBe(0);
    const [bridge] = await sql`SELECT pg_get_functiondef('trg_sync_order_to_property_booking()'::regprocedure) AS definition`;
    expect(bridge.definition).toContain('WHERE order_id = NEW.id');
    expect(bridge.definition).not.toContain('WHERE external_id IS NULL AND property_id');
  });
});

beforeEach(async () => {
  await sql.unsafe('TRUNCATE property_bookings, property_availability, orders, order_items, order_participants, order_status_history, payment_intents, reconciliation_alerts');
});

describe('actual PostgreSQL inventory contract', () => {
  it.each([
    ['pending', true], ['confirmed', true], ['checked_in', true], ['checked_out', true],
    ['completed', true], ['no_show', true], ['cancelled', false], ['rejected', false],
    ['expired', false], [null, false],
  ] as const)('%s: category count, assignment, unit check, calendar and exclusion agree', async (status, holds) => {
    await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status) VALUES (${room},'2026-11-10','2026-11-13',${status})`;
    const [result] = await sql`SELECT get_category_availability(${category},'2026-11-10','2026-11-13') AS count,
      assign_room_for_category(${category},'2026-11-10','2026-11-13') AS assigned,
      check_property_dates_available(${room},'2026-11-10','2026-11-13') AS available`;
    expect(result.count).toBe(holds ? 0 : 1);
    expect(result.assigned).toBe(holds ? null : room);
    expect(result.available).toBe(!holds);
    const dates = await sql`SELECT * FROM get_property_unavailable_dates(${room},'2026-11-10','2026-11-14')`;
    expect(dates.filter(d => d.kind === 'booked')).toHaveLength(holds ? 3 : 0);
    const insert = sql`INSERT INTO property_bookings(property_id,check_in,check_out,status) VALUES (${room},'2026-11-11','2026-11-12','confirmed')`;
    if (holds) await expect(insert).rejects.toMatchObject({ code: '23P01' });
    else await expect(insert).resolves.toBeDefined();
  });

  it('checkout day permits adjacent stay, and manual blocks close nights only', async () => {
    await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status) VALUES (${room},'2026-11-10','2026-11-13','confirmed')`;
    const [result] = await sql`SELECT get_category_availability(${category},'2026-11-13','2026-11-15') AS count`;
    expect(result.count).toBe(1);
    await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status) VALUES (${room},'2026-11-13','2026-11-15','confirmed')`;
    await sql`INSERT INTO property_availability VALUES (${room},'2026-11-16','blocked')`;
    const [blocked] = await sql`SELECT check_property_dates_available(${room},'2026-11-16','2026-11-17') AS available`;
    expect(blocked.available).toBe(false);
  });

  it('order writer preserves no_show/check-in/out and releases on expiry/refund/cancellation', async () => {
    const [order] = await sql`INSERT INTO orders(status,start_at,end_at) VALUES ('pending','2026-11-10','2026-11-13') RETURNING id`;
    await sql`INSERT INTO order_items(order_id,item_type,resource_id) VALUES (${order.id},'property',${room})`;
    for (const status of ['confirmed','checked_in','checked_out','no_show','completed','expired','refunded','cancelled']) {
      await sql`UPDATE orders SET status = ${status} WHERE id = ${order.id}`;
      const [booking] = await sql`SELECT status FROM property_bookings WHERE external_id = ${order.id}`;
      expect(booking.status).toBe(['expired','refunded','cancelled'].includes(status) ? 'cancelled' : status);
    }
  });

  it('two RPC assignments can choose the same room; exclusion lets only one order reach payment', async () => {
    const assignments = await Promise.all([1,2].map(() => sql`SELECT assign_room_for_category(${category},'2026-11-10','2026-11-13') AS room`));
    expect(assignments.map(r => r[0].room)).toEqual([room, room]);
    const items = [{ resource_id: room, item_type: 'property', metadata: { property_id: room } }];
    const orders = await Promise.all([1,2].map(() => sql`SELECT create_order_atomic(
      p_order_type := 'property', p_customer_user_id := ${actor},
      p_start_at := '2026-11-10', p_end_at := '2026-11-13', p_total_amount := 9000,
      p_items := ${sql.json(items)}) AS result`));
    const payments: string[] = [];
    const outcomes = await Promise.all(orders.map(async rows => {
      const order = rows[0].result as { success: boolean; order_id: string; error?: string };
      expect(order.success, order.error).toBe(true); // trigger catches exclusion violation
      const outcome = await verifyInventoryHold(async () => {
        const holds = await sql`SELECT id FROM property_bookings WHERE external_id = ${order.order_id} AND property_booking_holds_inventory(status)`;
        return holds.length === 1;
      }, async () => {
        const cancelled = await sql`UPDATE orders SET status = 'cancelled' WHERE id = ${order.order_id} RETURNING id`;
        return cancelled.length === 1;
      });
      if (outcome === 'held') payments.push(order.order_id);
      return outcome;
    }));
    expect(outcomes.sort()).toEqual(['conflict','held']);
    expect(payments).toHaveLength(1); // payment is a stub, no Stripe charge
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM property_bookings WHERE property_booking_holds_inventory(status)`;
    expect(count).toBe(1);
    const alerts = await sql`SELECT * FROM reconciliation_alerts WHERE alert_type = 'booking_overlap'`;
    expect(alerts).toHaveLength(1);
  });

  it('0018 rollback is executable and restores exact pre-0018 category functions', async () => {
    await sql.unsafe(readFileSync('docs/hardening/rollback/0018_align_room_assignment_statuses.sql','utf8'));
    await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status) VALUES (${room},'2026-11-10','2026-11-13','no_show')`;
    const [{ count }] = await sql`SELECT get_category_availability(${category},'2026-11-10','2026-11-13') AS count`;
    expect(count).toBe(1); // exact old bug, not an endorsed fix
    await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
  });

  it('correction rollback executes and restores old status-label mapping', async () => {
    await sql.unsafe(readFileSync('docs/hardening/rollback/0019_0020_inventory_correction.sql','utf8'));
    const [order] = await sql`INSERT INTO orders(status,start_at,end_at) VALUES ('pending','2026-11-10','2026-11-13') RETURNING id`;
    await sql`INSERT INTO order_items(order_id,item_type,resource_id) VALUES (${order.id},'property',${room})`;
    await sql`UPDATE orders SET status = 'no_show' WHERE id = ${order.id}`;
    const [booking] = await sql`SELECT status FROM property_bookings WHERE external_id = ${order.id}`;
    expect(booking.status).toBe('pending');
    await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
    await sql.unsafe(readFileSync('drizzle/migrations/0020_preserve_property_booking_lifecycle_status.sql','utf8'));
  });
});
