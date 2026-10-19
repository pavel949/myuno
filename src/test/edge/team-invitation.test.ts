import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { handleTeamInvitation } from '../../../supabase/functions/invite-team-member/handler';

const companyId = '00000000-0000-4000-8000-000000000001';
const baseBody = { company_id: companyId, full_name: 'Synthetic Employee', email: 'employee@example.test', role: 'staff' };
function setup(options: {
  account?: { id: string; email: string; email_confirmed_at?: string };
  member?: { id: string; role: string; is_active: boolean };
  permissions?: object[]; memberError?: boolean; lookupError?: boolean; companyMissing?: boolean; scopeReady?: boolean | null;
} = {}) {
  const writes: { table: string; payload: unknown }[] = [];
  const calls: string[] = [];
  const service = {
    auth: { admin: {
      listUsers: vi.fn().mockResolvedValue({ data: { users: options.account ? [options.account] : [] }, error: options.lookupError ? new Error('private error') : null }),
      inviteUserByEmail: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-user' } }, error: null }),
    } },
    from: vi.fn((table: string) => {
      calls.push(table);
      let insert = false;
      const result = () => {
        if (table === 'management_companies') return { data: options.companyMissing ? null : { id: companyId, operating_spaces_enforced: options.scopeReady === undefined ? true : options.scopeReady }, error: null };
        if (table === 'management_company_members') return insert
          ? { data: options.memberError ? null : { id: 'company-member' }, error: options.memberError ? new Error('private db message') : null }
          : { data: options.member || null, error: null };
        return { data: options.permissions || [], error: null };
      };
      const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
        insert: vi.fn((payload: unknown) => { insert = true; writes.push({ table, payload }); return chain; }),
        single: vi.fn(async () => result()), maybeSingle: vi.fn(async () => result()), limit: vi.fn(async () => result()),
      };
      return chain;
    }),
  };
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
  const deps = { authenticate: vi.fn().mockResolvedValue({ user: { id: 'caller' } }),
    actorClient: vi.fn(() => ({ rpc })), serviceClient: vi.fn(() => service), enabled: true, appUrl: 'https://myuno.app' };
  const run = (body = baseBody, method = 'POST') => handleTeamInvitation(new Request('https://synthetic.test/invite', { method, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) }), {}, deps as unknown as Parameters<typeof handleTeamInvitation>[2]);
  return { run, deps, rpc, service, calls, writes };
}
const account = { id: 'existing-auth-id', email: baseBody.email, email_confirmed_at: '2026-01-01' };
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); })));
afterEach(() => vi.unstubAllGlobals());

