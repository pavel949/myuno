import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminProperties } from '../useAdminContent';
const mocks = vi.hoisted(() => ({ user: { id: 'synthetic-admin' }, order: vi.fn(), from: vi.fn(), eq: vi.fn(), is: vi.fn(), or: vi.fn(), write: vi.fn(() => { throw Error('Writes forbidden'); }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
beforeEach(() => {
  vi.clearAllMocks();
  const chain = { select: () => chain, eq: mocks.eq, is: mocks.is, or: mocks.or, order: mocks.order, insert: mocks.write, update: mocks.write, delete: mocks.write };
  mocks.from.mockReturnValue(chain); mocks.eq.mockReturnValue(chain); mocks.is.mockReturnValue(chain); mocks.or.mockReturnValue(chain);
});
describe('admin property read state', () => {
  it('reports a failed read and retries without any business write', async () => {
    mocks.order.mockResolvedValueOnce({ data: null, error: { message: 'Synthetic denied read' } })
      .mockResolvedValueOnce({ data: [{ id: 'synthetic-property', approval_status: 'draft' }], error: null });
    const { result } = renderHook(() => useAdminProperties('synthetic-provider'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(mocks.is).toHaveBeenCalledWith('deleted_at', null);
    expect(mocks.or).toHaveBeenCalledWith('provider_id.eq.synthetic-provider,management_company_id.eq.synthetic-provider');
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBeNull();
    expect(result.current.properties).toHaveLength(1);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('also reports transport rejection instead of leaving loading stuck', async () => {
    mocks.order.mockRejectedValue(new Error('Synthetic offline'));
    const { result } = renderHook(() => useAdminProperties());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe('Synthetic offline');
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('does not replace a newer provider result with an older in-flight read', async () => {
    let finishOld!: (value: unknown) => void;
    mocks.order.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }))
      .mockResolvedValueOnce({ data: [{ id: 'new-provider-property' }], error: null });
    const { result, rerender } = renderHook(({ provider }) => useAdminProperties(provider), { initialProps: { provider: 'old-provider' } });
    rerender({ provider: 'new-provider' });
    await waitFor(() => expect(result.current.properties[0]?.id).toBe('new-provider-property'));
    await act(async () => { finishOld({ data: null, error: new Error('Old read failed') }); });
    expect(result.current.error).toBeNull();
    expect(result.current.properties[0]?.id).toBe('new-provider-property');
  });
});

it.each(['success', 'error'] as const)('ignores an old-provider manual retry %s after the new provider resolves', async outcome => {
  let finishRetry!: (value: unknown) => void;
  mocks.order.mockResolvedValueOnce({ data: null, error: new Error('Initial failed') })
    .mockReturnValueOnce(new Promise(resolve => { finishRetry = resolve; }))
    .mockResolvedValueOnce({ data: [{ id: 'provider-b-property' }], error: null });
  const { result, rerender } = renderHook(({ provider }) => useAdminProperties(provider), { initialProps: { provider: 'provider-a' } });
  await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  let retry!: Promise<void>;
  act(() => { retry = result.current.refetch(); });
  rerender({ provider: 'provider-b' });
  await waitFor(() => expect(result.current.properties[0]?.id).toBe('provider-b-property'));
  await act(async () => {
    finishRetry(outcome === 'success' ? { data: [{ id: 'provider-a-property' }], error: null } : { data: null, error: new Error('Late failure') });
    await retry;
  });
  expect(result.current.properties[0]?.id).toBe('provider-b-property');
  expect(result.current.error).toBeNull();
  expect(result.current.isLoading).toBe(false);
});

it('does not let an older retry clear a newer same-context loading state', async () => {
  let finishOld!: (value: unknown) => void, finishNew!: (value: unknown) => void;
  mocks.order.mockResolvedValueOnce({ data: [], error: null })
    .mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }))
    .mockReturnValueOnce(new Promise(resolve => { finishNew = resolve; }));
  const { result } = renderHook(() => useAdminProperties('provider-a'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  let oldRetry!: Promise<void>, newRetry!: Promise<void>;
  act(() => { oldRetry = result.current.refetch(); newRetry = result.current.refetch(); });
  await act(async () => { finishOld({ data: [{ id: 'old' }], error: null }); await oldRetry; });
  expect(result.current.isLoading).toBe(true);
  expect(result.current.properties).toEqual([]);
  await act(async () => { finishNew({ data: [{ id: 'new' }], error: null }); await newRetry; });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.properties[0]?.id).toBe('new');
});

it('ignores a saved retry callback from an old provider and after unmount', async () => {
  mocks.order.mockResolvedValue({ data: [], error: null });
  const { result, rerender, unmount } = renderHook(({ provider }) => useAdminProperties(provider), { initialProps: { provider: 'provider-a' } });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  const oldRetry = result.current.refetch;
  rerender({ provider: 'provider-b' });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(mocks.order).toHaveBeenCalledTimes(2);
  await act(async () => { await oldRetry(); });
  expect(mocks.order).toHaveBeenCalledTimes(2);
  const currentRetry = result.current.refetch;
  unmount();
  await currentRetry();
  expect(mocks.order).toHaveBeenCalledTimes(2);
});
