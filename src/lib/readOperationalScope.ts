import { supabase } from '@/integrations/supabase/client';

/** Read-only server authority; no client-supplied actor and no runtime consumers in E2. */
export async function readOperationalScope(companyId: string, requestedSpaceId: string | null, signal: AbortSignal): Promise<unknown> {
  const { data, error } = await supabase.rpc('resolve_operational_scope', {
    p_company_id: companyId, p_requested_space_id: requestedSpaceId ?? undefined,
  }).abortSignal(signal);
  if (error) throw error;
  return data;
}