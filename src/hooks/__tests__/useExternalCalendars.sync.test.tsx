import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ invoke: vi.fn(), calendars: [] as { id: string; property_id: string; is_active: boolean }[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'actor-a' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from(table: string) {
    if (table !== 'property_external_calendars') throw Error('Unexpected table');
    const query = {
      select: () => query, eq: () => query, order: () => query,
      then: (resolve: (result: unknown) => unknown) => Promise.resolve(resolve({ data: fixture.calendars, error: null })),
    };
    return query;
  },
  functions: { invoke: fixture.invoke },
} }));
import { useExternalCalendars } from '../useExternalCalendars';

beforeEach(() => {
  fixture.invoke.mockReset();
  fixture.calendars = [{ id: 'calendar-a', property_id: 'property-a', is_active: true }];
  vi.stubGlobal('fetch', () => { throw Error('Production transport forbidden'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidation = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(() => useExternalCalendars('property-a'), { wrapper }), invalidation };
}

describe('manual iCal read refresh after settled mutation, no live sync', () => {
  for (const action of ['single', 'all']) {
    for (const outcome of ['success', 'partial-502', 'transport-error']) {
      it(`${action} refreshes canonical reads after ${outcome} and preserves rejection`, async () => {
        const partial = { results: [{ calendar_id: 'calendar-a', success: true }, { calendar_id: 'calendar-b', success: false }] };
        const error = outcome === 'success' ? null : Object.assign(new Error(outcome), {
          context: outcome === 'partial-502' ? new Response(JSON.stringify(partial), { status: 502 }) : undefined,
        });
        fixture.invoke.mockResolvedValue({ data: error ? null : { results: [{ success: true }] }, error });
        const { result, invalidation } = mount();
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        let rejected: unknown;
        const successfulCaller = vi.fn();
        await act(async () => {
          try {
            if (action === 'single') await result.current.syncCalendar('calendar-a');
            else await result.current.syncAllCalendars('property-a');
            successfulCaller();
          } catch (caught) { rejected = caught; }
        });
        expect(fixture.invoke).toHaveBeenCalledExactlyOnceWith('ical-sync', { body: { calendar_ids: ['calendar-a'] } });
        if (error) { expect(rejected).toBe(error); expect(successfulCaller).not.toHaveBeenCalled(); }
        else expect(successfulCaller).toHaveBeenCalledOnce();
        for (const queryKey of [
          ['external-calendars', 'actor-a'], ['property-bookings', 'actor-a'], ['stays-unified-calendar'],
          ['property-availability-management'], ['property-unavailable-dates'],
        ]) expect(invalidation).toHaveBeenCalledWith({ queryKey });
      });
    }
  }
});
