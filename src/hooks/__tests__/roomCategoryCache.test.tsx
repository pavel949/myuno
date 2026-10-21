import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const fixture = vi.hoisted(() => ({
  error: null as Error | null,
  returnedId: undefined as string | null | undefined,
  confirmations: [] as string[],
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (!['property_room_categories', 'property_rate_plans', 'properties'].includes(table)) {
        throw new Error('Unexpected table');
      }
      let filteredId = 'created-id';
      const chain = {
        insert: () => chain,
        update: () => chain,
        eq: (field: string, value: string) => {
          if (field === 'id') filteredId = value;
          return chain;
        },
        select: (fields: string) => {
          if (fields !== 'id') throw new Error('Unexpected return projection');
          return chain;
        },
        single: async () => {
          fixture.confirmations.push(table);
          const id = fixture.returnedId === undefined ? filteredId : fixture.returnedId;
          return { data: id === null ? null : { id }, error: fixture.error };
        },
      };
      return chain;
    },
  },
}));

import { useSaveCategory, useSavePlan, useAssignRoomCategory, useSetPropertyKind } from '../useRoomCategories';

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const keys = [
    ['structure-properties'],
    ['room-categories', 'property-a'],
    ['room-category-offers', 'property-a', '2026-12-01', '2026-12-03', 2],
    ['room-category-offers', 'property-a', '2026-12-04', '2026-12-06', 1],
  ];
  keys.forEach(key => client.setQueryData(key, { synthetic: true }));
  client.setQueryData(['unrelated'], { synthetic: true });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const rendered = renderHook(() => ({
    category: useSaveCategory(), plan: useSavePlan(), assignment: useAssignRoomCategory(), kind: useSetPropertyKind(),
  }), { wrapper });
  return { ...rendered, client, keys };
}

const operations = ['category-insert', 'category-update', 'plan-insert', 'plan-update', 'assignment', 'kind'] as const;
type Operation = typeof operations[number];
function save(operation: Operation, mutations: ReturnType<typeof mount>['result']['current']) {
  if (operation.startsWith('category')) {
    return mutations.category.mutateAsync({
      ...(operation === 'category-update' ? { id: 'category-a' } : {}),
      property_id: 'property-a', name_en: 'Synthetic category', base_price_per_night: 100,
    });
  }
  if (operation.startsWith('plan')) {
    return mutations.plan.mutateAsync({
      ...(operation === 'plan-update' ? { id: 'plan-a' } : {}),
      category_id: 'category-a', name_en: 'Synthetic plan',
    });
  }
  if (operation === 'kind') return mutations.kind.mutateAsync({ id: 'property-a', kind: 'resort' });
  return mutations.assignment.mutateAsync({
    roomId: 'room-a', parentId: 'property-a', categoryId: 'category-a',
  });
}

beforeEach(() => {
  fixture.error = null;
  fixture.returnedId = undefined;
  fixture.confirmations = [];
  vi.stubGlobal('fetch', () => { throw new Error('Production network denied'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('structure saves require row evidence before refreshing editor and guest caches', () => {
  it.each(operations)('%s confirms persisted identity and invalidates every date/guest variant', async operation => {
    const { result, client, keys } = mount();
    await act(async () => { await expect(save(operation, result.current)).resolves.toBeTruthy(); });
    expect(fixture.confirmations).toHaveLength(1);
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(
      operation === 'kind' ? key[0] === 'structure-properties' : key[0] !== 'structure-properties',
    ));
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false);
    client.clear();
  });

  it.each(operations)('%s rejects denied writes without successful invalidation', async operation => {
    const { result, client, keys } = mount();
    fixture.error = new Error('Synthetic permission denied');
    await act(async () => {
      await expect(save(operation, result.current)).rejects.toThrow('Synthetic permission denied');
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  });

  it.each(operations)('%s rejects hidden/missing zero-row results even without a database error', async operation => {
    const { result, client, keys } = mount();
    fixture.returnedId = null;
    await act(async () => {
      await expect(save(operation, result.current)).rejects.toThrow('Could not confirm');
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  });

  it.each(['category-update', 'plan-update', 'assignment', 'kind'] as const)('%s rejects a foreign returned identity', async operation => {
    const { result, client, keys } = mount();
    fixture.returnedId = 'foreign-id';
    await act(async () => {
      await expect(save(operation, result.current)).rejects.toThrow('Could not confirm');
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  });

  it.each(['category-insert', 'plan-insert'] as const)('%s rejects a blank created identity', async operation => {
    const { result, client, keys } = mount();
    fixture.returnedId = '';
    await act(async () => {
      await expect(save(operation, result.current)).rejects.toThrow('Could not confirm');
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  });
});

