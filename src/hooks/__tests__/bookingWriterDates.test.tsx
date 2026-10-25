import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { civilStaysOverlap, occupiedCivilDates, stayOccupiesDate, type CivilStay } from '@/lib/hotelDates';

const state = vi.hoisted(() => ({
  blocked: [] as string[],
  existing: [] as { id: string; check_in: string; check_out: string }[],
  boundary: [] as string[],
  failedTable: '', missingOrder: false,
  command: vi.fn(),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  useMutation: ({ mutationFn }: { mutationFn: (input: unknown) => Promise<unknown> }) => ({ mutateAsync: mutationFn }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: () => { throw Error('Forbidden query'); } }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: async () => ({}) }));
vi.mock('@/lib/manualPropertyBooking', async original => ({ ...await original<typeof import('@/lib/manualPropertyBooking')>(), executePropertyBookingChange: state.command }));
vi.mock('@/integrations/supabase/client', () => {
  function from(table: string) {
    const filters: { method: string; field: string; value: unknown }[] = [];
    const chain = {
      select: () => chain,
      eq: (field: string, value: unknown) => add('eq', field, value),
      is: (field: string, value: unknown) => add('is', field, value),
      not: (field: string, _operator: string, value: unknown) => add('not', field, value),
      neq: (field: string, value: unknown) => add('neq', field, value),
      in: (field: string, value: unknown) => add('in', field, value),
      gte: (field: string, value: unknown) => add('gte', field, value),
      gt: (field: string, value: unknown) => add('gt', field, value),
      lte: (field: string, value: unknown) => add('lte', field, value),
      lt: (field: string, value: unknown) => add('lt', field, value),
      single: async () => ({ data: state.missingOrder ? null : { start_at: '2026-10-10T14:00:00Z', end_at: '2026-10-13T12:00:00Z', order_items: [{ resource_id: 'synthetic-home' }] }, error: state.failedTable === 'current' ? new Error('Synthetic read failure') : null }),
      insert: () => stop('insert'),
      update: () => stop('update'),
      then: (resolve: (result: { data: unknown[]; error: Error | null }) => unknown) => {
        const passes = (field: string, value: string) => filters.filter(f => f.field === field).every(f => {
          const right = String(f.value);
          switch (f.method) {
            case 'gte': return value >= right;
            case 'gt': return value > right;
            case 'lte': return value <= right;
            case 'lt': return value < right;
            case 'neq': return value !== right;
            default: return true;
          }
        });
        const data = table === 'property_availability'
          ? state.blocked.filter(date => passes('date', date)).map(date => ({ date }))
          : table === 'orders'
            ? state.existing.filter(b => passes('start_at', `${b.check_in}T14:00:00Z`) && passes('end_at', `${b.check_out}T12:00:00Z`) && passes('id', b.id)).map(b => ({ id: b.id }))
            : table === 'order_items' ? [{ order_id: 'synthetic-existing' }] : [];
        return Promise.resolve(resolve({ data, error: state.failedTable === table ? new Error('Synthetic read failure') : null }));
      },
    };
    function add(method: string, field: string, value: unknown) { filters.push({ method, field, value }); return chain; }
    function stop(operation: string): never {
      state.boundary.push(`${table}.${operation}`);
      throw Error('SYNTHETIC_WRITE_BOUNDARY');
    }
    return chain;
  }
  return { supabase: { from, functions: { invoke: () => { throw Error('Forbidden function'); } } } };
});

const cases: { label: string; stay: CivilStay; blocked: string[]; existing?: CivilStay; allowed: boolean }[] = [
  { label: '10→13 allows subsequent 13→15', stay: { check_in: '2026-10-13', check_out: '2026-10-15' }, blocked: [], existing: { check_in: '2026-10-10', check_out: '2026-10-13' }, allowed: true },
  { label: 'checkout block 13 permits 10→13', stay: { check_in: '2026-10-10', check_out: '2026-10-13' }, blocked: ['2026-10-13'], allowed: true },
  { label: 'occupied block 12 rejects 10→13', stay: { check_in: '2026-10-10', check_out: '2026-10-13' }, blocked: ['2026-10-12'], allowed: false },
  { label: 'one night checks 10, not 11', stay: { check_in: '2026-10-10', check_out: '2026-10-11' }, blocked: ['2026-10-11'], allowed: true },
  { label: 'one night rejects block 10', stay: { check_in: '2026-10-10', check_out: '2026-10-11' }, blocked: ['2026-10-10'], allowed: false },
  { label: 'month boundary checkout free', stay: { check_in: '2026-01-31', check_out: '2026-02-01' }, blocked: ['2026-02-01'], allowed: true },
  { label: 'year boundary occupied block', stay: { check_in: '2026-12-31', check_out: '2027-01-02' }, blocked: ['2027-01-01'], allowed: false },
  { label: 'leap-day checkout free', stay: { check_in: '2028-02-28', check_out: '2028-02-29' }, blocked: ['2028-02-29'], allowed: true },
  { label: 'leap night blocked', stay: { check_in: '2028-02-29', check_out: '2028-03-01' }, blocked: ['2028-02-29'], allowed: false },
  { label: 'occupied overlap rejected', stay: { check_in: '2026-10-12', check_out: '2026-10-15' }, blocked: [], existing: { check_in: '2026-10-10', check_out: '2026-10-13' }, allowed: false },
];

