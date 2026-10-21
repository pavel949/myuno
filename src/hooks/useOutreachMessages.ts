/**
 * useOutreachMessages — фид сообщений (Stage 4 unified log).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OutreachAudience, OutreachChannel } from './useOutreachTemplates';

export interface OutreachMessage {
  id: string;
  identity_id: string | null;
  audience_type: OutreachAudience;
  channel: OutreachChannel;
  status: string;
  subject: string | null;
  to_address: string | null;
  followup_sequence: number;
  next_followup_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  response_type: string | null;
  campaign_source: string | null;
  created_at: string;
  identity_name?: string | null;
  identity_email?: string | null;
  identity_phone?: string | null;
}

export function useOutreachMessages(audience?: OutreachAudience, limit = 100) {
  return useQuery({
    queryKey: ['outreach-messages', audience ?? 'all', limit],
    queryFn: async (): Promise<OutreachMessage[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as any)
        .from('v_outreach_messages_with_identity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (audience) q = q.eq('audience_type', audience);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OutreachMessage[];
    },
    staleTime: 15_000,
  });
}

export interface UnifiedCampaign {
  id: string;
  name: string;
  campaign_source: 'capital_campaigns' | 'crm_sequences';
  status: string | null;
  campaign_type: string | null;
  goal: string | null;
  owner_id: string | null;
  company_id: string | null;
  created_at: string;
}

export function useUnifiedCampaigns() {
  return useQuery({
    queryKey: ['unified-campaigns'],
    queryFn: async (): Promise<UnifiedCampaign[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('v_outreach_campaigns_unified')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as UnifiedCampaign[];
    },
    staleTime: 30_000,
  });
}
