/**
 * CRUD hooks for agent_deals table (Sales CRM for Management Companies)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const DEAL_STAGES = [
  'new', 'contacted', 'showing', 'negotiation', 'contract', 'closed_won', 'closed_lost',
] as const;

export type DealStage = typeof DEAL_STAGES[number];

export const DEAL_STAGE_LABELS: Record<DealStage, { en: string; ru: string }> = {
  new: { en: 'New', ru: 'Новый' },
  contacted: { en: 'Contacted', ru: 'Контакт' },
  showing: { en: 'Showing', ru: 'Показ' },
  negotiation: { en: 'Negotiation', ru: 'Переговоры' },
  contract: { en: 'Contract', ru: 'Договор' },
  closed_won: { en: 'Won', ru: 'Успех' },
  closed_lost: { en: 'Lost', ru: 'Проигрыш' },
};

export const CLIENT_SOURCES = ['website', 'referral', 'walk-in', 'social_media', 'agent', 'other'] as const;

export interface AgentDeal {
  id: string;
  company_id: string;
  agent_id: string;
  property_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_source: string | null;
  stage: DealStage;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  preferred_districts: string[] | null;
  preferred_types: string[] | null;
  bedrooms_min: number | null;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  deal_value: number | null;
  commission_percent: number | null;
  commission_amount: number | null;
  closed_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type AgentDealInsert = Omit<AgentDeal, 'id' | 'created_at' | 'updated_at'>;
export type AgentDealUpdate = Partial<AgentDealInsert>;

/** Get the user's company_id from management_company_members */
export function useMyCompanyId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-company-id', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('management_company_members')
        .select('company_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { company_id: string; role: string } | null;
    },
    enabled: !!user,
  });
}

/** Fetch all deals for the user's company */
export function useAgentDeals(companyId: string | undefined) {
  return useQuery({
    queryKey: ['agent-deals', companyId],
    queryFn: async (): Promise<AgentDeal[]> => {
      const { data, error } = await supabase
        .from('agent_deals')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AgentDeal[];
    },
    enabled: !!companyId,
  });
}

/** Fetch a single deal */
export function useAgentDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: ['agent-deal', dealId],
    queryFn: async (): Promise<AgentDeal | null> => {
      if (!dealId) return null;
      const { data, error } = await supabase
        .from('agent_deals')
        .select('*')
        .eq('id', dealId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AgentDeal | null;
    },
    enabled: !!dealId,
  });
}

/** Create a new deal */
export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deal: AgentDealInsert) => {
      const { data, error } = await supabase
        .from('agent_deals')
        .insert(deal as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
    },
  });
}

/** Update a deal */
export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AgentDealUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('agent_deals')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
      qc.invalidateQueries({ queryKey: ['agent-deal', vars.id] });
    },
  });
}

/** Delete a deal */
export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
    },
  });
}
