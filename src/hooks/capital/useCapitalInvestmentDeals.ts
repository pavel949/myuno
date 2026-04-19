import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DealPipelineStatus } from '@/lib/investment/dealTaxonomy';

export interface CapitalInvestmentDeal {
  id: string;
  created_at: string;
  status: DealPipelineStatus;
  is_published: boolean;
  deal_intent: string;
  category: string;
  capital_range: string;
  deal_size_midpoint_usd: number;
  expected_value_usd: number;
  platform_fee_estimate_usd: number;
  probability_score: number;
  submitter_name: string;
  submitter_email: string;
  submitter_whatsapp: string | null;
  submitter_company: string | null;
  title_private: string;
  description_private: string | null;
  teaser_public: string | null;
  location_full: string | null;
  location_display: string | null;
  admin_notes: string | null;
  inquiry_count?: number;
}

export function useCapitalInvestmentDeals() {
  return useQuery({
    queryKey: ['capital-investment-deals'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('investment_deals' as any) as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as CapitalInvestmentDeal[];
    },
    staleTime: 15_000,
  });
}

export function useCapitalInvestmentDeal(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['capital-investment-deal', id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('investment_deals' as any) as any)
        .select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as CapitalInvestmentDeal | null;
    },
  });
}

export function useUpdateCapitalInvestmentDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const finalPatch: Record<string, unknown> = { ...patch };
      if (patch.is_published === true && !patch.published_at) {
        finalPatch.published_at = new Date().toISOString();
      }
      const { error } = await (supabase.from('investment_deals' as any) as any)
        .update(finalPatch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['capital-investment-deals'] });
      qc.invalidateQueries({ queryKey: ['capital-investment-deal', vars.id] });
      qc.invalidateQueries({ queryKey: ['capital-pipeline'] });
    },
  });
}

export function useCapitalInvestmentDealInquiries(dealId: string | undefined) {
  return useQuery({
    enabled: !!dealId,
    queryKey: ['capital-investment-deal-inquiries', dealId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('investor_inquiries' as any) as any)
        .select('*').eq('deal_id', dealId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string; created_at: string; investor_name: string; investor_email: string;
        investor_whatsapp: string | null; investor_type: string;
        investment_capacity_usd: number | null; message: string | null; status: string;
      }>;
    },
  });
}
