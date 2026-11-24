import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardMetrics } from '../useDashboardMetrics';
import { useBusinessHealthScore } from '../useBusinessHealthScore';

type Result = { data?: unknown[]; count?: number | null; error?: Error };
const fixture = vi.hoisted(() => ({
  requests: [] as { table: string; projection: string; clauses: unknown[][] }[],
  errorTable: '',
  stays: [] as unknown[],
  properties: [{ property_id: 'property-a' }],
  financials: [
    { amount: 48_000_000, currency: 'THB', transaction_date: '2026-11-27', status: 'paid', verification_status: 'unverified' },
    { amount: 900, currency: 'USD', transaction_date: '2026-11-03', status: 'paid', verification_status: 'unverified' },
    { amount: 123, currency: 'THB', transaction_date: '2026-11-05', status: 'paid', verification_status: 'verified' },
  ],
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/useAgentDeals', () => ({ useMyCompanyId: () => ({ data: { company_id: 'company' } }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: fixture.properties }) }));
vi.mock('@/contexts/DashboardFilterContext', () => ({ useDashboardFilter: () => ({ selectedPropertyId: null }) }));
vi.mock('@/lib/hotelDates', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/hotelDates')>(),
  bangkokTodayISO: () => '2026-11-19',
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: (projection: string) => {
        const clauses: unknown[][] = [];
        fixture.requests.push({ table, projection, clauses });
        const methods = Object.fromEntries(['in', 'eq', 'lt', 'gt', 'gte', 'not', 'is'].map(method => [
          method, (...args: unknown[]) => { clauses.push([method, ...args]); return methods; },
        ]));
        return Object.assign(methods, {
          then: (resolve: (result: Result) => unknown) => resolve(
            fixture.errorTable === table ? { error: new Error('fixture read failure') } :
              projection.includes('check_in') ? { data: fixture.stays } :
              table === 'property_financials' && projection.includes('amount') ? { data: fixture.financials } :
              { count: 0, data: [] }
          ),
        });
      },
    }),
  },
}));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('management dashboard cash containment', () => {
  beforeEach(() => {
    fixture.requests.length = 0;
    fixture.errorTable = '';
    fixture.stays = [];
    fixture.properties = [{ property_id: 'property-a' }];
  });

  it('does not select or aggregate future, mixed-currency, unverified or purportedly settled amounts', async () => {
    const { result } = renderHook(() => ({ metrics: useDashboardMetrics(), health: useBusinessHealthScore() }), { wrapper: wrapper() });
    expect(result.current.metrics.isLoading).toBe(true);
    expect(result.current.health.score).toBeNull();
    await waitFor(() => expect(result.current.metrics.isSuccess).toBe(true));
    expect(result.current.metrics.data?.ops?.activeDeals).toBe(0);
    expect(result.current.metrics.data?.kpi).toEqual({ occupancyRate: 0, totalBookings: 0, bookedNights: 0 });
    expect(fixture.requests.filter(r => r.table === 'property_financials').map(r => r.projection)).toEqual(['id']);
    expect(fixture.requests.some(r => /total_amount|deal_value/.test(r.projection))).toBe(false);
    expect(result.current.health.pillars.map(p => p.key)).toEqual(['deals', 'tasks', 'occupancy', 'service']);
    expect(result.current.health.score).toBe(40);
  });

  it('keeps the genuine booked-night signal using half-open Phuket month windows', async () => {
    fixture.stays = [
      { property_id: 'property-a', check_in: '2026-11-29', check_out: '2026-12-02' },
      { property_id: 'property-a', check_in: '2026-11-30', check_out: '2026-12-01' },
    ];
    const { result } = renderHook(useDashboardMetrics, { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.kpi?.bookedNights).toBe(2);
    expect(fixture.requests.find(r => r.projection.includes('check_in'))?.clauses)
      .toEqual(expect.arrayContaining([['lt', 'check_in', '2026-12-01'], ['gt', 'check_out', '2026-11-01']]));
  });

  it('distinguishes scope absence and failed reads from a real zero', async () => {
    fixture.properties = [];
    const noScope = renderHook(useBusinessHealthScore, { wrapper: wrapper() });
    expect(noScope.result.current.score).toBeNull();
    expect(fixture.requests).toHaveLength(0);
    noScope.unmount();
    fixture.properties = [{ property_id: 'property-a' }];
    fixture.errorTable = 'crm_tasks';
    const { result } = renderHook(() => ({ metrics: useDashboardMetrics(), health: useBusinessHealthScore() }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.metrics.isError).toBe(true));
    expect(result.current.health.score).toBeNull();
  });
});
