import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const fixture = vi.hoisted(() => ({ error: null as Error | null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (!['property_room_categories', 'property_rate_plans', 'properties'].includes(table)) {
        throw new Error('Unexpected table');
      }
      const chain = {
        insert: () => chain,
        update: () => chain,
        eq: () => chain,
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve(resolve({ data: null, error: fixture.error })),
      };
      return chain;
    },
  },
}));

import { useSaveCategory, useSavePlan, useAssignRoomCategory } from '../useRoomCategories';

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const keys = [
    ['room-categories', 'property-a'],
    ['room-category-offers', 'property-a', '2026-12-01', '2026-12-03', 2],
    ['room-category-offers', 'property-a', '2026-12-04', '2026-12-06', 1],
  ];
  keys.forEach(key => client.setQueryData(key, { synthetic: true }));
  client.setQueryData(['unrelated'], { synthetic: true });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const rendered = renderHook(() => ({
    category: useSaveCategory(), plan: useSavePlan(), assignment: useAssignRoomCategory(),
  }), { wrapper });
  return { ...rendered, client, keys };
}

beforeEach(() => {
  fixture.error = null;
  vi.stubGlobal('fetch', () => { throw new Error('Production network denied'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('structure saves refresh both editor and guest caches with synthetic mutations', () => {
  it.each(['category', 'plan', 'assignment'] as const)('%s invalidates all date/guest variants after save', async operation => {
    const { result, client, keys } = mount();
    await act(async () => {
      if (operation === 'category') {
        await result.current.category.mutateAsync({
          property_id: 'property-a', name_en: 'Synthetic category', base_price_per_night: 100,
        });
      } else if (operation === 'plan') {
        await result.current.plan.mutateAsync({ category_id: 'category-a', name_en: 'Synthetic plan' });
      } else {
        await result.current.assignment.mutateAsync({
          roomId: 'room-a', parentId: 'property-a', categoryId: 'category-a',
        });
      }
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false);
    client.clear();
  });

  it.each(['category', 'plan', 'assignment'] as const)('%s failure does not certify fresh guest data', async operation => {
    const { result, client, keys } = mount();
    fixture.error = new Error('Synthetic permission denied');
    await act(async () => {
      const pending = operation === 'category'
        ? result.current.category.mutateAsync({
            property_id: 'property-a', name_en: 'Synthetic category', base_price_per_night: 100,
          })
        : operation === 'plan'
          ? result.current.plan.mutateAsync({ category_id: 'category-a', name_en: 'Synthetic plan' })
          : result.current.assignment.mutateAsync({
              roomId: 'room-a', parentId: 'property-a', categoryId: 'category-a',
            });
      await expect(pending).rejects.toThrow('Synthetic permission denied');
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  });
});

