/**
 * useDispatchOutreach — клиент для edge fn dispatch-outreach (Stage 4).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OutreachAudience, OutreachChannel } from './useOutreachTemplates';

export interface DispatchPayload {
  identity_ids: string[];
  audience_type: OutreachAudience;
  channel: OutreachChannel;
  template_id?: string;
  subject?: string;
  body?: string;
  campaign_source?: 'capital_campaigns' | 'mcc_campaigns' | 'crm_sequences';
  campaign_source_id?: string;
  scheduled_at?: string;
  dry_run?: boolean;
  throttle_hours?: number;
}

export interface DispatchResponse {
  total: number;
  summary: { sent: number; queued: number; skipped: number; failed: number };
  results: Array<{
    identity_id: string;
    status: 'queued' | 'sent' | 'skipped' | 'failed';
    message_id?: string;
    reason?: string;
  }>;
}

export function useDispatchOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DispatchPayload): Promise<DispatchResponse> => {
      const { data, error } = await supabase.functions.invoke('dispatch-outreach', {
        body: payload,
      });
      if (error) throw error;
      return data as DispatchResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach-messages'] });
    },
  });
}
