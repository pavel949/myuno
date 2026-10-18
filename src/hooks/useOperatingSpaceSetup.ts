import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SCOPE_CACHE_PREFIX } from '@/lib/operationalScope';
import { parseOperatingSpaceSetup, type SpaceCommand } from '@/lib/operatingSpaceSetup';

// Narrow adapter for additive checked RPCs; generated database types precede the operating-space setup migration.
// This changes TypeScript metadata only. Actor and company authorization remain server-side.
type SetupRpcArgs = {
  get_operating_space_setup: { p_company_id: string };
  save_operating_space_checked: {
    p_company_id: string; p_space_id: string | null; p_key: string;
    p_name_en: string; p_name_ru: string; p_is_active: boolean;
  };
  set_operating_space_member_checked: {
    p_company_id: string; p_space_id: string; p_company_member_id: string; p_is_active: boolean;
  };
  assign_operating_space_properties_checked: {
    p_company_id: string; p_space_id: string; p_property_ids: string[]; p_reason: string;
  };
};
const rpc = supabase.rpc.bind(supabase) as unknown as <Name extends keyof SetupRpcArgs>(
  name: Name, args: SetupRpcArgs[Name],
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export const spaceSetupKey = (actor: string | undefined, companyId: string) =>
  ['operating-space-setup', actor, companyId] as const;

export async function readOperatingSpaceSetup(companyId: string) {
  const { data, error } = await rpc('get_operating_space_setup', { p_company_id: companyId });
  if (error) throw new Error(error.message);
  return parseOperatingSpaceSetup(data);
}

export function useOperatingSpaceSetup(companyId: string) {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = spaceSetupKey(user?.id, companyId);
  const query = useQuery({
    queryKey, enabled: Boolean(user && companyId),
    queryFn: () => readOperatingSpaceSetup(companyId),
  });
  const change = useMutation({
    mutationFn: async (command: SpaceCommand) => {
      if (!user || !companyId) throw new Error('Authentication and company are required');
      let savedId: string | null = null;
      if (command.type === 'save') {
        const space = command.space;
        const { data, error } = await rpc('save_operating_space_checked', {
          p_company_id: companyId, p_space_id: space.id ?? null, p_key: space.key,
          p_name_en: space.name_en, p_name_ru: space.name_ru, p_is_active: space.is_active,
        });
        if (error) throw new Error(error.message);
        if (typeof data !== 'string' || (space.id && data !== space.id)) throw new Error('Space save was not confirmed');
        savedId = data;
      } else if (command.type === 'grant') {
        const { error } = await rpc('set_operating_space_member_checked', {
          p_company_id: companyId, p_space_id: command.spaceId,
          p_company_member_id: command.memberId, p_is_active: command.active,
        });
        if (error) throw new Error(error.message);
      } else {
        if (!command.propertyIds.length || !command.reason.trim()) throw new Error('Select properties and provide a reason');
        const { error } = await rpc('assign_operating_space_properties_checked', {
          p_company_id: companyId, p_space_id: command.spaceId,
          p_property_ids: command.propertyIds, p_reason: command.reason.trim(),
        });
        if (error) throw new Error(error.message);
      }
      // Void RPC results are not persistence evidence: read back and verify the requested change.
      const fresh = await readOperatingSpaceSetup(companyId);
      if (command.type === 'save') {
        const row = fresh.spaces.find(space => space.id === savedId);
        if (!row || row.key !== command.space.key || row.name_en !== command.space.name_en ||
            row.name_ru !== command.space.name_ru || row.is_active !== command.space.is_active) {
          throw new Error('Space save was not confirmed');
        }
      } else if (command.type === 'grant') {
        if (!fresh.grants.some(row => row.operating_space_id === command.spaceId &&
            row.company_member_id === command.memberId && row.is_active === command.active)) {
          throw new Error('Member change was not confirmed');
        }
      } else if (command.propertyIds.some(id => !fresh.assignments.some(row =>
        row.property_id === id && row.operating_space_id === command.spaceId))) {
        throw new Error('Property assignment was not confirmed');
      }
      return fresh;
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: [SCOPE_CACHE_PREFIX, user?.id, companyId] }),
      ]);
    },
  });
  return { ...query, change };
}

