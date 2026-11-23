import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';

export interface AdminCrmStats {
  vendors: { total: number; active: number; won: number; conversionRate: number };
  owners: { total: number; interested: number; converted: number };
  totalLeads: number;
  activeLeads: number;
  overallConversion: number;
}

const VENDOR_CLOSED = ['won', 'lost', 'not_interested'];
const VENDOR_UNTOUCHED = ['new', 'researching'];
const OWNER_CLOSED = ['converted', 'lost'];

/** Unwrap a head-only count query; errors must surface, not render as zeros. */
function countOf(res: { count: number | null; error: unknown }): number {
  if (res.error) throw res.error;
  return res.count ?? 0;
}

/**
 * KPI counts for the admin acquisition CRM.
 *
 * Uses server-side `count: 'exact', head: true` queries instead of downloading
 * every row: the previous version fetched all statuses and counted client-side,
 * which silently capped at PostgREST's 1000-row default and turned query errors
 * into a dashboard full of zeros.
 */
export function useAdminCrmStats() {
  return useQuery({
    queryKey: ['admin-crm-stats'],
    queryFn: async (): Promise<AdminCrmStats> => {
      const vendorCount = () => supabase.from('vendor_prospects').select('id', { count: 'exact', head: true });
      const ownerCount = () => typedFrom('owner_prospects').select('id', { count: 'exact', head: true });
      const notIn = (values: string[]) => `(${values.join(',')})`;

      const [vTotal, vWon, vActive, vContacted, oTotal, oInterested, oConverted, oActive] = await Promise.all([
        vendorCount(),
        vendorCount().eq('status', 'won'),
        vendorCount().not('status', 'in', notIn(VENDOR_CLOSED)),
        vendorCount().not('status', 'in', notIn(VENDOR_UNTOUCHED)),
        ownerCount(),
        ownerCount().eq('status', 'interested'),
        ownerCount().eq('status', 'converted'),
        ownerCount().not('status', 'in', notIn(OWNER_CLOSED)),
      ]);

      const vendorsTotal = countOf(vTotal);
      const vendorsWon = countOf(vWon);
      const vendorsActive = countOf(vActive);
      const vendorsContacted = countOf(vContacted);
      const ownersTotal = countOf(oTotal);
      const ownersInterested = countOf(oInterested);
      const ownersConverted = countOf(oConverted);
      const ownersActive = countOf(oActive);

      const totalLeads = vendorsTotal + ownersTotal;
      const totalConverted = vendorsWon + ownersConverted;

      return {
        vendors: {
          total: vendorsTotal,
          active: vendorsActive,
          won: vendorsWon,
          conversionRate: vendorsContacted > 0 ? Math.round((vendorsWon / vendorsContacted) * 100) : 0,
        },
        owners: { total: ownersTotal, interested: ownersInterested, converted: ownersConverted },
        totalLeads,
        activeLeads: vendorsActive + ownersActive,
        overallConversion: totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0,
      };
    },
    staleTime: 30_000,
  });
}