describe('secure company employee invitation', () => {
  it('authenticates before actor check or privileged client', async () => {
    const fixture = setup(); fixture.deps.authenticate.mockResolvedValue(new Response(null, { status: 401 }));
    expect((await fixture.run()).status).toBe(401);
    expect(fixture.deps.actorClient).not.toHaveBeenCalled(); expect(fixture.deps.serviceClient).not.toHaveBeenCalled();
  });
  it.each(['admin', 'director', 'uno_team', 'owner', 'unknown'])('rejects role escalation %s before privileged use', async role => {
    const fixture = setup(); expect((await fixture.run({ ...baseBody, role })).status).toBe(400);
    expect(fixture.deps.serviceClient).not.toHaveBeenCalled();
  });
  it.each([{ data: false, error: null }, { data: null, error: new Error('unavailable') }, { data: 'true', error: null }])('fails closed on unauthorized or failed actor RPC %#', async result => {
    const fixture = setup(); fixture.rpc.mockResolvedValue(result);
    expect((await fixture.run()).status).toBe(403); expect(fixture.deps.serviceClient).not.toHaveBeenCalled();
    expect(fixture.rpc).toHaveBeenCalledWith('actor_is_operating_company_overseer', { _company_id: companyId });
  });
  it('keeps activation separate from deployment', async () => {
    const fixture = setup(); fixture.deps.enabled = false;
    expect((await fixture.run()).status).toBe(503); expect(fixture.deps.serviceClient).not.toHaveBeenCalled();
  });
  it.each([false, null])('blocks account and membership creation before the approved scope cutover (%s)', async scopeReady => {
    const fixture = setup({ scopeReady });
    expect(await (await fixture.run()).json()).toMatchObject({ code: 'company_scope_not_ready', invite_email_sent: false });
    expect(fixture.service.auth.admin.listUsers).not.toHaveBeenCalled();
    expect(fixture.service.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    expect(fixture.writes).toEqual([]);
  });
  it('sends one-time invitation with no password and inserts only canonical membership', async () => {
    const fixture = setup(); const response = await fixture.run(); const result = await response.json();
    expect(result).toMatchObject({ success: true, code: 'invited', invite_email_sent: true, access_setup_required: true, user_id: 'auth-user' });
    expect(fixture.service.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(baseBody.email, { data: { full_name: baseBody.full_name }, redirectTo: 'https://myuno.app/auth/setup-password' });
    expect(fixture.writes).toEqual([{ table: 'management_company_members', payload: { company_id: companyId, user_id: 'auth-user', role: 'staff', is_active: true } }]);
    expect(fixture.calls).not.toContain('profiles'); expect(fixture.calls).not.toContain('staff_members'); expect(fixture.calls).not.toContain('user_roles');
    expect(JSON.stringify(result)).not.toMatch(/password|token|credentials/i);
  });
  it('existing confirmed account uses actual Auth ID without sending/resetting credentials', async () => {
    const fixture = setup({ account }); const result = await (await fixture.run()).json();
    expect(result).toMatchObject({ success: true, code: 'existing_account_added', invite_email_sent: false, user_id: account.id });
    expect(fixture.service.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    expect(fixture.writes[0].payload).toMatchObject({ user_id: account.id });
  });
  it('paginates Auth lookup beyond first page', async () => {
    const fixture = setup(); fixture.service.auth.admin.listUsers
      .mockResolvedValueOnce({ data: { users: Array.from({ length: 1000 }, (_, i) => ({ id: `other-${i}`, email: `other-${i}@example.test` })) }, error: null })
      .mockResolvedValueOnce({ data: { users: [account] }, error: null });
    expect((await (await fixture.run()).json()).user_id).toBe(account.id);
    expect(fixture.service.auth.admin.listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
  });
  it('preserves existing membership role and permissions on repeat', async () => {
    const fixture = setup({ account, member: { id: 'existing-member', role: 'manager', is_active: true } });
    expect(await (await fixture.run()).json()).toMatchObject({ code: 'already_member', membership_status: 'preserved', role: 'manager', invite_email_sent: false });
    expect(fixture.writes).toEqual([]); expect(fixture.service.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
  it.each([
    { member: { id: 'inactive', role: 'staff', is_active: false }, code: 'membership_inactive' },
    { permissions: [{ module: 'finance' }], code: 'access_review_required' },
  ])('does not silently activate existing rights: $code', async options => {
    const fixture = setup({ account, ...options });
    expect(await (await fixture.run()).json()).toMatchObject({ code: options.code, invite_email_sent: false });
    expect(fixture.writes).toEqual([]); expect(fixture.service.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
  it('unconfirmed existing account must finish original link without metadata overwrite', async () => {
    const fixture = setup({ account: { id: account.id, email: account.email } });
    expect(await (await fixture.run()).json()).toMatchObject({ code: 'account_confirmation_pending' });
    expect(fixture.writes).toEqual([]); expect(fixture.service.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
  it('reports emailed-but-membership-incomplete instead of false success', async () => {
    const fixture = setup({ memberError: true }); const response = await fixture.run();
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ success: false, invite_email_sent: true, membership_status: 'incomplete' });
  });
  it('transport uncertainty never claims that no email was sent or exposes SDK error', async () => {
    const fixture = setup(); fixture.service.auth.admin.inviteUserByEmail.mockRejectedValue(new Error('private-token-secret'));
    const response = await fixture.run(); const text = await response.text();
    expect(JSON.parse(text)).toMatchObject({ success: false, invite_email_sent: null });
    expect(text).not.toContain('private-token-secret'); expect(fixture.writes).toEqual([]);
  });
  it.each([{ lookupError: true }, { companyMissing: true }])('lookup failure sends nothing %#', async options => {
    const fixture = setup(options); expect((await fixture.run()).ok).toBe(false);
    expect(fixture.service.auth.admin.inviteUserByEmail).not.toHaveBeenCalled(); expect(fixture.writes).toEqual([]);
  });
  it('rejects whitespace-corrupted email instead of silently changing recipient', async () => {
    const fixture = setup(); expect((await fixture.run({ ...baseBody, email: 'employee @example.test' })).status).toBe(400);
  });
  it('rejects non-POST before authentication', async () => {
    const fixture = setup(); expect((await fixture.run(baseBody, 'GET')).status).toBe(405); expect(fixture.deps.authenticate).not.toHaveBeenCalled();
  });
});
