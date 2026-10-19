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

beforeEach(async () => {
  await sql.unsafe('TRUNCATE property_bookings, property_availability, orders, order_items, order_participants, order_addresses, order_status_history, payment_intents, reconciliation_alerts');
});

type AtomicOrderResult =
  | { success: true; order_id: string; order_number: string }
  | { success: false; error: string };

async function createPropertyOrder(attempt: string, withPaymentIntent = false): Promise<AtomicOrderResult> {
  const items = [{ resource_id: room, item_type: 'property', metadata: { property_id: room } }];
  const [row] = await sql`SELECT create_order_atomic(
    p_order_type := 'property', p_customer_user_id := ${actor},
    p_start_at := '2026-11-10', p_end_at := '2026-11-13', p_total_amount := 9000,
    p_metadata := ${sql.json({ attempt })}, p_items := ${sql.json(items)},
    p_participants := ${sql.json([{ role: 'primary', name: `Test guest ${attempt}` }])},
    p_addresses := ${sql.json([{ address_type: 'billing', address_text: `Test address ${attempt}` }])},
    p_payment_method := ${withPaymentIntent ? 'stripe' : null},
    p_payment_amount := ${withPaymentIntent ? 900 : null}) AS result`;
  return row.result as AtomicOrderResult;
}

async function checkBeforePayment(order: AtomicOrderResult, payments: string[]) {
  if (!order.success) {
    // The RPC exposes SQLERRM, not SQLSTATE. With initdb --no-locale, accept
    // only this exact deadlock abort, never an arbitrary unsuccessful RPC.
    expect(order).toEqual({ success: false, error: 'deadlock detected' });
    return 'atomic_rejection';
  }
  expect(order).toEqual({
    success: true,
    order_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
    order_number: 'TEST',
  });
  const outcome = await verifyInventoryHold(async () => {
    const holds = await sql`SELECT id FROM property_bookings WHERE external_id = ${order.order_id}
      AND property_id = ${room} AND property_booking_holds_inventory(status)`;
    return holds.length === 1;
  }, async () => {
    const cancelled = await sql`UPDATE orders SET status = 'cancelled' WHERE id = ${order.order_id} RETURNING id`;
    return cancelled.length === 1;
  });
  if (outcome === 'held') payments.push(order.order_id); // stub only, no Stripe charge
  return outcome;
}

