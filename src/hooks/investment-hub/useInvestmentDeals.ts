import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  CapitalRangeKey, DealIntent, DealPipelineStatus, DealStage, InvestorType,
} from '@/lib/investment/dealTaxonomy';

export interface InvestmentDealPublic {
  id: string;
  created_at: string;
  published_at: string | null;
  deal_intent: DealIntent;
  category: string;
  deal_stage: DealStage | null;
  capital_range: CapitalRangeKey;
  deal_size_midpoint_usd: number;
  deal_structure: string | null;
  target_timeline_months: number | null;
  expected_irr: number | null;
  teaser_public: string | null;
  description_public: string | null;
  location_display: string | null;
  linked_developer_id: string | null;
  linked_property_id: string | null;
}

export interface InvestmentDealAdmin extends InvestmentDealPublic {
  status: DealPipelineStatus;
  is_published: boolean;
  submitter_name: string;
  submitter_company: string | null;
  submitter_role: string | null;
  submitter_email: string;
  submitter_whatsapp: string | null;
  submitter_telegram: string | null;
  title_private: string;
  description_private: string | null;
  location_full: string | null;
  documents_urls: string[];
  probability_score: number;
  expected_value_usd: number;
  platform_fee_rate: number;
  platform_fee_estimate_usd: number;
  admin_notes: string | null;
  source: string | null;
  capital_sought_usd_min: number | null;
  capital_sought_usd_max: number | null;
}

export interface SubmitInvestmentDealInput {
  deal_intent: DealIntent;
  category: string;
  submitter_name: string;
  submitter_company?: string;
  submitter_role?: string;
  submitter_email: string;
  submitter_whatsapp?: string;
  submitter_telegram?: string;
  title_private: string;
  description_private?: string;
  location_full?: string;
  teaser_public?: string;
  documents_urls?: string[];
  deal_stage?: DealStage;
  capital_range: CapitalRangeKey;
  deal_structure?: string;
  target_timeline_months?: number;
  expected_irr?: number;
  capital_sought_usd_min?: number;
  capital_sought_usd_max?: number;
  source?: string;
  linked_developer_id?: string;
  linked_property_id?: string;
}

export interface SubmitInquiryInput {
  deal_id: string;
  investor_name: string;
  investor_email: string;
  investor_whatsapp?: string;
  investor_type: InvestorType;
  investment_capacity_usd?: number;
  message?: string;
}

/** Public — anyone can browse published deals */
export function usePublicInvestmentDeals(filters?: {
  intents?: DealIntent[];
  categories?: string[];
  ranges?: CapitalRangeKey[];
}) {
  return useQuery({
    queryKey: ['investment-deals-public', filters],
    queryFn: async () => {
      let q = (supabase.from('v_investment_deals_public' as any) as any).select('*');
      if (filters?.intents?.length) q = q.in('deal_intent', filters.intents);
      if (filters?.categories?.length) q = q.in('category', filters.categories);
      if (filters?.ranges?.length) q = q.in('capital_range', filters.ranges);
      const { data, error } = await q.order('published_at', { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as InvestmentDealPublic[];
    },
  });
}

export function usePublicInvestmentDeal(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['investment-deal-public', id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('v_investment_deals_public' as any) as any)
        .select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as InvestmentDealPublic | null;
    },
  });
}

export function useSubmitInvestmentDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitInvestmentDealInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        ...input,
        submitter_user_id: userData.user?.id ?? null,
        documents_urls: input.documents_urls ?? [],
      };
      const { data, error } = await (supabase.from('investment_deals' as any) as any)
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investment-deals-admin'] });
    },
  });
}

export function useSubmitInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitInquiryInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase.from('investor_inquiries' as any) as any)
        .insert({ ...input, inquirer_user_id: userData.user?.id ?? null })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['investment-deal-inquiries', vars.deal_id] });
    },
  });
}

/** Admin — full pipeline */
export function useAdminInvestmentDeals(status?: DealPipelineStatus) {
  return useQuery({
    queryKey: ['investment-deals-admin', status],
    queryFn: async () => {
      let q = (supabase.from('investment_deals' as any) as any).select('*');
      if (status) q = q.eq('status', status);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as InvestmentDealAdmin[];
    },
  });
}

export function useAdminInvestmentDeal(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['investment-deal-admin', id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('investment_deals' as any) as any)
        .select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as InvestmentDealAdmin | null;
    },
  });
}

export function useUpdateInvestmentDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<InvestmentDealAdmin> }) => {
      // If publishing, set published_at
      const finalPatch: any = { ...patch };
      if (patch.is_published === true) {
        finalPatch.published_at = new Date().toISOString();
        if (!patch.status) finalPatch.status = 'published';
      }
      const { error } = await (supabase.from('investment_deals' as any) as any)
        .update(finalPatch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['investment-deals-admin'] });
      qc.invalidateQueries({ queryKey: ['investment-deal-admin', vars.id] });
      qc.invalidateQueries({ queryKey: ['investment-deals-public'] });
    },
  });
}

export function useDealInquiries(dealId: string | undefined) {
  return useQuery({
    enabled: !!dealId,
    queryKey: ['investment-deal-inquiries', dealId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('investor_inquiries' as any) as any)
        .select('*').eq('deal_id', dealId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string; created_at: string; deal_id: string;
        investor_name: string; investor_email: string; investor_whatsapp: string | null;
        investor_type: InvestorType; investment_capacity_usd: number | null;
        message: string | null; status: string; admin_notes: string | null;
      }>;
    },
  });
}

export function useUpdateInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await (supabase.from('investor_inquiries' as any) as any)
        .update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investment-deal-inquiries'] });
    },
  });
}

/** Aggregated pipeline KPIs for admin */
export function useInvestmentPipelineStats() {
  return useQuery({
    queryKey: ['investment-pipeline-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('investment_deals' as any) as any)
        .select('status,deal_size_midpoint_usd,expected_value_usd,platform_fee_estimate_usd,is_published');
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        status: DealPipelineStatus;
        deal_size_midpoint_usd: number;
        expected_value_usd: number;
        platform_fee_estimate_usd: number;
        is_published: boolean;
      }>;
      const byStage: Record<string, number> = {};
      let totalVolume = 0, weightedVolume = 0, feeEst = 0, published = 0;
      rows.forEach((r) => {
        byStage[r.status] = (byStage[r.status] ?? 0) + 1;
        totalVolume += r.deal_size_midpoint_usd ?? 0;
        weightedVolume += r.expected_value_usd ?? 0;
        feeEst += Number(r.platform_fee_estimate_usd ?? 0);
        if (r.is_published) published += 1;
      });
      return {
        totalDeals: rows.length,
        published,
        byStage,
        totalVolume,
        weightedVolume,
        feeEst,
      };
    },
  });
}
