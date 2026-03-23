/**
 * Owner management fee % — per-owner configurable commission.
 * Used when property_management_terms.commission_rate is null.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { untypedTables } from '@/lib/untypedTables';

export interface OwnerManagementSettingsRow {
  id: string;
  contact_id: string;
  company_id: string;
  management_fee_percent: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_FEE_PERCENT = 15;

/** Fetch owner management settings for a contact in a company */
export function useOwnerManagementSettings(contactId: string | undefined, companyId: string | undefined) {
  return useQuery({
    queryKey: ['owner-management-settings', contactId, companyId],
    queryFn: async (): Promise<OwnerManagementSettingsRow | null> => {
      if (!contactId || !companyId) return null;
      const { data, error } = await untypedTables.ownerManagementSettings()
        .select('id, contact_id, company_id, management_fee_percent, created_at, updated_at')
        .eq('contact_id', contactId)
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data as OwnerManagementSettingsRow | null;
    },
    enabled: !!contactId && !!companyId,
  });
}

/** Upsert owner management settings */
export function useUpsertOwnerManagementSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      companyId,
      management_fee_percent,
    }: {
      contactId: string;
      companyId: string;
      management_fee_percent: number;
    }) => {
      const { data, error } = await untypedTables.ownerManagementSettings()
        .upsert(
          {
            contact_id: contactId,
            company_id: companyId,
            management_fee_percent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'contact_id,company_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as OwnerManagementSettingsRow;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['owner-management-settings', vars.contactId, vars.companyId] });
    },
  });
}

export { DEFAULT_FEE_PERCENT };
