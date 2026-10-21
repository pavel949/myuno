import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fixture.from } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: vi.fn() }));
import { changeCompanyMemberAccess } from '@/hooks/useCompanyTeam';
import { CompanyAccessLifetime, type BoundCompanyAccessOperation } from '@/lib/companyAccessOperation';
function operation(lifetime = new CompanyAccessLifetime('actor', 'company')) {
  return { ...lifetime.begin(), client: fixture } as unknown as BoundCompanyAccessOperation;
}

function setup(options: { denied?: boolean; member?: object | null; space?: object | null; saved?: object | null; readError?: boolean; scopeReady?: boolean | null } = {}) {
  const writes: { table: string; payload: Record<string, unknown> }[] = [];
  const filters: { table: string; key: string; value: unknown }[] = [];
  fixture.rpc.mockResolvedValue({ data: !options.denied, error: null });
  fixture.from.mockImplementation((table: string) => {
    let payload: Record<string, unknown> | null = null;
    const result = () => {
      if (payload) return { data: options.saved === undefined ? { user_id: 'actual-auth-id', ...payload } : options.saved, error: null };
      if (table === 'management_companies') return { data: { operating_spaces_enforced: options.scopeReady === undefined ? true : options.scopeReady }, error: null };
      if (table === 'management_company_members') return { data: options.member === undefined ? { id: 'company-member', user_id: 'actual-auth-id', role: 'staff', is_active: true } : options.member, error: null };
      if (table === 'operating_spaces') return { data: options.space === undefined ? { id: 'verified-space', is_active: true } : options.space, error: null };
      return { data: { can_export: true, sub_permissions: { preserve: true } }, error: options.readError ? new Error('lookup failed') : null };
    };
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn((key: string, value: unknown) => { filters.push({ table, key, value }); return chain; }),
      upsert: vi.fn((value: Record<string, unknown>) => { payload = value; writes.push({ table, payload }); return chain; }),
      update: vi.fn((value: Record<string, unknown>) => { payload = value; writes.push({ table, payload }); return chain; }),
      insert: vi.fn((value: Record<string, unknown>) => { payload = value; writes.push({ table, payload }); return chain; }),
      single: vi.fn(async () => result()), maybeSingle: vi.fn(async () => result()) };
    return chain;
  });
  return { writes, filters };
}
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); })); });
afterEach(() => vi.unstubAllGlobals());
describe('company member access uses canonical identities and scope', () => {
  it('denies missing overseer authority before any table use', async () => {
    setup({ denied: true });
    await expect(changeCompanyMemberAccess(operation(), { memberId: 'company-member', kind: 'space', spaceId: 'space', active: true })).rejects.toThrow();
    expect(fixture.from).not.toHaveBeenCalled();
  });
  it.each([null, { id: 'inactive', role: 'staff', is_active: false }, { id: 'admin', role: 'admin', is_active: true }])('rejects unavailable/inactive/privileged member %#', async member => {
    const { writes } = setup({ member });
    await expect(changeCompanyMemberAccess(operation(), { memberId: 'requested', kind: 'space', spaceId: 'space', active: true })).rejects.toThrow();
    expect(writes).toEqual([]);
  });
  it.each([null, { id: 'inactive-space', is_active: false }])('cannot grant foreign or inactive Space %#', async space => {
    const { writes, filters } = setup({ space });
    await expect(changeCompanyMemberAccess(operation(), { memberId: 'member', kind: 'space', spaceId: 'requested-space', active: true })).rejects.toThrow();
    expect(filters).toContainEqual({ table: 'operating_spaces', key: 'management_company_id', value: 'company' });
    expect(writes).toEqual([]);
  });
  it('Space assignment uses verified company member id, never HR or Auth id', async () => {
    const { writes, filters } = setup();
    await changeCompanyMemberAccess(operation(), { memberId: 'company-member', kind: 'space', spaceId: 'verified-space', active: true });
    expect(writes[0]).toMatchObject({ table: 'operating_space_members', payload: { company_member_id: 'company-member', operating_space_id: 'verified-space', management_company_id: 'company', is_active: true, granted_by: 'actor' } });
    expect(filters).toContainEqual({ table: 'management_company_members', key: 'company_id', value: 'company' });
  });
  it.each(['properties', 'pricing', 'bookings'] as const)('%s grants use verified Auth ID and preserve unrelated rights', async module => {
    const { writes, filters } = setup();
    await changeCompanyMemberAccess(operation(), { memberId: 'company-member', kind: 'module', module, capability: 'edit', enabled: true });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ table: 'team_member_permissions', payload: { can_view: true, can_edit: true, granted_by: 'actor' } });
    expect(writes[0].payload).not.toHaveProperty('can_export'); expect(writes[0].payload).not.toHaveProperty('sub_permissions');
    expect(filters).toContainEqual({ table: 'team_member_permissions', key: 'user_id', value: 'actual-auth-id' });
    expect(filters).toContainEqual({ table: 'team_member_permissions', key: 'module', value: module });
  });
  it('failed current-rights read cannot overwrite permissions with defaults', async () => {
    const { writes } = setup({ readError: true });
    await expect(changeCompanyMemberAccess(operation(), { memberId: 'member', kind: 'module', module: 'properties', capability: 'edit', enabled: true })).rejects.toThrow();
    expect(writes).toEqual([]);
  });
  it.each([false, null])('refuses new grants before the approved company cutover (%s)', async scopeReady => {
    const { writes } = setup({ scopeReady });
    await expect(changeCompanyMemberAccess(operation(), { memberId: 'member', kind: 'module', module: 'properties', capability: 'edit', enabled: true })).rejects.toThrow('security cutover');
    expect(writes).toEqual([]);
  });
  it('removing Edit never restores View from stale UI state', async () => {
    const { writes } = setup();
    await changeCompanyMemberAccess(operation(), { memberId: 'member', kind: 'module', module: 'properties', capability: 'edit', enabled: false });
    expect(writes[0].payload).toMatchObject({ can_edit: false });
    expect(writes[0].payload).not.toHaveProperty('can_view');
  });
  it('removing View explicitly clears Edit too', async () => {
    const { writes } = setup();
    await changeCompanyMemberAccess(operation(), { memberId: 'member', kind: 'module', module: 'properties', capability: 'view', enabled: false });
    expect(writes[0].payload).toMatchObject({ can_view: false, can_edit: false });
  });
  it('zero-row write is not reported as saved', async () => {
    setup({ saved: null });
    await expect(changeCompanyMemberAccess(operation(), { memberId: 'member', kind: 'space', spaceId: 'verified-space', active: true })).rejects.toThrow('not confirmed');
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
describe('deferred access mutation invalidation', () => {
  it.each(['overseer', 'management_company_members', 'management_companies', 'team_member_permissions', 'operating_spaces'])(
    'cannot dispatch a write after context invalidation during %s', async stage => {
      const { writes } = setup();
      const held = deferred<{ data: unknown; error: null }>();
      const started = deferred<void>();
      if (stage === 'overseer') fixture.rpc.mockImplementationOnce(() => { started.resolve(); return held.promise; });
      else {
        const original = fixture.from.getMockImplementation()!;
        fixture.from.mockImplementation((table: string) => {
          const chain = original(table);
          if (table === stage) {
            const method = stage === 'team_member_permissions' ? 'maybeSingle' : 'single';
            chain[method].mockImplementationOnce(() => { started.resolve(); return held.promise; });
          }
          return chain;
        });
      }
      const lifetime = new CompanyAccessLifetime('actor', 'company');
      const op = operation(lifetime);
      const pending = changeCompanyMemberAccess(op, stage === 'operating_spaces'
        ? { memberId: 'member', kind: 'space', spaceId: 'space', active: true }
        : { memberId: 'member', kind: 'module', module: 'properties', capability: 'edit', enabled: true });
      const rejected = expect(pending).rejects.toThrow('cancelled');
      await started.promise;
      lifetime.invalidate(); // actor switch, company switch or owning component unmount
      held.resolve({ data: stage === 'overseer' ? true : { id: 'member', user_id: 'actual-auth-id', role: 'staff', is_active: true }, error: null });
      await rejected;
      expect(writes).toEqual([]);
      expect(op.signal.aborted).toBe(true);
    });
});
