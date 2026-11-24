import { supabase } from '@/integrations/supabase/client';

// Narrow additive RPC contract; generated types stay untouched until approved schema activation.
type MembershipRpc = { rpc(name: 'manage_uno_team_membership_checked', args: { p_user_id: string; p_grant: boolean }): PromiseLike<{ data: unknown; error: { message: string } | null }> };
export async function changeUnoTeamMembership(userId: string, grant: boolean): Promise<void> {
  const { data, error } = await (supabase as unknown as MembershipRpc).rpc('manage_uno_team_membership_checked', { p_user_id: userId, p_grant: grant });
  if (error) throw new Error(error.message);
  const receipt = data as { success?: boolean; uno_team?: boolean } | null;
  if (receipt?.success !== true || receipt.uno_team !== grant) throw new Error('Membership change not confirmed');
}
