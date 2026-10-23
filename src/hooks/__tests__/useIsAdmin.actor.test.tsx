import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAdminCache, useIsAdmin } from '../useIsAdmin';
const state = vi.hoisted(() => ({ user: { id: 'admin-a' } as { id: string } | null, rpc: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: state.rpc } }));
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; }
type Reply = { data: boolean | null; error: Error | null };
beforeEach(() => { vi.clearAllMocks(); clearAdminCache(); state.user = { id: 'admin-a' }; state.rpc.mockResolvedValue({ data: false, error: null }); });
afterEach(() => { cleanup(); clearAdminCache(); vi.restoreAllMocks(); });
describe('actor-bound platform admin result', () => {
  it.each(['false', 'error'])('never renders admin A authority for pending ordinary B, then settles %s closed', async outcome => {
    const pending = deferred<Reply>(); state.rpc.mockResolvedValueOnce({ data: true, error: null }).mockReturnValueOnce(pending.promise);
    const renders: { actor: string | null; isAdmin: boolean; isLoading: boolean }[] = [];
    const view = renderHook(() => { const result = useIsAdmin(); renders.push({ actor: state.user?.id ?? null, isAdmin: result.isAdmin, isLoading: result.isLoading }); return result; });
    await waitFor(() => expect(view.result.current.isAdmin).toBe(true));
    state.user = { id: 'ordinary-b' }; view.rerender();
    expect(renders.find(render => render.actor === 'ordinary-b')).toEqual({ actor: 'ordinary-b', isAdmin: false, isLoading: true });
    expect(view.result.current).toMatchObject({ isAdmin: false, isLoading: true });
    await act(async () => pending.resolve(outcome === 'error' ? { data: null, error: new Error('synthetic read failure') } : { data: false, error: null }));
    expect(view.result.current).toMatchObject({ isAdmin: false, isLoading: false }); expect(state.rpc).toHaveBeenLastCalledWith('has_role', { _user_id: 'ordinary-b', _role: 'admin' });
  });
  it('does not expose the previous admin in the first logged-out render', async () => {
    state.rpc.mockResolvedValue({ data: true, error: null }); const renders: { actor: string | null; isAdmin: boolean; isLoading: boolean }[] = [];
    const view = renderHook(() => { const result = useIsAdmin(); renders.push({ actor: state.user?.id ?? null, isAdmin: result.isAdmin, isLoading: result.isLoading }); return result; }); await waitFor(() => expect(view.result.current.isAdmin).toBe(true));
    state.user = null; view.rerender(); expect(renders.find(render => render.actor === null)).toEqual({ actor: null, isAdmin: false, isLoading: false });
  });
  it('ignores late former-actor responses and does not warm their cache', async () => {
    const pendingA = deferred<Reply>(); state.rpc.mockReturnValueOnce(pendingA.promise).mockResolvedValue({ data: false, error: null }); const view = renderHook(useIsAdmin);
    state.user = { id: 'ordinary-b' }; view.rerender(); await waitFor(() => expect(view.result.current.isLoading).toBe(false)); await act(async () => pendingA.resolve({ data: true, error: null }));
    expect(view.result.current.isAdmin).toBe(false); state.user = { id: 'admin-a' }; view.rerender(); await waitFor(() => expect(state.rpc).toHaveBeenCalledTimes(3)); expect(view.result.current.isAdmin).toBe(false);
  });
  it('does not repopulate the cleared cache from an in-flight pre-logout reply', async () => {
    const pending = deferred<Reply>(); state.rpc.mockReturnValueOnce(pending.promise).mockResolvedValue({ data: false, error: null }); const view = renderHook(useIsAdmin);
    clearAdminCache(); state.user = null; view.rerender(); await act(async () => pending.resolve({ data: true, error: null })); state.user = { id: 'admin-a' }; view.rerender();
    await waitFor(() => expect(state.rpc).toHaveBeenCalledTimes(2)); await waitFor(() => expect(view.result.current.isLoading).toBe(false)); expect(view.result.current.isAdmin).toBe(false);
  });
  it('does not cache a response after its consumer unmounts', async () => {
    const pending = deferred<Reply>(); state.rpc.mockReturnValueOnce(pending.promise).mockResolvedValue({ data: false, error: null }); const view = renderHook(useIsAdmin); view.unmount(); await act(async () => pending.resolve({ data: true, error: null }));
    const next = renderHook(useIsAdmin); await waitFor(() => expect(state.rpc).toHaveBeenCalledTimes(2)); expect(next.result.current.isAdmin).toBe(false);
  });
  it('retains legitimate current-actor authority and the bounded cache TTL', async () => {
    let now = 1000; vi.spyOn(Date, 'now').mockImplementation(() => now); state.rpc.mockResolvedValue({ data: true, error: null }); const first = renderHook(useIsAdmin); await waitFor(() => expect(first.result.current.isAdmin).toBe(true)); first.unmount();
    const cached = renderHook(useIsAdmin); await waitFor(() => expect(cached.result.current.isAdmin).toBe(true)); expect(state.rpc).toHaveBeenCalledTimes(1);
    now += 60001; state.rpc.mockResolvedValue({ data: false, error: null }); state.user = { id: 'admin-a' }; cached.rerender(); await waitFor(() => expect(state.rpc).toHaveBeenCalledTimes(2)); await waitFor(() => expect(cached.result.current.isAdmin).toBe(false));
  });
  it('reports a verification error separately from absence and retries without granting locally', async () => {
    const error = new Error('synthetic verification failure'); state.rpc.mockResolvedValueOnce({ data: null, error }).mockResolvedValueOnce({ data: true, error: null });
    const view = renderHook(useIsAdmin); await waitFor(() => expect(view.result.current.isLoading).toBe(false)); expect(view.result.current).toMatchObject({ isAdmin: false, error });
    act(() => (view.result.current as typeof view.result.current & { retry: () => void }).retry());
    await waitFor(() => expect(view.result.current.isAdmin).toBe(true)); expect(view.result.current).toHaveProperty('error', null); expect(state.rpc).toHaveBeenCalledTimes(2);
  });
  it('does not reuse cached authority when logout invalidates a same-ID session', async () => {
    const pending = deferred<Reply>(); state.rpc.mockResolvedValueOnce({ data: true, error: null }).mockReturnValueOnce(pending.promise); const view = renderHook(useIsAdmin); await waitFor(() => expect(view.result.current.isAdmin).toBe(true));
    clearAdminCache(); state.user = { id: 'admin-a' }; view.rerender(); expect(view.result.current).toMatchObject({ isAdmin: false, isLoading: true });
    await act(async () => pending.resolve({ data: false, error: null })); expect(view.result.current.isAdmin).toBe(false);
  });
});
