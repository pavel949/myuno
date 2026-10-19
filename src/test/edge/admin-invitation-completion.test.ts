import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createServiceClient: vi.fn(), requireAuth: vi.fn(), requireActorRpc: vi.fn() }));
vi.mock('../../../supabase/functions/_shared/supabase.ts', () => ({ createServiceClient: mocks.createServiceClient }));
vi.mock('../../../supabase/functions/_shared/auth-guard.ts', () => ({ requireAuth: mocks.requireAuth }));
vi.mock('../../../supabase/functions/_shared/authz.ts', () => ({ requireActorRpc: mocks.requireActorRpc }));
vi.mock('../../../supabase/functions/_shared/cors.ts', () => ({ getCorsHeaders: () => ({}) }));
let handler: (req: Request) => Promise<Response>;
beforeAll(async () => {
  vi.stubGlobal('Deno', { env: { get: () => undefined }, serve: (callback: typeof handler) => { handler = callback; } });
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); }));
  await import('../../../supabase/functions/admin-invite-user/index');
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => { vi.clearAllMocks(); mocks.requireAuth.mockResolvedValue({ user: { id: 'admin-actor' } }); mocks.requireActorRpc.mockResolvedValue(null); });
function fixture(options: { roleFails?: boolean; missingRole?: boolean; linkFails?: boolean; linkedAlready?: boolean; auditFails?: boolean } = {}) {
  const invite = vi.fn().mockResolvedValue({ data: { user: { id: 'new-auth-id' } }, error: null });
  const writes: string[] = [];
  const from = vi.fn((table: string) => {
    let updating = false;
    const result = () => {
      if (table === 'user_roles') return { data: options.missingRole ? null : { user_id: 'new-auth-id', role: 'staff' }, error: options.roleFails ? new Error('private') : null };
      if (table === 'transfer_operators') return updating ? { data: options.linkFails ? null : { id: 'operator', user_id: 'new-auth-id' }, error: null }
        : { data: { id: 'operator', user_id: options.linkedAlready ? 'other-auth-id' : null }, error: null };
      return { data: null, error: options.auditFails ? new Error('audit failed') : null };
    };
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
      upsert: vi.fn(() => { writes.push(table); return chain; }), update: vi.fn(() => { updating = true; writes.push(table); return chain; }),
      insert: vi.fn(() => { writes.push(table); return Promise.resolve(result()); }), single: vi.fn(async () => result()), maybeSingle: vi.fn(async () => result()),
    };
    return chain;
  });
  mocks.createServiceClient.mockReturnValue({ auth: { admin: { inviteUserByEmail: invite } }, from });
  const run = (operator = false) => handler(new Request('https://synthetic.test/admin-invite', { method: 'POST', body: JSON.stringify({ email: 'synthetic@example.test', full_name: 'Synthetic', role: 'staff', ...(operator ? { transfer_operator_id: 'operator' } : {}) }) }));
  return { invite, writes, run, from };
}
describe('platform invitation partial completion', () => {
  it('denied actor never creates privileged client', async () => {
    const setup = fixture(); mocks.requireActorRpc.mockResolvedValue(new Response(null, { status: 403 }));
    expect((await setup.run()).status).toBe(403); expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });
  it.each([{ roleFails: true }, { missingRole: true }])('role error or zero-row confirmation is partial failure %#', async options => {
    const setup = fixture(options); const response = await setup.run(true);
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ success: false, invite_email_sent: true, role_granted: false });
    expect(setup.writes).not.toContain('transfer_operators');
  });
  it('pre-existing operator link is never overwritten and sends no email', async () => {
    const setup = fixture({ linkedAlready: true }); expect((await setup.run(true)).status).toBe(409);
    expect(setup.invite).not.toHaveBeenCalled(); expect(setup.writes).toEqual([]);
  });
  it('operator zero-row update cannot be reported successful', async () => {
    const setup = fixture({ linkFails: true }); const response = await setup.run(true);
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ success: false, invite_email_sent: true, role_granted: true, transfer_operator_linked: false });
  });
  it('success requires role and requested operator link confirmation', async () => {
    const setup = fixture(); expect(await (await setup.run(true)).json()).toMatchObject({ success: true, role_granted: true, transfer_operator_linked: true, audit_recorded: true });
  });
  it('audit failure is disclosed separately from confirmed invitation and rights', async () => {
    const setup = fixture({ auditFails: true }); expect(await (await setup.run()).json()).toMatchObject({ success: true, role_granted: true, audit_recorded: false });
  });
  it('SDK error is not returned or logged as credentials', async () => {
    const setup = fixture(); setup.invite.mockRejectedValue(new Error('private-token-value'));
    const text = await (await setup.run()).text(); expect(text).not.toContain('private-token-value'); expect(JSON.parse(text)).toMatchObject({ success: false, invite_email_sent: null });
  });
});
