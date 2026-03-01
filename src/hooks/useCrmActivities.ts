/**
 * @module useCrmActivities
 * CRUD hooks for crm_activities
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmActivity {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  activity_type: string;
  subject: string | null;
  description: string | null;
  duration_minutes: number | null;
  outcome: string | null;
  metadata: Record<string, unknown> | null;
  logged_by: string;
  activity_date: string;
  created_at: string;
}

export const ACTIVITY_TYPES = [
  'call', 'email_sent', 'email_received', 'meeting', 'note', 'whatsapp',
  'sms', 'document_shared', 'task_completed', 'stage_changed',
  'property_viewed', 'quote_sent', 'form_submitted',
] as const;

export const ACTIVITY_OUTCOMES = [
  'connected', 'no_answer', 'left_voicemail', 'scheduled', 'completed', 'cancelled',
] as const;

export const ACTIVITY_TYPE_CONFIG: Record<string, { labelEn: string; labelRu: string; icon: string; color: string }> = {
  call: { labelEn: 'Call', labelRu: 'Звонок', icon: 'Phone', color: 'text-success' },
  email_sent: { labelEn: 'Email Sent', labelRu: 'Email отправлен', icon: 'Mail', color: 'text-info' },
  email_received: { labelEn: 'Email Received', labelRu: 'Email получен', icon: 'MailOpen', color: 'text-info' },
  meeting: { labelEn: 'Meeting', labelRu: 'Встреча', icon: 'Users', color: 'text-warning' },
  note: { labelEn: 'Note', labelRu: 'Заметка', icon: 'FileText', color: 'text-muted-foreground' },
  whatsapp: { labelEn: 'WhatsApp', labelRu: 'WhatsApp', icon: 'MessageCircle', color: 'text-success' },
  sms: { labelEn: 'SMS', labelRu: 'SMS', icon: 'MessageSquare', color: 'text-primary' },
  document_shared: { labelEn: 'Document', labelRu: 'Документ', icon: 'FileText', color: 'text-accent-foreground' },
  task_completed: { labelEn: 'Task Done', labelRu: 'Задача', icon: 'CheckCircle', color: 'text-success' },
  stage_changed: { labelEn: 'Stage Changed', labelRu: 'Смена стадии', icon: 'ArrowRight', color: 'text-primary' },
  property_viewed: { labelEn: 'Property Viewed', labelRu: 'Просмотр', icon: 'Eye', color: 'text-warning' },
  quote_sent: { labelEn: 'Quote Sent', labelRu: 'КП отправлено', icon: 'Send', color: 'text-info' },
  form_submitted: { labelEn: 'Form Submitted', labelRu: 'Форма', icon: 'ClipboardList', color: 'text-primary' },
};

const from = (table: string) => (supabase as any).from(table);

export function useCrmActivities(contactId?: string, dealId?: string, limit = 30) {
  return useQuery({
    queryKey: ['crm-activities', contactId, dealId, limit],
    queryFn: async (): Promise<CrmActivity[]> => {
      let q = from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: false })
        .limit(limit);
      if (contactId) q = q.eq('contact_id', contactId);
      if (dealId) q = q.eq('deal_id', dealId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CrmActivity[];
    },
    enabled: !!contactId || !!dealId,
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Omit<CrmActivity, 'id' | 'created_at'>) => {
      const { data, error } = await from('crm_activities').insert(activity).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-activities'] });
    },
  });
}
