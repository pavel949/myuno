import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface DealParty {
  id: string;
  deal_id: string;
  contact_id: string | null;
  role: string;
  commission_pct: number | null;
  commission_amount: number | null;
  signed_agreement_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const DEAL_PARTY_ROLES = [
  'buyer', 'seller', 'agent', 'co_agent', 'lawyer', 'developer', 'escrow', 'investor', 'landlord', 'tenant', 'other',
] as const;

export const DEAL_PARTY_ROLE_LABELS: Record<string, { en: string; ru: string }> = {
  buyer: { en: 'Buyer', ru: 'Покупатель' },
  seller: { en: 'Seller', ru: 'Продавец' },
  agent: { en: 'Agent', ru: 'Агент' },
  co_agent: { en: 'Co-Agent', ru: 'Со-агент' },
  lawyer: { en: 'Lawyer', ru: 'Юрист' },
  developer: { en: 'Developer', ru: 'Застройщик' },
  escrow: { en: 'Escrow', ru: 'Эскроу' },
  investor: { en: 'Investor', ru: 'Инвестор' },
  landlord: { en: 'Landlord', ru: 'Арендодатель' },
  tenant: { en: 'Tenant', ru: 'Арендатор' },
  other: { en: 'Other', ru: 'Другое' },
};

export function useDealParties(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-parties', dealId],
    queryFn: async () => {
      const { data, error } = await typedFrom('deal_parties')
        .select('*, crm_contacts(first_name, last_name, primary_phone, primary_email)')
        .eq('deal_id', dealId!)
        .order('created_at');
      if (error) throw error;
      return data as (DealParty & { crm_contacts?: { first_name: string; last_name: string; primary_phone: string | null; primary_email: string | null } })[];
    },
    enabled: !!dealId,
  });
}

export function useAddDealParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (party: Omit<DealParty, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await typedFrom('deal_parties').insert(party).select().single();
      if (error) throw error;
      return data as DealParty;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['deal-parties', vars.deal_id] }),
  });
}

export function useDeleteDealParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dealId }: { id: string; dealId: string }) => {
      const { error } = await typedFrom('deal_parties').delete().eq('id', id);
      if (error) throw error;
      return dealId;
    },
    onSuccess: (dealId) => qc.invalidateQueries({ queryKey: ['deal-parties', dealId] }),
  });
}
