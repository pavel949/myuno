/**
 * useUnifiedContact — read identity-linked records across the 3 CRMs.
 *
 * Stage 2 of the CRM consolidation. Returns, for a given source row
 * (e.g. an MC `crm_contacts` row), the identity_id and the list of
 * sibling pipelines the same person is also present in.
 *
 * Zero risk: the hook only SELECTs from the new identity tables —
 * never mutates anything in crm_contacts / capital_contacts /
 * vendor_prospects. RLS on `v_unified_contacts` is `SECURITY INVOKER`,
 * so MC sees only its own crm rows, Capital agents see only their own
 * capital rows, etc.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CrmSourceTable = 'crm_contacts' | 'capital_contacts' | 'vendor_prospects';

export interface UnifiedContactInfo {
  identityId: string;
  displayName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  primaryUserId: string | null;
  /** All pipelines this person appears in. */
  pipelines: CrmSourceTable[];
  /** Other pipelines (excluding the one we queried from). */
  otherPipelines: CrmSourceTable[];
  /** Map from pipeline → row id in that pipeline's table. */
  sourceIds: Partial<Record<CrmSourceTable, string>>;
}

/**
 * Look up identity info for a given source-table row.
 * Returns `null` while loading and a result (or null) once resolved.
 */
export function useUnifiedContact(sourceTable: CrmSourceTable | null, sourceId: string | null) {
  return useQuery<UnifiedContactInfo | null>({
    queryKey: ['unified-contact', sourceTable, sourceId],
    enabled: !!sourceTable && !!sourceId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!sourceTable || !sourceId) return null;

      // 1. Find the identity_id for this source row.
      const { data: link, error: linkErr } = await supabase
        .from('contact_identity_links' as never)
        .select('identity_id')
        .eq('source_table', sourceTable)
        .eq('source_id', sourceId)
        .maybeSingle() as { data: { identity_id: string } | null; error: { message: string } | null };

      if (linkErr || !link) return null;

      // 2. Fetch the unified view row for that identity.
      const { data: row, error: rowErr } = await supabase
        .from('v_unified_contacts' as never)
        .select('*')
        .eq('identity_id', link.identity_id)
        .maybeSingle() as {
          data: {
            identity_id: string;
            display_name: string | null;
            primary_email: string | null;
            primary_phone: string | null;
            primary_user_id: string | null;
            pipelines: CrmSourceTable[] | null;
            source_ids: Partial<Record<CrmSourceTable, string>> | null;
          } | null;
          error: { message: string } | null;
        };

      if (rowErr || !row) return null;

      const pipelines = (row.pipelines ?? []).filter(Boolean) as CrmSourceTable[];
      return {
        identityId: row.identity_id,
        displayName: row.display_name,
        primaryEmail: row.primary_email,
        primaryPhone: row.primary_phone,
        primaryUserId: row.primary_user_id,
        pipelines,
        otherPipelines: pipelines.filter((p) => p !== sourceTable),
        sourceIds: row.source_ids ?? {},
      };
    },
  });
}
