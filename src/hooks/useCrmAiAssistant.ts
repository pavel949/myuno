/**
 * @module useCrmAiAssistant
 * Hook for AI CRM assistant interactions
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AiAction = 'summarize' | 'next_action' | 'draft_email' | 'risk_alert';

interface AiRequest {
  action: AiAction;
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
}

export function useCrmAiAssistant() {
  return useMutation({
    mutationFn: async (req: AiRequest): Promise<string> => {
      const { data, error } = await supabase.functions.invoke('crm-ai-assistant', {
        body: req,
      });
      if (error) throw error;
      return data?.result || 'No response';
    },
  });
}
