import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGlobalSearch } from '../useGlobalSearch';
import { useBrowseByType } from '../useBrowseByType';
const state = vi.hoisted(() => ({ calls: [] as unknown[][], rpcError: false, homes: [] as Record<string, unknown>[] }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('../useSearchContext', () => ({ useSearchContext: () => ({ personas: [] }) }));
vi.mock('@/lib/search/staticIndex', () => ({ searchStaticIndex: () => [] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 rpc: async () => ({ data: state.rpcError ? null : [{ entity_type: 'property', entity_id: 'private', path: '/property/private' }], error: state.rpcError ? new Error('Synthetic RPC failure') : null }),
 functions: { invoke: vi.fn() },
 from: (table: string) => {
  state.calls.push(['from', table]);
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'or', 'order', 'limit']) query[method] = (...args: unknown[]) => { state.calls.push([method, ...args]); return query; };
  query.abortSignal = async () => ({ data: state.homes, error: null });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: state.homes, error: null }).then(resolve); return query;
 },
} }));
afterEach(cleanup);
describe('global housing search public catalogue coverage', () => {
 it.each([false, true])('finds published housing even when legacy RPC fails=%s and excludes its private branch', async rpcError => {
  state.rpcError = rpcError; state.calls = [];
  state.homes = [{ id: 'synthetic-title', title_en: 'Title QA', listing_type: 'sale', listing_modes: ['rent', 'sale'], district: 'Bang Tao' }];
  const { result } = renderHook(() => useGlobalSearch('Title'));
  await waitFor(() => expect(result.current.results).toHaveLength(1));
  expect(result.current.results[0]).toMatchObject({ id: 'db-property-synthetic-title', titleEn: 'Title QA', price: null, rating: null, path: '/property/synthetic-title?mode=rent' });
  expect(state.calls).toContainEqual(['from', 'public_property_catalog']);
  expect(state.calls).toContainEqual(['eq', 'is_active', true]);
  expect(state.calls).toContainEqual(['eq', 'approval_status', 'approved']);
  expect(state.calls).toContainEqual(['or', 'title_en.ilike.%Title%,title_ru.ilike.%Title%']);
 });
});

it('browses housing through the same public allowlist without unqualified prices', async () => {
 state.calls = []; state.homes = [{ id: 'synthetic-home', title_en: 'Synthetic home', price: 1234, rating: 5 }];
 const { result } = renderHook(() => useBrowseByType('property'));
 await waitFor(() => expect(result.current.results).toHaveLength(1));
 expect(result.current.results[0]).toMatchObject({ price: null, rating: null, path: '/property/synthetic-home' });
 expect(state.calls).toContainEqual(['from', 'public_property_catalog']);
 expect(state.calls).toContainEqual(['eq', 'approval_status', 'approved']);
});
