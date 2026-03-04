/**
 * @module getAccessiblePropertyIds
 * @description Single source of truth for determining which properties
 * a user can access, factoring in ownership, delegation, and MC membership.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AccessiblePropertyIdsInput {
  userId: string;
  activeCompanyId: string | null;
}

export interface AccessiblePropertyIdsResult {
  ownedIds: string[];
  delegatedIds: string[];
  companyIds: string[];
  allIds: string[];
}

/**
 * Returns all property IDs the user can access:
 * 1. Directly owned (properties.owner_id)
 * 2. Delegated (property_delegates with active status)
 * 3. Company-linked (properties.management_company_id when user is MC member)
 */
export async function getAccessiblePropertyIds(
  input: AccessiblePropertyIdsInput,
): Promise<AccessiblePropertyIdsResult> {
  const { userId, activeCompanyId } = input;

  // Fire ALL queries in parallel (including company)
  const [ownedRes, delegatedRes, companyRes] = await Promise.all([
    // 1. Owned properties
    supabase.from('properties').select('id').eq('owner_id', userId),
    // 2. Delegated properties
    supabase.from('property_delegates').select('property_id').eq('user_id', userId).eq('status', 'active'),
    // 3. Company properties (noop if no activeCompanyId)
    activeCompanyId
      ? supabase.from('properties').select('id').eq('management_company_id', activeCompanyId)
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
  ]);

  const ownedIds = (ownedRes.data || []).map(p => p.id);
  const delegatedIds = (delegatedRes.data || []).map((d: any) => d.property_id as string);
  const companyIds = (companyRes.data || []).map((p: any) => p.id as string);

  const allIds = [...new Set([...ownedIds, ...delegatedIds, ...companyIds])];

  return { ownedIds: [...new Set(ownedIds)], delegatedIds, companyIds: [...new Set(companyIds)], allIds };
}

/**
 * Hook-friendly version: returns accessible property IDs using
 * the same logic, for use in React Query queryFn callbacks.
 * 
 * @deprecated Use getAccessiblePropertyIds({ userId, activeCompanyId }) directly
 */
export async function getAccessiblePropertyIdsLegacy(userId: string): Promise<string[]> {
  const result = await getAccessiblePropertyIds({ userId, activeCompanyId: null });
  return result.allIds;
}
