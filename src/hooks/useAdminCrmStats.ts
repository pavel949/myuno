import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';

export interface AdminCrmStats {
  vendors: { total: number; active: number; won: number; conversionRate: number };
  users: { total: number; hot: number; converted: number };
  owners: { total: number; interested: number; converted: number };
  totalLeads: number;
  activeLeads: number;
  overallConversion: number;
}

export function useAdminCrmStats() {
  return useQuery({
    queryKey: ['admin-crm-stats'],
    queryFn: async (): Promise<AdminCrmStats> => {
      const [vendorRes, ownerRes] = await Promise.all([
        supabase.from('vendor_prospects').select('status'),
        typedFrom('owner_prospects').select('status'),
      ]);

      const vendors = (vendorRes.data || []) as { status: string }[];
      const owners = (ownerRes.data || []) as { status: string }[];

      const vWon = vendors.filter(v => v.status === 'won').length;
      const vActive = vendors.filter(v => !['won', 'lost', 'not_interested'].includes(v.status)).length;
      const vContacted = vendors.filter(v => !['new', 'researching'].includes(v.status)).length;

      const oInterested = owners.filter(o => o.status === 'interested').length;
      const oConverted = owners.filter(o => o.status === 'converted').length;

      const totalLeads = vendors.length + owners.length;
      const totalConverted = vWon + oConverted;
      const activeLeads = vActive + owners.filter(o => !['converted', 'lost'].includes(o.status)).length;

      return {
        vendors: { total: vendors.length, active: vActive, won: vWon, conversionRate: vContacted > 0 ? Math.round((vWon / vContacted) * 100) : 0 },
        users: { total: 0, hot: 0, converted: 0 },
        owners: { total: owners.length, interested: oInterested, converted: oConverted },
        totalLeads,
        activeLeads,
        overallConversion: totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0,
      };
    },
    staleTime: 30_000,
  });
}
