import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth } }));
import { bindCompanyAccessOperation, CompanyAccessLifetime } from '@/lib/companyAccessOperation';
import { useCompanyAccessLifetime } from '@/hooks/useCompanyAccessLifetime';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const sessionA = { user: { id: 'actor-a' }, access_token: 'synthetic-token-a' };
let authChanged: (event: string, session: { user: { id: string } } | null) => void;
beforeEach(() => {
  vi.clearAllMocks();
  auth.getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
  auth.getUser.mockResolvedValue({ data: { user: { id: 'actor-a' } }, error: null });
  auth.onAuthStateChange.mockImplementation(callback => { authChanged = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('true', { status: 200, headers: { 'Content-Type': 'application/json' } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('operation-bound existing Auth credentials', () => {
  it('never borrows a changed shared session for a subsequent request', async () => {
    const lifetime = new CompanyAccessLifetime('actor-a', 'company');
    const operation = await bindCompanyAccessOperation(lifetime.begin());
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'actor-b' }, access_token: 'synthetic-token-b' } }, error: null });
    await operation.client.rpc('actor_is_operating_company_overseer', { _company_id: 'company' });
    expect(auth.getUser).toHaveBeenCalledWith('synthetic-token-a');
    expect(fetch).toHaveBeenCalledTimes(1);
    const init = vi.mocked(fetch).mock.calls[0][1];
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer synthetic-token-a');
    expect(init?.signal).toBe(operation.signal);
    operation.finish();
  });
  it('blocks the actual network dispatch after invalidation, including a prebuilt request', async () => {
    const lifetime = new CompanyAccessLifetime('actor-a', 'company');
    const operation = await bindCompanyAccessOperation(lifetime.begin());
    const request = operation.client.from('team_member_permissions').update({ can_edit: false }).eq('company_id', 'company');
    lifetime.invalidate();
    const result = await request;
    expect(result.error).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rechecks at HTTP dispatch when invalidated just after credential resolution', async () => {
    const lifetime = new CompanyAccessLifetime('actor-a', 'company');
    const lease = lifetime.begin();
    const originalCheck = lease.assertCurrent;
    let invalidateAfterCredential = false;
    lease.assertCurrent = () => {
      originalCheck();
      if (invalidateAfterCredential) {
        invalidateAfterCredential = false;
        queueMicrotask(() => lifetime.invalidate());
      }
    };
    const operation = await bindCompanyAccessOperation(lease);
    invalidateAfterCredential = true;
    const result = await operation.client.rpc('actor_is_operating_company_overseer', { _company_id: 'company' });
    expect(result.error).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['getSession', 'getUser'] as const)('does not continue after invalidation during %s', async method => {
    const held = deferred<unknown>(); auth[method].mockReturnValueOnce(held.promise);
    const lifetime = new CompanyAccessLifetime('actor-a', 'company');
    const pending = bindCompanyAccessOperation(lifetime.begin());
    const rejected = expect(pending).rejects.toThrow('cancelled');
    await Promise.resolve(); lifetime.invalidate();
    held.resolve(method === 'getSession' ? { data: { session: sessionA } } : { data: { user: sessionA.user } });
    await rejected;
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects mismatched authenticated identity before creating an operation client', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'actor-b' } }, error: null });
    await expect(bindCompanyAccessOperation(new CompanyAccessLifetime('actor-a', 'company').begin())).rejects.toThrow('cancelled');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('actor/company/component lifetime', () => {
  it.each(['actor', 'company', 'unmount', 'auth-event', 'sign-out'])('invalidates pending work on %s', mode => {
    const { result, rerender, unmount } = renderHook(({ actor, company }) => useCompanyAccessLifetime(actor, company), { initialProps: { actor: 'actor-a', company: 'company-a' } });
    const lease = result.current.begin(); const current = result.current.capture();
    if (mode === 'actor') rerender({ actor: 'actor-b', company: 'company-a' });
    if (mode === 'company') rerender({ actor: 'actor-a', company: 'company-b' });
    if (mode === 'unmount') unmount();
    if (mode === 'sign-out') act(() => authChanged('SIGNED_OUT', null));
    if (mode === 'auth-event') act(() => authChanged('SIGNED_IN', { user: { id: 'actor-b' } }));
    expect(lease.signal.aborted).toBe(true);
    expect(lease.assertCurrent).toThrow('cancelled');
    expect(current()).toBe(false);
  });
  it('token refresh for the same account does not invalidate its UI lifetime', () => {
    const { result } = renderHook(() => useCompanyAccessLifetime('actor-a', 'company-a'));
    const lease = result.current.begin();
    act(() => authChanged('TOKEN_REFRESHED', { user: { id: 'actor-a' } }));
    expect(lease.assertCurrent).not.toThrow();
  });
  it('reactivating a lifetime never revives its earlier operations', () => {
    const lifetime = new CompanyAccessLifetime('actor-a', 'company');
    const lease = lifetime.begin(); lifetime.invalidate(); lifetime.activate();
    expect(lease.assertCurrent).toThrow('cancelled');
    expect(lifetime.begin().assertCurrent).not.toThrow();
  });
});
