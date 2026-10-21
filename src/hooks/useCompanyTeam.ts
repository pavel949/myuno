import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { readTeamInvitationResult } from '@/lib/teamInvitation';
import { bindCompanyAccessOperation, type BoundCompanyAccessOperation, type CompanyAccessLease, type CompanyAccessLifetime } from '@/lib/companyAccessOperation';
import { useCompanyAccessLifetime } from '@/hooks/useCompanyAccessLifetime';

export const TEAM_ACCESS_ENABLED = import.meta.env.VITE_TEAM_MEMBER_ACCESS_ENABLED === 'true';
export interface CompanyTeamMember { id: string; user_id: string; role: string; is_active: boolean | null; full_name?: string | null; email?: string | null }
export interface TeamSpace { id: string; name_en: string; name_ru: string; is_active: boolean }
export interface TeamSpaceMembership { operating_space_id: string; company_member_id: string; is_active: boolean }
export type CompanyAccessModule = 'properties' | 'pricing' | 'bookings';
export interface CompanyModulePermission { user_id: string; module: CompanyAccessModule; can_view: boolean; can_edit: boolean }

// Reads existing membership and Space authorities. HR records are never joined by
// UUID, name or email. Profile labels are optional, joined only by verified user_id.
export function useCompanyTeam(lifetime: CompanyAccessLifetime) {
  const { actorId, companyId } = lifetime;
  return useQuery({
    queryKey: ['company-team', actorId, companyId],
    enabled: !!actorId && !!companyId,
    queryFn: async ({ signal }) => {
      if (!companyId) throw new Error('Select a company.');
      const lease = lifetime.begin();
      signal.addEventListener('abort', lease.finish, { once: true });
      try {
        const operation = await bindCompanyAccessOperation(lease);
        const { client } = operation;
        operation.assertCurrent();
        const { data: allowed, error: accessError } = await client.rpc('actor_is_operating_company_overseer', { _company_id: companyId });
        operation.assertCurrent();
        if (accessError || allowed !== true) throw new Error('Company access management is unavailable or not permitted.');
        const [members, spaces, assignments, permissions, company] = await Promise.all([
          client.from('management_company_members').select('id, user_id, role, is_active').eq('company_id', companyId).order('created_at'),
          client.from('operating_spaces').select('id, name_en, name_ru, is_active').eq('management_company_id', companyId),
          client.from('operating_space_members').select('operating_space_id, company_member_id, is_active').eq('management_company_id', companyId),
          client.from('team_member_permissions').select('user_id, module, can_view, can_edit').eq('company_id', companyId).in('module', ['properties', 'pricing', 'bookings']),
          client.from('management_companies').select('operating_spaces_enforced').eq('id', companyId).single(),
        ]);
        operation.assertCurrent();
        if ([members, spaces, assignments, permissions, company].some(result => result.error)) throw new Error('Access data could not be verified. No changes are available.');
        const rows = (members.data || []) as CompanyTeamMember[];
        const profiles = rows.length ? await client.from('profiles').select('id, full_name, email').in('id', rows.map(member => member.user_id)) : { data: [], error: null };
        operation.assertCurrent();
        const labels = new Map((profiles.data || []).map(profile => [profile.id, profile]));
        return {
          members: rows.map(member => ({ ...member, full_name: labels.get(member.user_id)?.full_name, email: labels.get(member.user_id)?.email })),
          spaces: (spaces.data || []) as TeamSpace[],
          assignments: (assignments.data || []) as TeamSpaceMembership[],
          permissions: (permissions.data || []) as CompanyModulePermission[],
          spacesEnforced: company.data?.operating_spaces_enforced === true,
        };
      } finally { signal.removeEventListener('abort', lease.finish); lease.finish(); }
    },
  });
}

export function useCompanyAccessContext() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useCompanyAccessLifetime(user?.id, activeCompany?.company_id);
}

export async function inviteCompanyMember(operation: BoundCompanyAccessOperation, input: { full_name: string; email: string; role: string }) {
  operation.assertCurrent();
  const { data, error } = await operation.client.functions.invoke('invite-team-member', { body: { ...input, company_id: operation.companyId } });
  operation.assertCurrent();
  const result = await readTeamInvitationResult(data, error);
  operation.assertCurrent();
  return result;
}

export function useInviteCompanyMember(lifetime: CompanyAccessLifetime) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ input, lease }: { input: { full_name: string; email: string; role: string }; lease: CompanyAccessLease }) => {
      if (!TEAM_ACCESS_ENABLED) throw new Error('Secure employee access awaits activation.');
      const operation = await bindCompanyAccessOperation(lease);
      const result = await inviteCompanyMember(operation, input);
      operation.assertCurrent();
      await qc.invalidateQueries({ queryKey: ['company-team', operation.actorId, operation.companyId] });
      operation.assertCurrent();
      return result;
    },
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: async (input: { full_name: string; email: string; role: string }) => {
      // Capture at the user action, before React Query's asynchronous callbacks.
      // Updating observer options on rerender must never retarget an old action.
      const lease = lifetime.begin();
      try { return await mutation.mutateAsync({ input, lease }); }
      finally { lease.finish(); }
    },
  };
}

