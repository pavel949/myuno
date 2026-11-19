import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateDeveloper, useUpdateDeveloper, useDeleteDeveloper, useDeveloper } from '../useAdminDevelopers';
const state = vi.hoisted(() => ({ response: { data: { id: 'dev', user_id: 'private-owner' }, error: null } as any, tables: [] as string[] }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  state.tables.push(table);
  const query = { select: () => query, eq: () => query, insert: () => query, update: () => query, delete: () => query,
    single: async () => state.response };
  return query;
} } }));
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
beforeEach(() => { state.tables = []; state.response = { data: { id: 'dev', user_id: 'private-owner' }, error: null }; });
describe('developer admin/public cache boundary', () => {
  it('does not reuse or overwrite the public detail cache for a private row', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(['developer', 'dev'], { id: 'dev', name_en: 'Public safe row' });
    const { result } = renderHook(() => useDeveloper('dev'), { wrapper });
    await waitFor(() => expect(result.current.data?.user_id).toBe('private-owner'));
    expect(state.tables).toEqual(['developers']);
    expect(client.getQueryData(['developer', 'dev'])).toEqual({ id: 'dev', name_en: 'Public safe row' });
    client.clear();
  });
  it.each(['create', 'update', 'delete'] as const)('%s invalidates persisted public and admin projections', async operation => {
    const { client, wrapper } = setup();
    const keys = [['admin-developers'], ['admin-developer', 'dev'], ['developers'], ['developer', 'dev'], ['developer-slug-or-id', 'old-slug']];
    keys.forEach(key => client.setQueryData(key, { id: 'dev' }));
    const { result } = renderHook(() => ({ create: useCreateDeveloper(), update: useUpdateDeveloper(), delete: useDeleteDeveloper() }), { wrapper });
    await act(async () => {
      if (operation === 'delete') await result.current.delete.mutateAsync('dev');
      else if (operation === 'update') await result.current.update.mutateAsync({ id: 'dev', name_en: 'Changed', name_ru: 'Изменён', is_active: false });
      else await result.current.create.mutateAsync({ name_en: 'Created', name_ru: 'Создан' });
    });
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated, key.join('/')).toBe(true));
    client.clear();
  });
  it('does not report a rejected write as a cache refresh', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(['developers'], []);
    state.response = { data: null, error: new Error('RLS rejected') };
    const { result } = renderHook(() => useUpdateDeveloper(), { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ id: 'dev', name_en: 'No', name_ru: 'Нет' })).rejects.toThrow('RLS rejected'); });
    expect(client.getQueryState(['developers'])?.isInvalidated).toBe(false);
    client.clear();
  });
});