async function expectOnlyHeldOrderCanPay(results: AtomicOrderResult[], payments: string[]) {
  expect(payments).toHaveLength(1);
  const winnerId = payments[0];
  const successfulIds = results.flatMap(result => result.success ? [result.order_id] : []).sort();
  expect(successfulIds).toContain(winnerId);
  const loserIds = successfulIds.filter(id => id !== winnerId);
  expect(await sql`SELECT id, status FROM orders ORDER BY id`).toEqual(successfulIds.map(id => ({
    id, status: id === winnerId ? 'pending' : 'cancelled',
  })));
  // Compare every persisted child with successful RPC IDs. A rolled-back RPC
  // returns no ID, so checking only returned IDs would miss orphaned residue.
  for (const table of ['order_items', 'order_participants', 'order_addresses', 'order_status_history']) {
    expect(await sql`SELECT order_id FROM ${sql(table)} ORDER BY order_id`, table)
      .toEqual(successfulIds.map(order_id => ({ order_id })));
  }
  expect(await sql`SELECT external_id, property_id, status FROM property_bookings ORDER BY external_id`)
    .toEqual(successfulIds.map(id => ({
      external_id: id, property_id: room, status: id === winnerId ? 'pending' : 'cancelled',
    })));
  expect(await sql`SELECT external_id FROM property_bookings WHERE property_booking_holds_inventory(status)`)
    .toEqual([{ external_id: winnerId }]);
  expect(await sql`SELECT * FROM payment_intents`).toHaveLength(0);
  expect(await sql`SELECT alert_type, order_id, severity, expected_amount::int AS expected_amount,
    currency, details, resolved_at FROM reconciliation_alerts ORDER BY order_id`).toEqual(loserIds.map(order_id => ({
    alert_type: 'booking_overlap', order_id, severity: 'high', expected_amount: 9000, currency: 'THB',
    details: { property_id: room, check_in: '2026-11-10', check_out: '2026-11-13' }, resolved_at: null,
  })));
  const [availability] = await sql`SELECT get_category_availability(${category},'2026-11-10','2026-11-13') AS count,
    assign_room_for_category(${category},'2026-11-10','2026-11-13') AS assigned,
    check_property_dates_available(${room},'2026-11-10','2026-11-13') AS available`;
  expect(availability).toEqual({ count: 0, assigned: null, available: false });
}

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
    // Keep the writers concurrent. GiST exclusion can reject an overlap inside
    // the trigger OR deadlock-abort one RPC, whose outer EXCEPTION rolls back
    // the entire order. Neither loser may reach payment.
    const orders = await Promise.all(['race-a', 'race-b'].map(attempt => createPropertyOrder(attempt)));
    const payments: string[] = [];
    const outcomes = await Promise.all(orders.map(order => checkBeforePayment(order, payments)));
    expect(outcomes.filter(outcome => outcome === 'held')).toHaveLength(1);
    const losers = outcomes.filter(outcome => outcome !== 'held');
    expect(losers).toHaveLength(1);
    expect(['conflict', 'atomic_rejection']).toContain(losers[0]);
    await expectOnlyHeldOrderCanPay(orders, payments);
  });

  it('a committed overlap logs one alert and the unheld order is cancelled before payment', async () => {
    // Separate deterministic coverage: the concurrent race must not depend on
    // which valid PostgreSQL loser path happens to win the scheduling race.
    const winner = await createPropertyOrder('committed-winner');
    expect(winner.success).toBe(true);
    const loser = await createPropertyOrder('committed-overlap');
    expect(loser.success).toBe(true);
    if (!winner.success || !loser.success) throw new Error('Expected both committed RPCs to succeed');
    expect(await sql`SELECT external_id FROM property_bookings`).toEqual([{ external_id: winner.order_id }]);
    expect(await sql`SELECT order_id FROM reconciliation_alerts WHERE alert_type = 'booking_overlap'`)
      .toEqual([{ order_id: loser.order_id }]);
    // A repeated order touch must not duplicate the unresolved overlap alert.
    await sql`UPDATE orders SET updated_at = now() WHERE id = ${loser.order_id}`;
    const payments: string[] = [];
    expect(await checkBeforePayment(loser, payments)).toBe('conflict');
    expect(payments).toHaveLength(0);
    expect(await checkBeforePayment(winner, payments)).toBe('held');
    await expectOnlyHeldOrderCanPay([winner, loser], payments);
  });

  it('an atomic deadlock error rolls back all order, inventory and payment-intent writes', async () => {
    // Fault injection tests rollback even after the last child and a pending
    // payment intent have been inserted; it does not replace the real race.
    await sql.unsafe(`CREATE FUNCTION test_abort_created_order() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM payment_intents WHERE order_id = NEW.order_id) THEN
          RAISE EXCEPTION 'rollback probe did not reach payment intent';
        END IF;
        RAISE EXCEPTION USING ERRCODE = '40P01', MESSAGE = 'deadlock detected';
      END $$;
      CREATE TRIGGER test_abort_created_order AFTER INSERT ON order_status_history
        FOR EACH ROW EXECUTE FUNCTION test_abort_created_order()`);
    try {
      const order = await createPropertyOrder('rollback-probe', true);
      expect(order).toEqual({ success: false, error: 'deadlock detected' });
      const payments: string[] = [];
      expect(await checkBeforePayment(order, payments)).toBe('atomic_rejection');
      expect(payments).toHaveLength(0);
      for (const table of ['orders', 'order_items', 'order_participants', 'order_addresses',
        'order_status_history', 'property_bookings', 'property_availability', 'payment_intents', 'reconciliation_alerts']) {
        expect(await sql`SELECT * FROM ${sql(table)}`, table).toHaveLength(0);
      }
    } finally {
      await sql.unsafe('DROP TRIGGER test_abort_created_order ON order_status_history; DROP FUNCTION test_abort_created_order()');
    }
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
