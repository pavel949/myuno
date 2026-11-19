// Characterization only: executes the existing edge handler with synthetic ports.
// No Supabase, email, WhatsApp, credentials or network are used.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

async function harness(options: { unauthorized?: boolean; bookingError?: boolean; passengerError?: boolean; notificationsConfigured?: boolean } = {}) {
  const writes: Array<{ table: string; value: unknown }> = [];
  const network = vi.fn(async () => ({ json: async () => ({ sent: true }) }));
  const email = vi.fn(async (_payload: unknown) => ({}));
  let handler!: (req: Request) => Promise<Response>;
  const source = readFileSync(`${process.cwd()}/supabase/functions/notify-fasttrack-booking/index.ts`, 'utf8');
  const compiled = ts.transpileModule(source.replace(/^import .*;\n/gm, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  runInNewContext(compiled, {
    Response, URLSearchParams, console: { info: vi.fn(), error: vi.fn() }, fetch: network,
    Deno: { serve: (fn: typeof handler) => { handler = fn; }, env: { get: () => options.notificationsConfigured ? 'synthetic-only' : undefined } },
    Resend: class { emails = { send: email }; },
    corsHeaders: {}, requireAuth: async () => options.unauthorized ? new Response('Unauthorized', { status: 401 }) : { user: { id: 'verified-synthetic-actor' } },
    getAdminEmails: async () => ['admin@example.test'], getAdminWhatsApp: async () => '000000000',
    createServiceClient: () => ({ from: (table: string) => ({ insert: (value: unknown) => {
      writes.push({ table, value });
      if (table === 'airport_bookings') return { select: () => ({ single: async () => ({ data: { id: 'synthetic-booking' }, error: options.bookingError ? { message: 'synthetic failure' } : null }) }) };
      if (table === 'airport_passengers') return Promise.resolve({ error: options.passengerError ? { message: 'synthetic failure' } : null });
      throw Error(`Unexpected table ${table}`);
    } }) }),
  });
  const response = await handler(new Request('https://example.test/synthetic', { method: 'POST', body: JSON.stringify({
    user_id: 'forged-body-actor', service_id: 'synthetic-service', direction: 'arrival', flight_number: 'TEST1',
    flight_date: '2099-12-01', flight_time: '12:00', total_price: 2000, currency: 'THB', addon_ids: [],
    passengers: [{ first_name: 'Synthetic', last_name: 'Guest', passport_number: 'SYNTHETIC', nationality: 'TEST', date_of_birth: '2000-01-01' }],
  }) }));
  return { response, writes, network, email };
}

describe('Fast Track current writer acceptance boundaries (synthetic)', () => {
  it('rejects unauthenticated callers before any persistence', async () => {
    const r = await harness({ unauthorized: true }); expect(r.response.status).toBe(401); expect(r.writes).toEqual([]); expect(r.network).not.toHaveBeenCalled();
  });
  it('writes booking and passengers under verified actor; success does not prove delivery', async () => {
    const r = await harness(); expect(await r.response.json()).toEqual({ success: true, booking_id: 'synthetic-booking' });
    expect(r.writes.map(w => w.table)).toEqual(['airport_bookings', 'airport_passengers']);
    expect(r.writes[0].value).toMatchObject({ user_id: 'verified-synthetic-actor', status: 'draft' });
    expect(r.network).not.toHaveBeenCalled();
  });
  it('reaches configured synthetic notification ports only after both inserts succeed', async () => {
    const r = await harness({ notificationsConfigured: true });
    expect(await r.response.json()).toEqual({ success: true, booking_id: 'synthetic-booking' });
    expect(r.network).toHaveBeenCalledTimes(1); expect(r.email).toHaveBeenCalledTimes(1);
    expect(r.email.mock.calls[0][0]).toMatchObject({ to: ['admin@example.test'] });
  });
  it('does not report success when the booking insert fails', async () => {
    const r = await harness({ bookingError: true }); expect(r.response.status).toBe(500); expect(r.writes).toHaveLength(1); expect(r.network).not.toHaveBeenCalled();
  });
  it('retains the partial booking ID and stops before notification when passenger save fails', async () => {
    const r = await harness({ passengerError: true, notificationsConfigured: true }); expect(r.response.status).toBe(200);
    expect(await r.response.json()).toEqual({ success: false, booking_id: 'synthetic-booking', receipt_status: 'incomplete', error: 'PASSENGERS_NOT_SAVED' });
    expect(r.writes).toHaveLength(2); expect(r.network).not.toHaveBeenCalled(); expect(r.email).not.toHaveBeenCalled();
  });
});