beforeEach(() => { state.blocked = []; state.existing = []; state.boundary = []; state.failedTable = ''; state.missingOrder = false; state.command.mockReset(); });
describe('legacy manual create preflight — synthetic only', () => {
  it.each(cases)('$label', async ({ stay, blocked, existing, allowed }) => {
    state.blocked = blocked;
    state.existing = existing ? [{ ...existing, id: 'synthetic-existing' }] : [];
    const uiAllowed = !blocked.some(day => stayOccupiesDate(stay, day)) && !(existing && civilStaysOverlap(existing, stay));
    expect(uiAllowed).toBe(allowed);
    expect(blocked.some(day => occupiedCivilDates(stay).includes(day))).toBe(blocked.some(day => stayOccupiesDate(stay, day)));
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    const attempt = result.current.createBooking({ property_id: 'synthetic-home', ...stay });
    await expect(attempt).rejects.toThrow(allowed ? 'SYNTHETIC_WRITE_BOUNDARY' : existing ? 'пересекаются' : 'заблокированы');
    expect(state.boundary).toEqual(allowed ? ['orders.insert'] : []);
  });
});

describe('legacy manual create fails closed before mutation', () => {
  it.each(['orders', 'order_items', 'property_availability'])('rejects failed %s availability source', async table => {
    state.failedTable = table;
    state.existing = [{ id: 'synthetic-other', check_in: '2026-10-10', check_out: '2026-10-13' }];
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    const dates = { check_in: '2026-10-11', check_out: '2026-10-14' };
    // For block-source failure, no earlier overlap should stop the read.
    if (table === 'property_availability') state.existing = [];
    const attempt = result.current.createBooking({ property_id: 'synthetic-home', ...dates });
    await expect(attempt).rejects.toThrow('Synthetic read failure');
    expect(state.boundary).toEqual([]);
  });
  it.each([['2026-10-10','2026-10-10'], ['2026-10-13','2026-10-10'], ['2026-02-30','2026-03-03'], ['', '2026-10-13']])('rejects invalid stay %s → %s', async (check_in, check_out) => {
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    const attempt = result.current.createBooking({ property_id: 'synthetic-home', check_in, check_out });
    await expect(attempt).rejects.toThrow('корректные даты');
    expect(state.boundary).toEqual([]);
  });
});

describe('checked update delegates inventory validation with unchanged civil dates', () => {
  it.each(cases)('$label', async ({ stay, blocked, existing, allowed }) => {
    // Inventory decisions now belong to the checked server transaction. Keep
    // every prior boundary case and prove the browser neither reinterprets the
    // civil dates nor falls back to raw order/participant writes on rejection.
    expect(!blocked.some(day => stayOccupiesDate(stay, day)) && !(existing && civilStaysOverlap(existing, stay))).toBe(allowed);
    state.command.mockRejectedValue(new Error(allowed ? 'CANONICAL_COMMAND_BOUNDARY' : 'Canonical inventory conflict'));
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    await expect(result.current.updateBooking({ id: 'synthetic-current', ...stay })).rejects.toThrow(allowed ? 'CANONICAL_COMMAND_BOUNDARY' : 'Canonical inventory conflict');
    expect(state.command).toHaveBeenCalledExactlyOnceWith({}, 'synthetic-user', 'synthetic-current', stay, undefined);
    expect(state.boundary).toEqual([]);
  });
  it.each(['orders', 'order_items', 'property_availability'])('propagates failed canonical %s validation without client writes', async source => {
    state.command.mockRejectedValue(new Error(`Canonical ${source} unavailable`));
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    await expect(result.current.updateBooking({ id: 'synthetic-current', check_in: '2026-10-11', check_out: '2026-10-14' })).rejects.toThrow(`Canonical ${source} unavailable`);
    expect(state.boundary).toEqual([]);
  });
  it.each([['2026-10-10','2026-10-10'], ['2026-10-13','2026-10-10'], ['2026-02-30','2026-03-03'], ['', '2026-10-13']])('propagates canonical invalid stay %s → %s', async (check_in, check_out) => {
    state.command.mockRejectedValue(new Error('invalid_property_stay_dates'));
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    await expect(result.current.updateBooking({ id: 'synthetic-current', check_in, check_out })).rejects.toThrow('invalid_property_stay_dates');
    expect(state.command).toHaveBeenCalledExactlyOnceWith({}, 'synthetic-user', 'synthetic-current', { check_in, check_out }, undefined);
    expect(state.boundary).toEqual([]);
  });
  it.each(['missing', 'error'])('propagates %s canonical revision without raw current-order reads', async outcome => {
    state.command.mockRejectedValue(new Error(`Canonical revision ${outcome}`));
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    await expect(result.current.updateBooking({ id: 'synthetic-current', check_in: '2026-10-11' })).rejects.toThrow(`Canonical revision ${outcome}`);
    expect(state.boundary).toEqual([]);
  });
});

describe('timestamp contract ambiguity — evidence, not a new conversion', () => {
  const dateIn = (instant: string, timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(instant));
  it('true Bangkok midnight has a previous UTC date', () => {
    expect(dateIn('2026-10-13T00:00:00+07:00', 'UTC')).toBe('2026-10-12');
    expect(dateIn('2026-10-13T00:00:00+07:00', 'Asia/Bangkok')).toBe('2026-10-13');
  });
  it('the same instant with Z has the same Bangkok date', () => {
    expect(dateIn('2026-10-12T17:00:00Z', 'Asia/Bangkok')).toBe('2026-10-13');
  });
  it('a local 23:00 clock mislabeled Z changes the Bangkok civil day', () => {
    expect(dateIn('2026-10-13T23:00:00Z', 'Asia/Bangkok')).toBe('2026-10-14');
    expect(dateIn('2026-10-13T23:00:00+07:00', 'Asia/Bangkok')).toBe('2026-10-13');
  });
});
