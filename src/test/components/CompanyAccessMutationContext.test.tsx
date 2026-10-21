import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: vi.fn() }));
import { CompanyAccessLifetime } from '@/lib/companyAccessOperation';
let hooks: typeof import('@/hooks/useCompanyTeam');
beforeAll(async () => { vi.stubEnv('VITE_TEAM_MEMBER_ACCESS_ENABLED', 'true'); hooks = await import('@/hooks/useCompanyTeam'); });
afterAll(() => vi.unstubAllEnvs());
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
describe('mutation initiation binds the original action context', () => {
  it.each(['invitation', 'access'])('cannot retarget %s while React Query onMutate is deferred', async kind => {
    const held = deferred(); const started = deferred();
    const client = new QueryClient({ mutationCache: new MutationCache({ onMutate: async () => { started.resolve(); await held.promise; } }), defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const lifetimeA = new CompanyAccessLifetime('actor-a', 'company-a');
    const { result, rerender } = renderHook(({ lifetime }) => ({
      invitation: hooks.useInviteCompanyMember(lifetime), access: hooks.useChangeCompanyMemberAccess(lifetime),
    }), { wrapper, initialProps: { lifetime: lifetimeA } });
    let pending!: Promise<unknown>;
    act(() => {
      pending = kind === 'invitation'
        ? result.current.invitation.mutateAsync({ full_name: 'Synthetic', email: 'synthetic@example.test', role: 'staff' })
        : result.current.access.mutateAsync({ memberId: 'member', kind: 'module', module: 'properties', capability: 'edit', enabled: true });
    });
    const rejected = expect(pending).rejects.toThrow('cancelled');
    await started.promise;
    lifetimeA.invalidate();
    rerender({ lifetime: new CompanyAccessLifetime('actor-b', 'company-b') });
    await act(async () => { held.resolve(); await rejected; });
    expect(auth.getSession).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    client.clear();
  });
});
