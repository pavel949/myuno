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
const postgresBinary = execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim();
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
    const items = JSON.stringify([{ resource_id: room, item_type: 'property', metadata: { property_id: room } }]);
    const orders = await Promise.all([1,2].map(() => sql`SELECT create_order_atomic(
      p_order_type := 'property', p_customer_user_id := ${actor},
      p_start_at := '2026-11-10', p_end_at := '2026-11-13', p_total_amount := 9000,
      p_items := ${items}::jsonb) AS result`));
    const payments: string[] = [];
    const outcomes = await Promise.all(orders.map(async rows => {
      const order = rows[0].result as { success: boolean; order_id: string };
      expect(order.success).toBe(true); // trigger catches exclusion violation
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
});