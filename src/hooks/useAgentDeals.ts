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

export const DEAL_STAGE_LABELS: Record<DealStage, { en: string; ru: string; short: string }> = {
  new: { en: 'New', ru: 'Новый', short: 'New' },
  contacted: { en: 'Contacted', ru: 'Контакт', short: 'Call' },
  showing: { en: 'Showing', ru: 'Показ', short: 'Show' },
  negotiation: { en: 'Negotiation', ru: 'Торг', short: 'Nego' },
  contract: { en: 'Contract', ru: 'Договор', short: 'Deal' },
  closed_won: { en: 'Won', ru: 'Успех', short: 'Won' },
  closed_lost: { en: 'Lost', ru: 'Проигрыш', short: 'Lost' },
};

export const STAGE_PROBABILITIES: Record<DealStage, number> = {
  new: 0.10,
  contacted: 0.20,
  showing: 0.40,
  negotiation: 0.60,
  contract: 0.80,
  closed_won: 1.0,
  closed_lost: 0,
};

export const CLIENT_SOURCES = ['website', 'referral', 'walk-in', 'social_media', 'agent', 'other'] as const;

export const PHUKET_DISTRICTS = [
  'Chalong', 'Rawai', 'Kata', 'Karon', 'Patong', 'Kamala', 'Surin', 'Bang Tao',
  'Layan', 'Cherng Talay', 'Thalang', 'Phuket Town', 'Kathu', 'Mai Khao', 'Nai Harn',
] as const;

export const PROPERTY_TYPES = ['villa', 'condo', 'townhouse', 'land', 'apartment', 'penthouse'] as const;
export const CURRENCIES = ['THB', 'USD', 'RUB', 'CNY', 'EUR'] as const;

export interface AgentDeal {
  id: string;
  company_id: string;
  agent_id: string;
  property_id: string | null;
  contact_id: string | null;
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

/** Fetch company members for agent filter */
export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-members', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_company_members')
        .select('user_id, role, profiles:user_id(full_name)')
        .eq('company_id', companyId!)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        name: m.profiles?.full_name || m.user_id.slice(0, 8),
      }));
    },
    enabled: !!companyId,
  });
}

/** Check for duplicate client by phone or email */
export function useDuplicateCheck(companyId: string | undefined, phone: string, email: string) {
  return useQuery({
    queryKey: ['deal-duplicate', companyId, phone, email],
    queryFn: async (): Promise<AgentDeal[]> => {
      if (!companyId) return [];
      let results: AgentDeal[] = [];
      if (phone && phone.length >= 6) {
        const { data } = await supabase
          .from('agent_deals')
          .select('*')
          .eq('company_id', companyId)
          .eq('client_phone', phone)
          .limit(3);
        if (data) results = [...results, ...(data as unknown as AgentDeal[])];
      }
      if (email && email.includes('@')) {
        const { data } = await supabase
          .from('agent_deals')
          .select('*')
          .eq('company_id', companyId)
          .eq('client_email', email)
          .limit(3);
        if (data) {
          const ids = new Set(results.map(r => r.id));
          results = [...results, ...(data as unknown as AgentDeal[]).filter(d => !ids.has(d.id))];
        }
      }
      return results;
    },
    enabled: !!companyId && ((!!phone && phone.length >= 6) || (!!email && email.includes('@'))),
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

/** Bulk update stage */
export function useBulkUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, stage }: { ids: string[]; stage: DealStage }) => {
      const { error } = await supabase
        .from('agent_deals')
        .update({ stage } as any)
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
    },
  });
}

/** Bulk delete deals */
export function useBulkDeleteDeals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('agent_deals')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
    },
  });
}

/** Utility: days since a given date */
export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

/** Utility: format deal value in millions */
export function formatValue(val: number | null, currency?: string | null): string {
  if (!val) return '—';
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M ${currency || ''}`.trim();
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K ${currency || ''}`.trim();
  return `${val.toLocaleString()} ${currency || ''}`.trim();
}
