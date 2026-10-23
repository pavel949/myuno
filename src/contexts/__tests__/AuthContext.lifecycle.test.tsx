import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from '../AuthContext';

const mock = vi.hoisted(() => ({ getSession: vi.fn(), signOut: vi.fn(), clearAdminCache: vi.fn(), callback: null as null | ((event: string, session: Session | null) => void) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mock.getSession, signOut: mock.signOut, onAuthStateChange: (callback: typeof mock.callback) => { mock.callback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; } } } }));
vi.mock('@/hooks/useIsAdmin', () => ({ clearAdminCache: mock.clearAdminCache }));
vi.mock('@/lib/segmentation/anonSession', () => ({ readAnonSessionId: () => null, clearAnonSessionId: vi.fn() }));
const session = (id: string) => ({ user: { id } }) as Session;
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function setup() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider></QueryClientProvider>; return { ...renderHook(() => useAuth(), { wrapper }), client }; }
beforeEach(() => { vi.clearAllMocks(); mock.callback = null; mock.getSession.mockResolvedValue({ data: { session: null } }); mock.signOut.mockResolvedValue({ error: null }); sessionStorage.clear(); });
afterEach(cleanup);
describe('auth initialization and truthful logout', () => {
  it('restores a valid initial session when no newer event has arrived', async () => {
    mock.getSession.mockResolvedValue({ data: { session: session('restored-actor') } }); const view = setup();
    await act(async () => {}); expect(view.result.current.user?.id).toBe('restored-actor'); expect(view.result.current.isLoading).toBe(false);
  });
  it('settles invalid initial credentials without waiting for the fallback timer', async () => {
    mock.getSession.mockRejectedValue(new Error('invalid jwt')); const view = setup(); await act(async () => {});
    expect(view.result.current.user).toBeNull(); expect(view.result.current.isLoading).toBe(false);
  });
  it('does not restore an old initial session after a newer signed-out event', async () => {
    const pending = deferred<{ data: { session: Session | null } }>(); mock.getSession.mockReturnValue(pending.promise);
    const view = setup(); act(() => mock.callback!('SIGNED_OUT', null));
    await act(async () => pending.resolve({ data: { session: session('old-actor') } }));
    expect(view.result.current.user).toBeNull(); expect(view.result.current.isLoading).toBe(false);
  });
  it('does not erase a newly signed-in actor when the old initial read fails', async () => {
    const pending = deferred<{ data: { session: Session | null } }>(); mock.getSession.mockReturnValue(pending.promise);
    const view = setup(); act(() => mock.callback!('SIGNED_IN', session('new-actor')));
    await act(async () => pending.reject(new Error('invalid jwt')));
    expect(view.result.current.user?.id).toBe('new-actor');
  });
  it('reports server revocation failure while clearing private local state and caches', async () => {
    const view = setup(); await act(async () => {}); act(() => mock.callback!('SIGNED_IN', session('actor')));
    view.client.setQueryData(['private', 'actor'], { private: true }); sessionStorage.setItem('myuno:platform-view-as', 'old');
    mock.signOut.mockResolvedValue({ error: new Error('revocation not confirmed') });
    await act(async () => { await expect(view.result.current.signOut()).rejects.toThrow('revocation not confirmed'); });
    expect(view.result.current.user).toBeNull(); expect(view.client.getQueryCache().getAll()).toHaveLength(0); expect(sessionStorage.getItem('myuno:platform-view-as')).toBeNull();
  });
  it('invalidates a pending initial read even when logout emits no auth event', async () => {
    const pending = deferred<{ data: { session: Session | null } }>(); mock.getSession.mockReturnValue(pending.promise);
    const view = setup(); await act(async () => view.result.current.signOut());
    await act(async () => pending.resolve({ data: { session: session('old-actor') } })); expect(view.result.current.user).toBeNull();
  });
  it('retains successful logout and cleanup when the SDK confirms it', async () => {
    const view = setup(); await act(async () => {}); act(() => mock.callback!('SIGNED_IN', session('actor')));
    await act(async () => view.result.current.signOut()); expect(view.result.current.user).toBeNull(); expect(mock.clearAdminCache).toHaveBeenCalled();
  });
});
