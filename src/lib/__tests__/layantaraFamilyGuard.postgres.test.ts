import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

const MIGRATION = 'supabase/migrations/20261021090000_layantara_pms_spine.sql';
const FIXTURE = 'src/lib/__tests__/fixtures/family-guard-schema.sql';

// Skip (rather than fail) when no local PostgreSQL server binaries are installed.
function locatePostgres(): string | null {
  try { return execFileSync('which', ['postgres'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* fall through */ }
  try { return join(execFileSync('pg_config', ['--bindir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'postgres'); } catch { return null; }
}
const postgresBinary = locatePostgres();
const available = postgresBinary !== null && existsSync(postgresBinary);
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
const postgresRoot = available ? dirname(dirname(realpathSync(postgresBinary as string))) : '';
const libraryPath = available && existsSync(join(postgresRoot, 'lib', 'dict_snowball.so')) ? join(postgresRoot, 'lib') : null;
function run(binary: string, args: string[]) {
  const executable = existsSync(join(postgresRoot, 'bin', binary)) ? join(postgresRoot, 'bin', binary) : binary;
  return asRoot ? execFileSync('runuser', ['-u', owner, '--', executable, ...args], { encoding: 'utf8' })
    : execFileSync(executable, args, { encoding: 'utf8' });
}

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const MC = id(900);
const PROJECT = id(901);
const VILLA = id(1), ROOM_A = id(2), ROOM_B = id(3), OTHER_VILLA = id(4), OTHER_ROOM = id(5), RESORT = id(6), RESORT_CHILD = id(7);

let directory = '';
let sql: ReturnType<typeof postgres>;
let started = false;

async function setFlag(enabled: boolean) {
  await sql`INSERT INTO system_settings (key, value) VALUES ('feature_flag:layantara_pms', ${sql.json({ enabled })})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}
async function book(propertyId: string, checkIn: string, checkOut: string, status: string | null = 'confirmed') {
  const [row] = await sql`INSERT INTO property_bookings (property_id, check_in, check_out, status)
    VALUES (${propertyId}, ${checkIn}::date, ${checkOut}::date, ${status}) RETURNING id`;
  return row.id as string;
}
async function tasksFor(bookingId: string) {
  return sql`SELECT * FROM property_operational_tasks WHERE booking_id = ${bookingId} AND notes = 'auto:turnover'`;
}

describe.skipIf(!available)('Layan Tara PMS spine migration (disposable PostgreSQL)', () => {
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'myuno-family-guard-'));
    chmodSync(directory, 0o700);
    if (asRoot) chownSync(directory, 65534, 65534);
    run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libraryPath ? ['-c', `dynamic_library_path=${libraryPath}`] : [])]);
    run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'postgres.log'), '-o',
      `-k ${directory} -p 55441 -c listen_addresses=''${libraryPath ? ` -c dynamic_library_path=${libraryPath}` : ''}`, '-w', 'start']);
    started = true;
    sql = postgres({ host: directory, port: 55441, database: 'postgres', username: owner, password: '', max: 4, onnotice: () => {} });
    await sql.unsafe(readFileSync(FIXTURE, 'utf8'));
    await sql.unsafe(readFileSync(MIGRATION, 'utf8'));
  }, 60000);

  afterAll(async () => {
    if (sql) await sql.end();
    if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']);
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await sql`TRUNCATE property_operational_tasks, property_bookings, properties CASCADE`;
    await sql`INSERT INTO properties (id, project_id, management_company_id, property_kind, unit_number) VALUES
      (${VILLA}, ${PROJECT}, ${MC}, 'unit', 'V1'), (${OTHER_VILLA}, ${PROJECT}, ${MC}, 'unit', 'V2'),
      (${RESORT}, ${PROJECT}, ${MC}, 'resort', 'RES')`;
    await sql`INSERT INTO properties (id, project_id, management_company_id, property_kind, unit_number, parent_property_id) VALUES
      (${ROOM_A}, ${PROJECT}, ${MC}, 'unit', 'V1-A', ${VILLA}), (${ROOM_B}, ${PROJECT}, ${MC}, 'unit', 'V1-B', ${VILLA}),
      (${OTHER_ROOM}, ${PROJECT}, ${MC}, 'unit', 'V2-A', ${OTHER_VILLA}), (${RESORT_CHILD}, ${PROJECT}, ${MC}, 'unit', 'RES-1', ${RESORT})`;
    await setFlag(true);
  });

  describe('migration', () => {
    it('should be idempotent when applied twice', async () => {
      await expect(sql.unsafe(readFileSync(MIGRATION, 'utf8'))).resolves.toBeDefined();
    });

    it('should seed the flag disabled by default (layantara_pms_enabled false on a clean flag row)', async () => {
      await sql`DELETE FROM system_settings WHERE key = 'feature_flag:layantara_pms'`;
      await sql.unsafe(readFileSync(MIGRATION, 'utf8'));
      const [row] = await sql`SELECT public.layantara_pms_enabled() AS on`;
      expect(row.on).toBe(false);
    });

    it.each([['true', true], ['"true"', true], ['"on"', true], ['1', true], ['false', false], ['"off"', false]])(
      'should coerce flag value %s to %s', async (raw, expected) => {
        await sql.unsafe(`UPDATE system_settings SET value = '${raw}'::jsonb WHERE key = 'feature_flag:layantara_pms'`);
        const [row] = await sql`SELECT public.layantara_pms_enabled() AS on`;
        expect(row.on).toBe(expected);
      });

    it('should default is_bookable_key to true', async () => {
      const [row] = await sql`SELECT is_bookable_key FROM properties WHERE id = ${VILLA}`;
      expect(row.is_bookable_key).toBe(true);
    });
  });

  describe('family overlap guard', () => {
    it('should raise 23P01 when a room is booked over a held villa stay', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09');
      await expect(book(ROOM_A, '2026-11-07', '2026-11-08')).rejects.toMatchObject({ code: '23P01' });
    });

    it('should raise 23P01 when the villa is booked over a held room stay', async () => {
      await book(ROOM_A, '2026-11-05', '2026-11-09');
      await expect(book(VILLA, '2026-11-08', '2026-11-12')).rejects.toMatchObject({ code: '23P01' });
    });

    it('should use FAMILY_OVERLAP as the error message', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09');
      await expect(book(ROOM_A, '2026-11-07', '2026-11-08')).rejects.toMatchObject({ message: expect.stringContaining('FAMILY_OVERLAP') });
    });

    it('should allow sibling rooms to overlap', async () => {
      await book(ROOM_A, '2026-11-05', '2026-11-09');
      await expect(book(ROOM_B, '2026-11-05', '2026-11-09')).resolves.toBeTruthy();
    });

    it('should allow back-to-back villa and room stays', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09');
      await expect(book(ROOM_A, '2026-11-09', '2026-11-11')).resolves.toBeTruthy();
    });

    it('should allow a room in a different villa to overlap', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09');
      await expect(book(OTHER_ROOM, '2026-11-05', '2026-11-09')).resolves.toBeTruthy();
    });

    it('should ignore a cancelled villa booking', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09', 'cancelled');
      await expect(book(ROOM_A, '2026-11-05', '2026-11-09')).resolves.toBeTruthy();
    });

    it('should not hold when the existing booking status is NULL', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09', null);
      await expect(book(ROOM_A, '2026-11-05', '2026-11-09')).resolves.toBeTruthy();
    });

    it('should raise when an update moves a booking into a family overlap', async () => {
      await book(VILLA, '2026-11-05', '2026-11-09');
      const roomBooking = await book(ROOM_A, '2026-11-20', '2026-11-22');
      await expect(sql`UPDATE property_bookings SET check_in = '2026-11-06', check_out = '2026-11-07' WHERE id = ${roomBooking}`)
        .rejects.toMatchObject({ code: '23P01' });
    });

    it('should allow the overlap when the flag is off', async () => {
      await setFlag(false);
      await book(VILLA, '2026-11-05', '2026-11-09');
      await expect(book(ROOM_A, '2026-11-07', '2026-11-08')).resolves.toBeTruthy();
    });

    it('should leave a resort-kind root unaffected', async () => {
      await book(RESORT, '2026-11-05', '2026-11-09');
      await expect(book(RESORT_CHILD, '2026-11-07', '2026-11-08')).resolves.toBeTruthy();
    });
  });

  describe('depth guard', () => {
    it('should reject a grandchild (parent that already has a parent)', async () => {
      await expect(sql`INSERT INTO properties (project_id, management_company_id, parent_property_id) VALUES (${PROJECT}, ${MC}, ${ROOM_A})`)
        .rejects.toBeDefined();
    });

    it('should reject self-parenting', async () => {
      await expect(sql`UPDATE properties SET parent_property_id = ${OTHER_VILLA} WHERE id = ${OTHER_VILLA}`).rejects.toBeDefined();
    });

    it('should reject giving a parent to a property that already has children', async () => {
      await expect(sql`UPDATE properties SET parent_property_id = ${OTHER_VILLA} WHERE id = ${VILLA}`).rejects.toBeDefined();
    });

    it('should reject a child under a parent from a different management company', async () => {
      const otherMc = id(902);
      await expect(sql`INSERT INTO properties (project_id, management_company_id, parent_property_id) VALUES (${PROJECT}, ${otherMc}, ${VILLA})`)
        .rejects.toBeDefined();
    });

    it('should still reject a grandchild when the flag is off', async () => {
      await setFlag(false);
      await expect(sql`INSERT INTO properties (project_id, management_company_id, parent_property_id) VALUES (${PROJECT}, ${MC}, ${ROOM_A})`)
        .rejects.toBeDefined();
    });
  });

  describe('turnover task trigger', () => {
    it('should create one pending cleaning task on check-out for a confirmed booking', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09');
      const [t] = await sql`SELECT task_type, status, property_id, scheduled_date::text AS d FROM property_operational_tasks
        WHERE booking_id = ${b} AND notes = 'auto:turnover'`;
      expect([t.task_type, t.status, t.property_id, t.d]).toEqual(['cleaning', 'pending', ROOM_A, '2026-11-09']);
    });

    it('should not create a task for a pending booking', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09', 'pending');
      expect(await tasksFor(b)).toHaveLength(0);
    });

    it('should not create a task when the flag is off', async () => {
      await setFlag(false);
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09');
      expect(await tasksFor(b)).toHaveLength(0);
    });

    it('should not duplicate the task on an unrelated update', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09');
      await sql`UPDATE property_bookings SET guest_name = 'Renamed' WHERE id = ${b}`;
      await sql`UPDATE property_bookings SET status = 'checked_in' WHERE id = ${b}`;
      expect(await tasksFor(b)).toHaveLength(1);
    });

    it('should create the task when a pending booking is later confirmed', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09', 'pending');
      await sql`UPDATE property_bookings SET status = 'confirmed' WHERE id = ${b}`;
      expect(await tasksFor(b)).toHaveLength(1);
    });

    it('should move scheduled_date when check-out moves on a pending task', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09');
      await sql`UPDATE property_bookings SET check_out = '2026-11-11' WHERE id = ${b}`;
      const [t] = await sql`SELECT scheduled_date::text AS d FROM property_operational_tasks WHERE booking_id = ${b} AND notes = 'auto:turnover'`;
      expect(t.d).toBe('2026-11-11');
    });

    it('should cancel the pending task when the booking is cancelled', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09');
      await sql`UPDATE property_bookings SET status = 'cancelled' WHERE id = ${b}`;
      const [t] = await tasksFor(b);
      expect(t.status).toBe('cancelled');
    });

    it('should not touch a manual task for the same booking', async () => {
      const b = await book(ROOM_A, '2026-11-05', '2026-11-09');
      await sql`INSERT INTO property_operational_tasks (property_id, booking_id, task_type, title, scheduled_date, notes)
                VALUES (${ROOM_A}, ${b}, 'cleaning', 'Manual', '2026-11-09', 'manual')`;
      await sql`UPDATE property_bookings SET status = 'cancelled' WHERE id = ${b}`;
      const [t] = await sql`SELECT status FROM property_operational_tasks WHERE booking_id = ${b} AND notes = 'manual'`;
      expect(t.status).toBe('pending');
    });
  });
});

describe.skipIf(available)('Layan Tara PMS spine migration (no local PostgreSQL)', () => {
  it.skip('requires PostgreSQL server binaries (postgres/initdb/pg_ctl) on PATH or via pg_config', () => {});
});
