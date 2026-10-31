import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateProjectUnit, useUpdateProjectUnit, useDeleteProjectUnit } from '../useProjectUnitsGrid';
const state = vi.hoisted(() => ({ response: { error: null } as { error: null | { message: string } }, filters: [] as unknown[][] }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = {
    insert: () => query, update: () => query, delete: () => query, select: () => query,
    eq: (...args: unknown[]) => { state.filters.push(args); return query; },
    single: async () => state.response,
  };
  return query;
} } }));
beforeEach(() => { state.response = { error: null }; state.filters = []; });
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>;
}
describe('checked project-unit authoring', () => {
  it.each(['update', 'delete'] as const)('scopes %s to the selected project and propagates zero-row failures', async operation => {
    state.response = { error: { message: 'Expected exactly one row, got zero' } };
    const hook = operation === 'update' ? useUpdateProjectUnit : useDeleteProjectUnit;
    const { result } = renderHook(hook, { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'unit', projectId: 'project' })).rejects.toMatchObject(state.response.error!);
    });
    expect(state.filters).toEqual([['id', 'unit'], ['project_id', 'project']]);
  });
  it('propagates an unconfirmed create instead of invoking success', async () => {
    state.response = { error: { message: 'No row returned' } };
    const { result } = renderHook(useCreateProjectUnit, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ project_id: 'project', unit_type: 'studio' })).rejects.toMatchObject(state.response.error!); });
  });
});
