/**
 * CRUD hooks for deal_scheduled_activities (ODOO-style planned actions)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ACTIVITY_TYPES = ['call', 'meeting', 'showing', 'email', 'whatsapp', 'task', 'deadline'] as const;
export type ScheduledActivityType = typeof ACTIVITY_TYPES[number];

export const ACTIVITY_TYPE_LABELS: Record<ScheduledActivityType, { en: string; ru: string; icon: string }> = {
  call: { en: 'Call', ru: 'Звонок', icon: '📞' },
  meeting: { en: 'Meeting', ru: 'Встреча', icon: '🤝' },
  showing: { en: 'Showing', ru: 'Показ', icon: '🏠' },
  email: { en: 'Email', ru: 'Письмо', icon: '✉️' },
  whatsapp: { en: 'WhatsApp', ru: 'WhatsApp', icon: '💬' },
  task: { en: 'Task', ru: 'Задача', icon: '✅' },
  deadline: { en: 'Deadline', ru: 'Дедлайн', icon: '⏰' },
};

export interface ScheduledActivity {
  id: string;
  company_id: string;
  deal_id: string;
  contact_id: string | null;
  activity_type: string;
  summary: string;
  note: string | null;
  due_date: string;
  due_time: string | null;
  assigned_to: string;
  completed_at: string | null;
  cancelled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Fetch activities for a deal */
export function useDealScheduledActivities(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-scheduled-activities', dealId],
    queryFn: async (): Promise<ScheduledActivity[]> => {
      const { data, error } = await supabase
        .from('deal_scheduled_activities')
        .select('*')
        .eq('deal_id', dealId!)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ScheduledActivity[];
    },
    enabled: !!dealId,
  });
}

/** Fetch all pending activities for the company (for dashboard widgets) */
export function useCompanyPendingActivities(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-pending-activities', companyId],
    queryFn: async (): Promise<ScheduledActivity[]> => {
      const { data, error } = await supabase
        .from('deal_scheduled_activities')
        .select('*')
        .eq('company_id', companyId!)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .order('due_date', { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ScheduledActivity[];
    },
    enabled: !!companyId,
  });
}

/** Create a scheduled activity */
export function useCreateScheduledActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Omit<ScheduledActivity, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'cancelled_at'>) => {
      const { data, error } = await supabase
        .from('deal_scheduled_activities')
        .insert(activity as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['deal-scheduled-activities', vars.deal_id] });
      qc.invalidateQueries({ queryKey: ['company-pending-activities'] });
    },
  });
}

/** Complete an activity */
export function useCompleteScheduledActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deal_scheduled_activities')
        .update({ completed_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-scheduled-activities'] });
      qc.invalidateQueries({ queryKey: ['company-pending-activities'] });
    },
  });
}

/** Cancel an activity */
export function useCancelScheduledActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deal_scheduled_activities')
        .update({ cancelled_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-scheduled-activities'] });
      qc.invalidateQueries({ queryKey: ['company-pending-activities'] });
    },
  });
}
