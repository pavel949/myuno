import type { SupabaseClient, User } from '../_shared/supabase.ts';

const ROLES = new Set(['manager', 'accountant', 'staff']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

interface Dependencies {
  authenticate: (req: Request) => Promise<{ user: { id: string } } | Response>;
  actorClient: (req: Request) => SupabaseClient;
  serviceClient: () => SupabaseClient;
  enabled: boolean;
  appUrl: string;
}

// Invitation delivery and database provisioning are separate external operations.
// Never pretend their partial completion is an atomic success or retry a send here.
export async function handleTeamInvitation(req: Request, headers: Record<string, string>, deps: Dependencies) {
  const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...headers, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let emailSent: boolean | null = false;
  let userId: string | undefined;
  try {
    const auth = await deps.authenticate(req);
    if (auth instanceof Response) return auth;
    const body = await req.json().catch(() => null);
    const companyId = typeof body?.company_id === 'string' ? body.company_id : '';
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = typeof body?.role === 'string' ? body.role : '';
    if (!UUID.test(companyId) || !fullName || fullName.length > 160 || email.length > 254 || !EMAIL.test(email) || !ROLES.has(role)) {
      return json({ error: 'Valid company, name, email and manager/accountant/staff role required', code: 'invalid_invitation' }, 400);
    }
    // Includes only verified platform admin or active director/admin of this company.
    // Generic uno_team and client role/metadata never authorize this endpoint.
    const { data: allowed, error: accessError } = await deps.actorClient(req)
      .rpc('actor_is_operating_company_overseer', { _company_id: companyId });
    if (accessError || allowed !== true) return json({ error: 'Insufficient permissions', code: 'forbidden' }, 403);
    if (!deps.enabled) return json({ error: 'Secure employee invitations await activation', code: 'invitation_not_enabled' }, 503);
    const appUrl = new URL(deps.appUrl);
    if (appUrl.protocol !== 'https:') return json({ error: 'Invitation redirect unavailable', code: 'redirect_unavailable' }, 503);
    const admin = deps.serviceClient();
    const { data: company, error: companyError } = await admin.from('management_companies').select('id, operating_spaces_enforced').eq('id', companyId).maybeSingle();
    if (companyError || !company) return json({ error: 'Company unavailable', code: 'company_unavailable' }, 409);

    if (company.operating_spaces_enforced !== true) return json({ success: false, error: 'Company scope isolation awaits an approved security cutover. No invitation sent.', code: 'company_scope_not_ready', invite_email_sent: false, membership_status: 'not_changed' }, 409);

    // Auth is the only identity authority. Never equate staff_members.id, a name,
    // or a profile email with auth.users.id. Pagination prevents a first-page miss.
    let account: { id: string; email_confirmed_at?: string | null } | undefined;
    const perPage = 1000;
    for (let page = 1; ; page++) {
      if (page > 100) return json({ error: 'Account lookup incomplete; no invitation sent', code: 'account_lookup_incomplete' }, 503);
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) return json({ error: 'Account lookup unavailable; no invitation sent', code: 'account_lookup_failed' }, 503);
      // Normalize the SDK's User[] | [] result without a cast. With the app's
      // non-strict null setting, find on that union can infer a never callback.
      const users: User[] = data.users;
      account = users.find(user => user.email?.toLowerCase() === email);
      if (account || users.length < perPage) break;
    }
    if (account) {
      userId = account.id;
      const { data: member, error } = await admin.from('management_company_members')
        .select('id, role, is_active').eq('company_id', companyId).eq('user_id', userId).maybeSingle();
      if (error) return json({ error: 'Membership lookup failed; no changes made', code: 'membership_lookup_failed' }, 503);
      if (member) {
        if (member.is_active !== true) return json({ error: 'Existing membership is inactive. Review access before reactivation.', code: 'membership_inactive', invite_email_sent: false }, 409);
        return json({ success: true, code: 'already_member', user_id: userId, member_id: member.id,
          role: member.role, invite_email_sent: false, membership_status: 'preserved', access_setup_required: true });
      }
      const { data: permissions, error: permissionsError } = await admin.from('team_member_permissions')
        .select('module').eq('company_id', companyId).eq('user_id', userId).limit(1);
      if (permissionsError || permissions?.length) return json({ error: 'Existing permissions require administrator review before adding membership', code: 'access_review_required', invite_email_sent: false }, 409);
      // An unconfirmed existing identity must finish its original Auth flow. Do
      // not overwrite metadata or silently resend/reset another account's login.
      if (!account.email_confirmed_at) return json({ error: 'This account has an unfinished invitation or signup. Complete the original email link, then retry.', code: 'account_confirmation_pending', invite_email_sent: false }, 409);
    } else {
      // Unknown until the Auth call returns. A transport failure can occur after
      // SMTP accepted the message, so do not claim no email was sent in that case.
      emailSent = null;
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: new URL('/auth/setup-password', appUrl.origin).toString(),
      });
      if (error || !data?.user?.id) return json({ success: false, error: 'Invitation delivery was not confirmed. Check the account before retrying.',
        code: 'invite_unconfirmed', invite_email_sent: null, membership_status: 'not_created', access_setup_required: true }, 502);
      userId = data.user.id;
      emailSent = true;
    }
    // Insert only. A duplicate/concurrent/inactive membership is never overwritten.
    // No global role, default module permission, profile, HR row or Space grant.
    const { data: member, error: memberError } = await admin.from('management_company_members')
      .insert({ company_id: companyId, user_id: userId, role, is_active: true }).select('id').single();
    if (memberError || !member) return json({ success: false, code: 'membership_incomplete',
      error: emailSent ? 'Invitation sent, but company membership was not completed. Review the account before retrying.' : 'Existing account found, but company membership was not completed.',
      user_id: userId, invite_email_sent: emailSent, membership_status: 'incomplete', access_setup_required: true }, 409);
    return json({ success: true, code: emailSent ? 'invited' : 'existing_account_added', user_id: userId,
      member_id: member.id, role, invite_email_sent: emailSent, membership_status: 'created', access_setup_required: true });
  } catch {
    // Never serialize SDK/Auth errors: they may contain credentials or private data.
    return json({ success: false, error: 'Invitation could not be completed. Check account and membership state before retrying.',
      code: 'invitation_incomplete', user_id: userId, invite_email_sent: emailSent,
      membership_status: 'unknown', access_setup_required: true }, 500);
  }
}
