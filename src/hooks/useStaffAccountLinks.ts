import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface StaffAccountMember { id: string; user_id: string; name: string; email: string | null }
export interface StaffAccountLink { staff_member_id: string; company_member_id: string; user_id: string }
interface StaffAccountMutationResult { staff_member_id: string; company_member_id: string | null; user_id: string | null }
export interface StaffAccountSetup { members: StaffAccountMember[]; links: StaffAccountLink[] }
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
function parseSetup(value: unknown): StaffAccountSetup {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Account setup unavailable');
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.members) || !Array.isArray(data.links)) throw Error('Account setup unavailable');
  const members = new Map<string, StaffAccountMember>();
  const users = new Set<string>();
  for (const value of data.members) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Account setup unavailable');
    const row = value as Record<string, unknown>;
    if (!nonempty(row.id) || !nonempty(row.user_id) || !nonempty(row.name)
      || !(row.email === null || nonempty(row.email)) || members.has(row.id) || users.has(row.user_id)) {
      throw Error('Account setup unavailable');
    }
    members.set(row.id, { id: row.id, user_id: row.user_id, name: row.name, email: row.email });
    users.add(row.user_id);
  }
  const staffIds = new Set<string>();
  const linkedMembers = new Set<string>();
  const links: StaffAccountLink[] = [];
  for (const value of data.links) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Account setup unavailable');
    const row = value as Record<string, unknown>;
    if (!nonempty(row.staff_member_id) || !nonempty(row.company_member_id) || !nonempty(row.user_id)
      || members.get(row.company_member_id)?.user_id !== row.user_id
      || staffIds.has(row.staff_member_id) || linkedMembers.has(row.company_member_id)) {
      throw Error('Account setup unavailable');
    }
    staffIds.add(row.staff_member_id); linkedMembers.add(row.company_member_id);
    links.push({ staff_member_id: row.staff_member_id, company_member_id: row.company_member_id, user_id: row.user_id });
  }
  return { members: [...members.values()], links };
}
// Narrow adapter for additive checked RPCs until generated types are refreshed.
function rpc<T>(name: string, args: Record<string, unknown>) {
  const invoke = supabase.rpc.bind(supabase) as unknown as <R>(name: string, args: Record<string, unknown>) => PromiseLike<{ data: R | null; error: Error | null }>;
  return invoke<T>(name, args);
}

export function useStaffAccountSetup(enabled = false) {
  const { user } = useAuth();
  const { activeCompany, isError: companyError } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  return useQuery({
    queryKey: ['staff-account-setup', user?.id, companyId],
    enabled: enabled && !!user && !!companyId && !companyError,
    staleTime: 0,
    queryFn: async () => {
      if (!user || !companyId || companyError) throw Error('Company unavailable');
      const { data, error } = await rpc<unknown>('get_staff_account_setup_checked', { p_company_id: companyId });
      if (error) throw error;
      return parseSetup(data);
    },
  });
}

export function useSetStaffAccountLink() {
  const { user } = useAuth();
  const { activeCompany, isError: companyError } = useActiveCompany();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, memberId }: { staffId: string; memberId: string | null }) => {
      const companyId = activeCompany?.company_id;
      if (!user || !companyId || companyError) throw Error('Company unavailable');
      const { data, error } = await rpc<StaffAccountMutationResult>('set_staff_account_link_checked', {
        p_company_id: companyId, p_staff_member_id: staffId, p_company_member_id: memberId,
      });
      if (error) throw error;
      if (!data || data.staff_member_id !== staffId || data.company_member_id !== memberId
        || (memberId !== null ? typeof data.user_id !== 'string' || data.user_id.length === 0 : data.user_id !== null)) {
        throw Error('Account link not confirmed');
      }
      return data;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['staff-account-setup'] }); },
  });
}