type AccessChange = { memberId: string } & (
  { kind: 'space'; spaceId: string; active: boolean } |
  { kind: 'module'; module: CompanyAccessModule; capability: 'view' | 'edit'; enabled: boolean }
);

// Source-only activation is separate from deployment. All authority is rechecked
// by the actor-bound RPC and final table RLS; no service-role browser client.
export async function changeCompanyMemberAccess(operation: BoundCompanyAccessOperation, change: AccessChange) {
  const { client, actorId, companyId } = operation;
  operation.assertCurrent();
  const { data: allowed, error: accessError } = await client.rpc('actor_is_operating_company_overseer', { _company_id: companyId });
  operation.assertCurrent();
  if (accessError || allowed !== true) throw new Error('Company access management is unavailable or not permitted.');
  const { data: member, error } = await client.from('management_company_members')
    .select('id, user_id, role, is_active').eq('id', change.memberId).eq('company_id', companyId).single();
  operation.assertCurrent();
  if (error || !member || member.is_active !== true || ['director', 'admin'].includes(member.role)) {
    throw new Error('Select an active non-administrator company member.');
  }
  // Grants require the company's approved isolation cutover. Revocations remain
  // possible without enabling isolation or expanding an existing role.
  if (change.kind === 'space' ? change.active : change.enabled) {
    const { data: scope, error: scopeError } = await client.from('management_companies')
      .select('operating_spaces_enforced').eq('id', companyId).single();
    operation.assertCurrent();
    if (scopeError || scope?.operating_spaces_enforced !== true) throw new Error('Company scope isolation awaits an approved security cutover.');
  }
  if (change.kind === 'space') {
    const { data: space, error: spaceError } = await client.from('operating_spaces')
      .select('id, is_active').eq('id', change.spaceId).eq('management_company_id', companyId).single();
    operation.assertCurrent();
    if (spaceError || !space || (change.active && space.is_active !== true)) throw new Error('Active company Operating Space required.');
    const { data, error: saveError } = await client.from('operating_space_members').upsert({
      company_member_id: member.id, management_company_id: companyId, operating_space_id: space.id,
      is_active: change.active, granted_by: actorId, granted_at: new Date().toISOString(),
    }, { onConflict: 'operating_space_id,company_member_id' }).select('company_member_id, operating_space_id, is_active').single();
    operation.assertCurrent();
    if (saveError || !data || data.company_member_id !== member.id || data.operating_space_id !== space.id || data.is_active !== change.active) throw new Error('Space assignment was not confirmed. Refresh before retrying.');
  } else {
    if (!['properties', 'pricing', 'bookings'].includes(change.module)) throw new Error('Unsupported module.');
    // Updating only these flags avoids overwriting concurrent sub/export changes.
    const { data: current, error: readError } = await client.from('team_member_permissions').select('user_id')
      .eq('company_id', companyId).eq('user_id', member.user_id).eq('module', change.module).maybeSingle();
    operation.assertCurrent();
    if (readError) throw new Error('Current permissions could not be verified.');
    // A revocation never copies stale UI flags back as grants. Edit removal
    // touches only edit; view removal clears both. Edit grant explicitly adds view.
    const permissions = change.capability === 'view'
      ? change.enabled ? { can_view: true } : { can_view: false, can_edit: false }
      : change.enabled ? { can_view: true, can_edit: true } : { can_edit: false };
    const flags = { ...permissions, granted_by: actorId, updated_at: new Date().toISOString() };
    operation.assertCurrent();
    const write = current
      ? client.from('team_member_permissions').update(flags).eq('company_id', companyId).eq('user_id', member.user_id).eq('module', change.module)
      : client.from('team_member_permissions').insert({
        can_view: false, can_edit: false, ...flags, company_id: companyId, user_id: member.user_id, module: change.module, can_export: false, sub_permissions: {},
      });
    const { data, error: saveError } = await write.select('user_id, can_view, can_edit').single();
    operation.assertCurrent();
    if (saveError || !data || data.user_id !== member.user_id || Object.entries(permissions).some(([key, value]) => data[key] !== value)) throw new Error('Module permissions were not confirmed. Refresh before retrying.');
  }
}

export function useChangeCompanyMemberAccess(lifetime: CompanyAccessLifetime) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ change, lease }: { change: AccessChange; lease: CompanyAccessLease }) => {
      if (!TEAM_ACCESS_ENABLED) throw new Error('Employee access changes await activation.');
      const operation = await bindCompanyAccessOperation(lease);
      await changeCompanyMemberAccess(operation, change);
      operation.assertCurrent();
      await Promise.all(['company-team', 'team-permissions', 'member-permissions', 'operational-scope'].map(key => qc.invalidateQueries({ queryKey: [key] })));
      operation.assertCurrent();
    },
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: async (change: AccessChange) => {
      const lease = lifetime.begin();
      try { await mutation.mutateAsync({ change, lease }); }
      finally { lease.finish(); }
    },
  };
}
