import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExploreLayers } from './useExploreLayers';

type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: { message: string } | null };
const mock = vi.hoisted(() => ({
  responses: {} as Record<string, QueryResult>,
  calls: [] as Array<{ table: string; columns: string; filters: Array<[string, unknown]>; limit?: number }>,
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const call = { table, columns: '', filters: [] as Array<[string, unknown]>, limit: undefined as number | undefined };
      mock.calls.push(call);
      const chain = {
        select: (columns: string) => { call.columns = columns; return chain; },
        eq: (column: string, value: unknown) => { call.filters.push([column, value]); return chain; },
        limit: (limit: number) => {
          call.limit = limit;
          return Promise.resolve(mock.responses[table] ?? { data: [], error: null });
        },
      };
      return chain;
    },
  },
}));

function renderMapHook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return renderHook(() => useExploreLayers(), {
    wrapper: ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

beforeEach(() => { mock.calls.length = 0; mock.responses = {}; });

describe('public map source security guards', () => {
  it('requests only active, approved, published experiences with an explicit safe projection', async () => {
    const { result } = renderMapHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const query = mock.calls.find(call => call.table === 'listings');
    expect(query?.filters).toEqual([
      ['vertical', 'experience'], ['is_active', true],
      ['approval_status', 'approved'], ['attributes->>status', 'published'],
    ]);
    expect(query?.columns.split(',').map(column => column.trim())).toEqual([
      'id', 'name_en', 'name_ru', 'lat', 'lng', 'district', 'category', 'price',
      'price_period', 'currency', 'rating', 'cover_image',
      'meeting_point_lat:attributes->meeting_point_lat',
      'meeting_point_lng:attributes->meeting_point_lng', 'price_per:attributes->>price_per',
    ]);
    expect(query?.limit).toBe(1000);
    for (const call of mock.calls) {
      expect(call.columns).not.toContain('*');
      expect(call.columns.split(',').map(column => column.trim())).not.toEqual(expect.arrayContaining(['attributes']));
      expect(call.columns).not.toMatch(/phone|email|commission|bank|contact|reviewed_by|rejection_reason/);
    }
    expect(mock.calls.map(call => call.table)).toEqual(['public_property_catalog', 'property_projects', 'public_provider_catalog', 'listings']);
    expect(mock.calls.find(call => call.table === 'property_projects')?.filters).toEqual([
      ['is_approved', true], ['is_active', true], ['public_listing_enabled', true],
    ]);
  });

  it('preserves successful layers and exposes a partial source failure', async () => {
    mock.responses.listings = { data: null, error: { message: 'query unavailable' } };
    mock.responses.public_property_catalog = { data: [{ id: 'home', title_en: 'Home', lat: 8, lng: 98, listing_type: 'rent', tenancy_modes: ['short'], currency: 'THB', price_per_night: 2500 }], error: null };
    const { result } = renderMapHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.layerErrors).toEqual(['experience']);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({ layer: 'stay', priceFrom: 2500 });
    expect(result.current.missingCoordinates).toBe(0);
  });

  it('does not present an all-source failure as a successful empty catalogue without warnings', async () => {
    for (const table of ['public_property_catalog', 'property_projects', 'public_provider_catalog', 'listings']) {
      mock.responses[table] = { data: null, error: { message: 'query unavailable' } };
    }
    const { result } = renderMapHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(result.current.layerErrors).toEqual(['property', 'newbuild', 'service', 'experience']);
  });

  it('omits unlocated records and reports them without inventing coordinates', async () => {
    mock.responses.listings = { data: [{ id: 'unlocated', name_en: 'Trip', district: 'bang-tao' }], error: null };
    const { result } = renderMapHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(result.current.missingCoordinates).toBe(1);
    expect(result.current.layerErrors).toEqual([]);
  });
});
