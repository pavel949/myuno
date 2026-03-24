import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadScoreResult {
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  reasoning: string;
  recommended_action: string;
  followup?: {
    whatsapp: string;
    email_subject: string;
    email_body: string;
  };
}

export interface FollowUpResult {
  message: string;
  subject?: string;
}

export function useLeadsFactory() {
  const queryClient = useQueryClient();

  // Score a single lead
  const scoreLead = useMutation({
    mutationFn: async (leadId: string): Promise<LeadScoreResult> => {
      const { data, error } = await supabase.functions.invoke('leads-factory/score', {
        body: { leadId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Scoring failed');

      return data as LeadScoreResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      toast.success('Лид проанализирован');
    },
    onError: (error) => {
      console.error('Score lead error:', error);
      toast.error('Ошибка анализа лида');
    },
  });

  // Batch score multiple leads
  const batchScoreLeads = useMutation({
    mutationFn: async (params: { limit?: number; status?: string } = {}): Promise<{
      processed: number;
      results: Array<{ id: string } & Partial<LeadScoreResult>>;
    }> => {
      const { data, error } = await supabase.functions.invoke('leads-factory/batch-score', {
        body: { limit: params.limit || 10, status: params.status || 'pending' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      toast.success(`Проанализировано лидов: ${data.processed}`);
    },
    onError: (error) => {
      console.error('Batch score error:', error);
      toast.error('Ошибка пакетного анализа');
    },
  });

  // Generate follow-up message
  const generateFollowUp = useMutation({
    mutationFn: async (params: { leadId: string; channel: 'whatsapp' | 'email' }): Promise<FollowUpResult> => {
      const { data, error } = await supabase.functions.invoke('leads-factory/generate-followup', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Generation failed');

      return data as FollowUpResult;
    },
    onSuccess: () => {
      toast.success('Сообщение сгенерировано');
    },
    onError: (error) => {
      console.error('Generate followup error:', error);
      toast.error('Ошибка генерации сообщения');
    },
  });

  // Full analysis (score + followup)
  const analyzeLead = useMutation({
    mutationFn: async (leadId: string): Promise<LeadScoreResult> => {
      const { data, error } = await supabase.functions.invoke('leads-factory/analyze', {
        body: { leadId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      return data as LeadScoreResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      toast.success('Полный анализ завершён');
    },
    onError: (error) => {
      console.error('Analyze lead error:', error);
      toast.error('Ошибка анализа лида');
    },
  });

  return {
    scoreLead,
    batchScoreLeads,
    generateFollowUp,
    analyzeLead,
  };
}

// Helper to get priority color
export function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case 'hot':
      return 'text-red-600 bg-red-100';
    case 'warm':
      return 'text-amber-600 bg-amber-100';
    case 'cold':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-muted-foreground bg-muted';
  }
}

// Helper to get score color
export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-blue-600';
}
