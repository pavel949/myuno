import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MARKETPLACE_AVAILABILITY_REFRESH_INTERVAL_MS,
  MARKETPLACE_AVAILABILITY_STALE_TIME_MS,
  marketplaceAvailabilityQueryKey,
  useMarketplaceAvailability,
} from './useMarketplaceAvailability';
import {
  resolveMarketplaceAvailability,
  type MarketplaceAvailabilityService,
  type MarketplaceAvailabilitySource,
} from '@/lib/services/marketplaceAvailability';

const supabaseState = vi.hoisted(() => ({
  fromCalls: [] as string[],
  rpcCalls: [] as unknown[][],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      supabaseState.fromCalls.push(table);
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({
          data: [{ weekday: 1, start_time: '09:00', end_time: '12:00' }],
          error: null,
        })),
      };
      return query;
    },
    rpc: (...args: unknown[]) => {
      supabaseState.rpcCalls.push(args);
      return Promise.resolve({ data: [], error: null });
    },
  },
}));

function service(overrides: Partial<MarketplaceAvailabilityService> = {}): MarketplaceAvailabilityService {
  return {
    id: 'service-a',
    provider_id: 'provider-a',
    duration_minutes: 60,
    lead_time_hours: 0,
    ...overrides,
  };
}

function source(overrides: Partial<MarketplaceAvailabilitySource> = {}): MarketplaceAvailabilitySource {
  return {
    getHours: async () => [{ weekday: 1, start_time: '09:00', end_time: '13:00' }],
    getBusy: async () => [],
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
  supabaseState.fromCalls = [];
  supabaseState.rpcCalls = [];
});

