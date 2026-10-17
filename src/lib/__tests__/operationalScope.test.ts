import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { OperationalScopeResolver, operationalScopeQueryKey, scopeAllowsProperty, type ResolvedOperationalScope } from '../operationalScope';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const context = { userId: id(1), activeCompanyId: id(2) };
const ready = (extra: Partial<ResolvedOperationalScope> = {}): ResolvedOperationalScope => ({
  activeCompanyId: id(2), requestedSpaceId: null, activeSpaceId: id(3),
  authorizedSpaceIds: [id(3)], authorizedPropertyIds: [id(4)], unassignedPropertyIds: [],
  status: 'ready', reason: 'authorized', enforcement: 'enforced', mode: 'space',
  isCompanyOverseer: false, revision: 'revision-1', ...extra,
});
let cache: QueryClient;
beforeEach(() => { cache = new QueryClient(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); })); });
afterEach(() => { cache.clear(); vi.unstubAllGlobals(); });

describe('shadow operational scope lifecycle (no production network)', () => {
  it('no company preserves personal context and never invokes server', async () => {
    const read = vi.fn(); const resolver = new OperationalScopeResolver({ read, cache });
    const result = await resolver.setContext({ userId: id(1), activeCompanyId: null });
    expect(result.status).toBe('not_applicable'); expect(result.authorizedPropertyIds).toEqual([]);
    expect(read).not.toHaveBeenCalled();
  });
  it('signed-out company context fails closed', async () => {
    const read = vi.fn(); const resolver = new OperationalScopeResolver({ read, cache });
    expect((await resolver.setContext({ userId: null, activeCompanyId: id(2) })).status).toBe('no_access');
    expect(read).not.toHaveBeenCalled();
  });
  it('empty scope never means all, including legacy and errors', async () => {
    const read = vi.fn().mockResolvedValue(ready({ status: 'legacy', enforcement: 'not_enforced', activeSpaceId: null, authorizedSpaceIds: [], authorizedPropertyIds: [] }));
    const resolver = new OperationalScopeResolver({ read, cache });
    const result = await resolver.setContext(context);
    expect(result.status).toBe('legacy'); expect(scopeAllowsProperty(result, id(4))).toBe(false);
    read.mockRejectedValue(new Error('Unavailable'));
    const failed = await resolver.refresh();
    expect(failed.status).toBe('error'); expect(scopeAllowsProperty(failed, id(4))).toBe(false);
  });
  it('saved user+company preference is revalidated and invalid selection denied/cleared', async () => {
    const key = `operational-scope-v1:preference:${id(1)}:${id(2)}`;
    localStorage.setItem(key, id(99));
    const read = vi.fn().mockResolvedValue(ready({ status: 'no_access', reason: 'requested_space_unavailable', requestedSpaceId: id(99), activeSpaceId: null, authorizedSpaceIds: [], authorizedPropertyIds: [] }));
    const resolver = new OperationalScopeResolver({ read, cache, storage: localStorage });
    expect((await resolver.setContext(context)).status).toBe('no_access');
    expect(read.mock.calls[0].slice(0, 2)).toEqual([id(2), id(99)]);
    expect(localStorage.getItem(key)).toBeNull();
  });
  it('authorized selection narrows and is saved only after server validation', async () => {
    const read = vi.fn().mockResolvedValueOnce(ready({ mode: 'all_authorized', activeSpaceId: null, authorizedSpaceIds: [id(3), id(5)], authorizedPropertyIds: [id(4), id(6)] }))
      .mockResolvedValueOnce(ready({ requestedSpaceId: id(3) }));
    const resolver = new OperationalScopeResolver({ read, cache, storage: localStorage });
    expect((await resolver.setContext(context)).authorizedPropertyIds).toEqual([id(4), id(6)]);
    const result = await resolver.selectSpace(id(3));
    expect(result.authorizedPropertyIds).toEqual([id(4)]);
    expect(localStorage.getItem(`operational-scope-v1:preference:${id(1)}:${id(2)}`)).toBe(id(3));
    expect(scopeAllowsProperty(result, id(6))).toBe(false);
  });
  it('company switch clears preference and evicts only owned scoped cache', async () => {
    const read = vi.fn().mockResolvedValueOnce(ready()).mockResolvedValueOnce(ready({ activeCompanyId: id(7) }));
    const resolver = new OperationalScopeResolver({ read, cache, storage: localStorage });
    await resolver.setContext(context);
    cache.setQueryData(operationalScopeQueryKey(id(1), ready()), { secret: 'synthetic' });
    cache.setQueryData(['profile'], { keep: true });
    await resolver.setContext({ userId: id(1), activeCompanyId: id(7) });
    expect(read.mock.calls[1].slice(0, 2)).toEqual([id(7), null]);
    expect(cache.getQueryData(operationalScopeQueryKey(id(1), ready()))).toBeUndefined();
    expect(cache.getQueryData(['profile'])).toEqual({ keep: true });
    expect(localStorage.getItem(`operational-scope-v1:preference:${id(1)}:${id(2)}`)).toBeNull();
  });
  it('late prior-company response cannot restore revoked scope', async () => {
    let complete: ((value: unknown) => void) | undefined;
    const read = vi.fn().mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }))
      .mockResolvedValueOnce(ready({ activeCompanyId: id(7) }));
    const resolver = new OperationalScopeResolver({ read, cache });
    const old = resolver.setContext(context);
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    await resolver.setContext({ userId: id(1), activeCompanyId: id(7) });
    complete?.(ready()); await old;
    expect(resolver.snapshot.activeCompanyId).toBe(id(7));
    expect(read.mock.calls[0][2].aborted).toBe(true);
  });
  it('revocation clears preference and restricted caches; property reassignment changes key', async () => {
    const read = vi.fn().mockResolvedValueOnce(ready()).mockResolvedValueOnce(ready({ revision: 'revision-2', authorizedPropertyIds: [id(6)] }))
      .mockResolvedValueOnce(ready({ status: 'no_access', reason: 'company_membership_required', activeSpaceId: null, authorizedSpaceIds: [], authorizedPropertyIds: [], revision: 'revoked' }));
    const resolver = new OperationalScopeResolver({ read, cache, storage: localStorage });
    const before = await resolver.setContext(context);
    const after = await resolver.refresh();
    expect(operationalScopeQueryKey(id(1), before)).not.toEqual(operationalScopeQueryKey(id(1), after));
    expect(scopeAllowsProperty(after, id(4))).toBe(false);
    cache.setQueryData(operationalScopeQueryKey(id(1), after), 'synthetic');
    expect((await resolver.refresh()).status).toBe('no_access');
    expect(cache.getQueryData(operationalScopeQueryKey(id(1), after))).toBeUndefined();
    expect(localStorage.length).toBe(0);
  });
  it('logout/dispose clear preferences and cannot reuse access', async () => {
    const resolver = new OperationalScopeResolver({ read: vi.fn().mockResolvedValue(ready()), cache, storage: localStorage });
    await resolver.setContext(context); await resolver.dispose();
    expect(resolver.snapshot.status).toBe('not_applicable'); expect(localStorage.length).toBe(0);
  });
  it.each([
    ready({ activeCompanyId: id(7) }),
    ready({ status: 'no_access' }),
    ready({ unassignedPropertyIds: [id(8)] }),
    ready({ activeSpaceId: id(999) }),
    ready({ enforcement: 'not_enforced' }),
  ])('malformed or mismatched response fails closed %#', async response => {
    const resolver = new OperationalScopeResolver({ read: vi.fn().mockResolvedValue(response), cache });
    const result = await resolver.setContext(context);
    expect(result.status).toBe('error'); expect(result.authorizedPropertyIds).toEqual([]);
  });
  it('cache discriminator includes actor and company and revision', () => {
    expect(operationalScopeQueryKey(id(1), ready())).not.toEqual(operationalScopeQueryKey(id(9), ready()));
    expect(operationalScopeQueryKey(id(1), ready())).not.toEqual(operationalScopeQueryKey(id(1), ready({ activeCompanyId: id(7) })));
  });
});