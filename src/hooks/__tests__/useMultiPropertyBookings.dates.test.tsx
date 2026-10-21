import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
const fixture = vi.hoisted(() => ({ query: null as null | (() => Promise<unknown>), rows: [] as unknown[], filters: [] as unknown[][] }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryFn: () => Promise<unknown> }) => { fixture.query = options.queryFn; return { data: [], isLoading: false }; } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'actor' } }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [{ property_id: 'home' }], isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const chain = {
    select: () => chain, eq: () => chain, in: () => chain, is: () => chain, order: () => chain,
    lt: (column: string, value: string) => { fixture.filters.push(['lt', column, value]); return chain; },
    gt: (column: string, value: string) => { fixture.filters.push(['gt', column, value]); return chain; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: fixture.rows, error: null })),
  }; return chain;
} } }));
import { useMultiPropertyBookings } from '../useMultiPropertyBookings';
beforeEach(() => { cleanup(); fixture.query = null; fixture.rows = []; fixture.filters = []; });
describe('multi-property calendar consumes checked manual stay timestamps', () => {
  it.each(['2026-11-09T17:15:00Z', '2026-11-10T00:15:00+07:00', '2026-11-09T10:15:00-07:00'])('keeps Bangkok civil nights for %s', async start => {
    fixture.rows = [{ id: 'stay', start_at: start, end_at: '2026-11-12T17:30:00Z', status: 'confirmed', total_amount: 0,
      order_items: [{ item_type: 'property', resource_id: 'home' }], order_participants: [], metadata: {} }];
    renderHook(() => useMultiPropertyBookings(new Date(2026, 10, 10), 3));
    expect(await fixture.query!()).toMatchObject([{ property_id: 'home', check_in: '2026-11-10', check_out: '2026-11-13' }]);
    expect(fixture.filters).toEqual([['lt', 'start_at', '2026-11-13T00:00:00+07:00'], ['gt', 'end_at', '2026-11-10T00:00:00+07:00']]);
  });
});
