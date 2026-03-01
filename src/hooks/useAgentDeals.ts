/**
 * CRUD hooks for agent_deals table (Sales CRM for Management Companies)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export const DEAL_STAGES = [
  'new', 'contacted', 'showing', 'negotiation', 'contract', 'closed_won', 'closed_lost',
] as const;

export type DealStage = typeof DEAL_STAGES[number];

export const DEAL_STAGE_LABELS: Record<DealStage, { en: string; ru: string; short: string; shortRu: string }> = {
  new: { en: 'New', ru: 'Новый', short: 'New', shortRu: 'Нов' },
  contacted: { en: 'Contacted', ru: 'Контакт', short: 'Call', shortRu: 'Зв' },
  showing: { en: 'Showing', ru: 'Показ', short: 'Show', shortRu: 'Пок' },
  negotiation: { en: 'Negotiation', ru: 'Торг', short: 'Nego', shortRu: 'Торг' },
  contract: { en: 'Contract', ru: 'Договор', short: 'Deal', shortRu: 'Дог' },
  closed_won: { en: 'Won', ru: 'Успех', short: 'Won', shortRu: 'Усп' },
  closed_lost: { en: 'Lost', ru: 'Проигрыш', short: 'Lost', shortRu: 'Пр' },
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

/** Deal types */
export const DEAL_TYPES = ['sale', 'rent', 'investment', 'management'] as const;
export type DealType = typeof DEAL_TYPES[number];
export const DEAL_TYPE_LABELS: Record<DealType, { en: string; ru: string }> = {
  sale: { en: 'Sale', ru: 'Продажа' },
  rent: { en: 'Rent', ru: 'Аренда' },
  investment: { en: 'Investment', ru: 'Инвестиция' },
  management: { en: 'Management', ru: 'Управление' },
};

/** Deal statuses (active / on_hold / archived) */
export const DEAL_STATUSES = ['active', 'on_hold', 'archived'] as const;
export type DealStatus = typeof DEAL_STATUSES[number];
export const DEAL_STATUS_LABELS: Record<DealStatus, { en: string; ru: string }> = {
  active: { en: 'Active', ru: 'Активная' },
  on_hold: { en: 'On Hold', ru: 'На паузе' },
  archived: { en: 'Archived', ru: 'Архив' },
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
  deal_type: DealType;
  deal_status: DealStatus;
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
  tags: string[];
  priority: number;
  created_at: string;
  updated_at: string;
}

export type AgentDealInsert = Omit<AgentDeal, 'id' | 'created_at' | 'updated_at'>;
export type AgentDealUpdate = Partial<AgentDealInsert>;

/** Get the user's active company_id — uses ActiveCompany context when available */
export function useMyCompanyId() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useQuery({
    queryKey: ['my-company-id', user?.id, activeCompany?.company_id],
    queryFn: async () => {
      // If context provides a company, use it
      if (activeCompany) {
        return { company_id: activeCompany.company_id, role: activeCompany.role };
      }
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
        .select('user_id, role')
        .eq('company_id', companyId!)
        .eq('is_active', true);
      if (error) throw error;
      // Fetch profile names separately to avoid join issues
      const members = data || [];
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] as { id: string; full_name: string | null }[] };
      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      return members.map(m => ({
        user_id: m.user_id,
        role: m.role,
        name: profileMap.get(m.user_id) || m.user_id.slice(0, 8),
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

/** Fetch all deals for the user's company with optional server-side pagination */
export function useAgentDeals(companyId: string | undefined, page?: number, pageSize = 50) {
  return useQuery({
    queryKey: ['agent-deals', companyId, page, pageSize],
    queryFn: async (): Promise<{ data: AgentDeal[]; count: number }> => {
      let q = supabase
        .from('agent_deals')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });

      if (page !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        q = q.range(from, to);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: (data || []) as unknown as AgentDeal[], count: count || 0 };
    },
    enabled: !!companyId,
  });
}

/** Fetch a single deal */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fetch a single deal */
export function useAgentDeal(dealId: string | undefined) {
  const isValidId = !!dealId && UUID_RE.test(dealId);
  return useQuery({
    queryKey: ['agent-deal', dealId],
    queryFn: async (): Promise<AgentDeal | null> => {
      if (!isValidId) return null;
      const { data, error } = await supabase
        .from('agent_deals')
        .select('*')
        .eq('id', dealId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AgentDeal | null;
    },
    enabled: isValidId,
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
