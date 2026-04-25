import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LeadPriority = 'ready' | 'hot' | 'warm' | 'cold';

export interface LeadScoreResult {
  score: number;
  priority: LeadPriority;
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

// ----------------------------------------------------------------------
// Lead Intelligence v1 (PROJECT.md §11) — deterministic event-weighted score
// ----------------------------------------------------------------------

export interface LeadScoreEvent {
  event_key: string;
  weight: number;
  label_ru: string;
  label_en: string;
  description: string | null;
  is_active: boolean;
}

export interface ApplyLeadScoreEventResponse {
  success: boolean;
  contact_id: string;
  score_before: number;
  score_after: number;
  temperature_before: LeadPriority | null;
  temperature_after: LeadPriority;
  crossed_ready: boolean;
  alert_sent: boolean;
}

/** List the active scoring events (cached for 5 min). */
export function useLeadScoreEvents() {
  return useQuery({
    queryKey: ['lead-score-events'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LeadScoreEvent[]> => {
      const { data, error } = await supabase.functions.invoke('score-lead/events', {
        method: 'GET',
      });
      if (error) throw error;
      return (data?.events ?? []) as LeadScoreEvent[];
    },
  });
}

/** Fire one event for a contact (idempotency is the caller's responsibility). */
export function useApplyLeadScoreEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      contact_id: string;
      event_key: string;
      source?: string;
      meta?: Record<string, unknown>;
    }): Promise<ApplyLeadScoreEventResponse> => {
      const { data, error } = await supabase.functions.invoke('score-lead', {
        body: params,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Score event failed');
      return data as ApplyLeadScoreEventResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contact', data.contact_id] });
      if (data.crossed_ready) {
        toast.success(`Лид перешёл в Ready (${data.score_after}). Алерт отправлен.`);
      }
    },
    onError: (error) => {
      console.error('Apply lead score event error:', error);
      toast.error('Не удалось применить событие скоринга');
    },
  });
}

// Helper to get priority color
export function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case 'ready':
      return 'text-destructive bg-destructive/15 ring-1 ring-destructive/40';
    case 'hot':
      return 'text-red-600 bg-red-100';
    case 'warm':
      return 'text-accent bg-accent/10';
    case 'cold':
      return 'text-primary bg-primary/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
}

// Helper to get score color
export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 86) return 'text-destructive';
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-accent';
  return 'text-primary';
}
