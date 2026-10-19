vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchModerationQueue } from './adminModeration';
import { moderationReviewDestination, moderationReturnPath } from './moderationReviewRoutes';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';

const db = vi.hoisted(() => ({
  calls: [] as Array<{ table: string; filters: unknown[][]; limit?: number; options?: unknown }>,
  results: {} as Record<string, { data: unknown[] | null; count: number | null; error: unknown }>,
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from(table: string) {
    const call = { table, filters: [] as unknown[][], limit: undefined as number | undefined, options: undefined as unknown };
    db.calls.push(call);
    const query = {
      select(_columns: string, options?: unknown) { call.options = options; return query; },
      eq(...filter: unknown[]) { call.filters.push(['eq', ...filter]); return query; },
      is(...filter: unknown[]) { call.filters.push(['is', ...filter]); return query; },
      in(...filter: unknown[]) { call.filters.push(['in', ...filter]); return query; },
      lt(...filter: unknown[]) { call.filters.push(['lt', ...filter]); return query; },
      order() { return query; },
      limit(value: number) { call.limit = value; return query; },
      then(resolve: (result: unknown) => unknown) {
        return Promise.resolve(db.results[table] ?? { data: [], count: 0, error: null }).then(resolve);
      },
    };
    return query;
  },
} }));

beforeEach(() => { db.calls.length = 0; db.results = {}; });

describe('moderation source and count contract', () => {
  it('keeps ownerless pending properties and real approval status separate from inactive catalog state', async () => {
    db.results.listings = { data: [{ id: 'l', name_en: 'Clinic', name_ru: 'Клиника', created_at: '2026-02-01', approval_status: 'pending', vertical: 'clinic', category: null, provider_id: null, providers: null }], count: 240, error: null };
    db.results.properties = { data: [{ id: 'ownerless', updated_at: '2026-10-19T00:00:00Z', title_en: 'Villa', title_ru: null, created_at: null, approval_status: 'pending', property_type: 'villa' }], count: 8, error: null };
    db.results.services = { data: [{ id: 's', name_en: 'Service', name_ru: null, created_at: '2026-01-01', approval_status: 'approved', provider_id: 'p', providers: { name: 'Provider' } }], count: 7, error: null };
    const result = await fetchModerationQueue();
    expect(result.totals).toEqual({ listing: 240, property: 8, service: 7, product: 0 });
    expect(result.items.find(item => item.id === 'ownerless')?.updated_at).toBe('2026-10-19T00:00:00Z');
    expect(result.items.find(item => item.id === 's')?.approval_status).toBe('approved');
    for (const type of ['listings', 'properties']) {
      const call = db.calls.find(query => query.table === type)!;
      expect(call.filters).toEqual([['eq', 'approval_status', 'pending'], ...(type === 'properties' ? [['is', 'deleted_at', null]] : [])]);
      expect(call.options).toEqual({ count: 'exact' });
      expect(call.limit).toBe(500);
    }
    for (const type of ['services', 'marketplace_products']) {
      expect(db.calls.find(query => query.table === type)?.filters).toEqual([['eq', 'is_active', false]]);
      expect(db.calls.find(query => query.table === type)?.limit).toBe(100);
    }
  });

  it('retains exact totals beyond loaded caps and does not turn failed reads into zero', async () => {
    db.results.listings = { data: [], count: 1200, error: null };
    db.results.properties = { data: [{ id: 'untrusted-partial' }], count: 5, error: { message: 'denied' } };
    db.results.services = { data: [], count: null, error: null };
    const result = await fetchModerationQueue();
    expect(result.totals.listing).toBe(1200);
    expect(result.totals.property).toBeNull();
    expect(result.totals.service).toBeNull();
    expect(result.errors).toEqual(['property', 'service']);
    expect(result.items).toEqual([]);
  });

  it('uses the identical pending predicate for dashboard exact counts, excluding inactive catalog totals', async () => {
    db.results.listings = { data: [], count: 240, error: null };
    db.results.properties = { data: [], count: 8, error: null };
    db.results.services = { data: [], count: 7, error: null };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(useAdminDashboardStats, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pendingContent).toBe(248);
    for (const table of ['properties', 'listings']) {
      const countQuery = db.calls.find(query => query.table === table && query.filters.some(filter => filter[1] === 'approval_status'))!;
      expect(countQuery.filters).toEqual([['eq', 'approval_status', 'pending'], ...(table === 'properties' ? [['is', 'deleted_at', null]] : [])]);
      expect(countQuery.options).toEqual({ count: 'exact', head: true });
      expect(countQuery.limit).toBeUndefined();
    }
    client.clear();
  });

  it('exposes an unknown dashboard moderation count when either source fails', async () => {
    db.results.properties = { data: [], count: 0, error: { message: 'unavailable' } };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(useAdminDashboardStats, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pendingContent).toBeNull();
    client.clear();
  });
});

describe('verified moderation destinations', () => {
  const item = { id: 'item /&', provider_id: null, vertical: null };
  it('opens the implemented property editor with an encoded record ID', () => {
    expect(moderationReviewDestination({ ...item, type: 'property' }).review).toBe('/admin/properties?edit=item%20%2F%26');
  });
  it('does not claim broken service/catalog edit queries are item review', () => {
    expect(moderationReviewDestination({ ...item, type: 'service', provider_id: 'provider &' })).toEqual({ review: null, collection: '/admin/services?provider=provider%20%26' });
    expect(moderationReviewDestination({ ...item, type: 'product' })).toEqual({ review: null, collection: '/admin/catalog' });
  });
  it('routes supported listing collections by their actual source and explains unsupported types', () => {
    for (const [vertical, path] of Object.entries({ yacht: 'yachts', restaurant: 'restaurants', clinic: 'clinics', vehicle: 'vehicles', experience: 'experiences', education: 'education', pet_service: 'pets', cleaning: 'cleaning', babysitter: 'babysitters' })) {
      expect(moderationReviewDestination({ ...item, type: 'listing', vertical })).toEqual({ review: null, collection: `/admin/${path}` });
    }
    expect(moderationReviewDestination({ ...item, type: 'listing', vertical: 'unknown' })).toEqual({ review: null, collection: null });
  });
});


describe('moderation return navigation', () => {
  it('preserves only queue navigation context', () => {
    expect(moderationReturnPath('/admin/operations?tab=moderation&q=two+words&type=property&category=villa&action=delete&return=https://evil.test'))
      .toBe('/admin/operations?tab=moderation&q=two+words&type=property&category=villa');
  });
  it.each([null, '', 'https://evil.test', '//evil.test/admin/operations?tab=moderation', '/admin/users?tab=moderation', '/admin/operations?tab=bookings', '/admin/operations/../users?tab=moderation'])('rejects unrelated destinations %s', destination => {
    expect(moderationReturnPath(destination)).toBeNull();
  });
});