describe('resolveMarketplaceAvailability', () => {
  it('uses the actual duration and lead time in Phuket-local windows', async () => {
    const result = await resolveMarketplaceAvailability(
      [service({ duration_minutes: 95, lead_time_hours: 2 })],
      '2030-01-07',
      source(),
      { now: new Date('2030-01-07T01:30:00Z') }, // 08:30 Phuket; earliest is 10:30
    );

    expect(result['service-a']).toEqual({
      status: 'available',
      date: '2030-01-07',
      firstSlot: '10:30',
    });
  });

  it('removes a busy window and reports a configured window with no slot unavailable', async () => {
    const result = await resolveMarketplaceAvailability(
      [service({ duration_minutes: 60, lead_time_hours: 0 })],
      '2030-01-07',
      source({
        getHours: async () => [{ weekday: 1, start_time: '10:00', end_time: '11:00' }],
        getBusy: async () => [{ starts_at: '2030-01-07T03:00:00Z', ends_at: '2030-01-07T04:00:00Z' }],
      }),
      { now: new Date('2030-01-06T00:00:00Z') },
    );

    expect(result['service-a']).toEqual({ status: 'unavailable', date: '2030-01-07' });
  });

  it('keeps missing schedule data unknown instead of manufacturing a duration or hours', async () => {
    const calls = { hours: 0, busy: 0 };
    const result = await resolveMarketplaceAvailability(
      [
        service({ id: 'missing-duration', duration_minutes: null }),
        service({ id: 'missing-lead', lead_time_hours: null }),
        service({ id: 'no-hours', provider_id: 'provider-no-hours' }),
      ],
      '2030-01-07',
      source({
        getHours: async (providerId) => {
          calls.hours += 1;
          return providerId === 'provider-no-hours' ? [] : [{ weekday: 1, start_time: '09:00', end_time: '12:00' }];
        },
        getBusy: async () => {
          calls.busy += 1;
          return [];
        },
      }),
      { now: new Date('2030-01-06T00:00:00Z') },
    );

    expect(result['missing-duration']).toEqual({ status: 'unknown', date: '2030-01-07' });
    expect(result['missing-lead']).toEqual({ status: 'unknown', date: '2030-01-07' });
    expect(result['no-hours']).toEqual({ status: 'unknown', date: '2030-01-07' });
    expect(calls.hours).toBe(1);
    expect(calls.busy).toBe(1);
  });

  it('preserves successful providers when another provider hours or RPC reads fail', async () => {
    const result = await resolveMarketplaceAvailability(
      [
        service({ id: 'good', provider_id: 'provider-good' }),
        service({ id: 'bad-hours', provider_id: 'provider-bad-hours' }),
        service({ id: 'bad-busy', provider_id: 'provider-bad-busy' }),
      ],
      '2030-01-07',
      source({
        getHours: async (providerId) => {
          if (providerId === 'provider-bad-hours') throw new Error('hours unavailable');
          return [{ weekday: 1, start_time: '09:00', end_time: '12:00' }];
        },
        getBusy: async (providerId) => {
          if (providerId === 'provider-bad-busy') throw new Error('busy unavailable');
          return [];
        },
      }),
      { now: new Date('2030-01-06T00:00:00Z') },
    );

    expect(result.good.status).toBe('available');
    expect(result['bad-hours'].status).toBe('unknown');
    expect(result['bad-busy'].status).toBe('unknown');
    expect(result['bad-hours'].error).toBe('schedule-read-failed');
    expect(result['bad-busy'].error).toBe('schedule-read-failed');
  });

  it('deduplicates shared providers and bounds provider reads to four workers', async () => {
    const providerIds = Array.from({ length: 7 }, (_, index) => `provider-${index}`);
    const services = providerIds.map((providerId, index) => service({ id: `service-${index}`, provider_id: providerId }));
    services.push(service({ id: 'shared-service', provider_id: 'provider-0', duration_minutes: 90 }));
    let active = 0;
    let maxActive = 0;
    const calls = new Map<string, { hours: number; busy: number }>();
    const enter = async (providerId: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      const current = calls.get(providerId) ?? { hours: 0, busy: 0 };
      return current;
    };

    const result = await resolveMarketplaceAvailability(
      services,
      '2030-01-07',
      source({
        getHours: async (providerId) => {
          const current = await enter(providerId);
          current.hours += 1;
          calls.set(providerId, current);
          return [{ weekday: 1, start_time: '09:00', end_time: '13:00' }];
        },
        getBusy: async (providerId) => {
          const current = await enter(providerId);
          current.busy += 1;
          calls.set(providerId, current);
          return [];
        },
      }),
      { now: new Date('2030-01-06T00:00:00Z'), concurrency: 4 },
    );

    expect(maxActive).toBeLessThanOrEqual(4);
    expect(calls.get('provider-0')).toEqual({ hours: 1, busy: 1 });
    expect(result['shared-service'].status).toBe('available');
  });
});

describe('useMarketplaceAvailability', () => {
  function wrapper() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  it('does not query while date is empty and includes duration/lead signature in the key', () => {
    const services = [service()];
    const { result } = renderHook(() => useMarketplaceAvailability(services as never, ''), { wrapper: wrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(supabaseState.fromCalls).toEqual([]);
    expect(supabaseState.rpcCalls).toEqual([]);
    expect(marketplaceAvailabilityQueryKey('2030-01-07', services)).not.toEqual(
      marketplaceAvailabilityQueryKey('2030-01-07', [service({ duration_minutes: 90 })]),
    );
  });

  it('uses only the public hours table and busy-slot RPC', async () => {
    const { result } = renderHook(
      () => useMarketplaceAvailability([service()] as never, '2030-01-07'),
      { wrapper: wrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabaseState.fromCalls).toEqual(['provider_availability']);
    expect(supabaseState.rpcCalls).toHaveLength(1);
    expect(result.current.data?.['service-a']).toEqual({ status: 'available', date: '2030-01-07', firstSlot: '09:00' });
  });

  it('configures a short stale clock and active-only refresh interval', () => {
    expect(MARKETPLACE_AVAILABILITY_STALE_TIME_MS).toBeLessThanOrEqual(30_000);
    expect(MARKETPLACE_AVAILABILITY_REFRESH_INTERVAL_MS).toBeGreaterThan(0);
  });
});
