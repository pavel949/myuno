/**
 * @module useCrmMeetings
 * CRUD hooks for crm_meetings
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmMeeting {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  host_user_id: string;
  title: string;
  meeting_type: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const from = (table: string) => (supabase as any).from(table);

export function useCrmMeetings(companyId: string | undefined, options?: { contactId?: string; dealId?: string }) {
  return useQuery({
    queryKey: ['crm-meetings', companyId, options?.contactId, options?.dealId],
    queryFn: async (): Promise<CrmMeeting[]> => {
      let q = from('crm_meetings')
        .select('*')
        .eq('company_id', companyId!)
        .order('scheduled_at', { ascending: true });
      if (options?.contactId) q = q.eq('contact_id', options.contactId);
      if (options?.dealId) q = q.eq('deal_id', options.dealId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CrmMeeting[];
    },
    enabled: !!companyId,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meeting: Omit<CrmMeeting, 'id' | 'created_at'>) => {
      const { data, error } = await from('crm_meetings').insert(meeting).select().single();
      if (error) throw error;
      return data as CrmMeeting;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-meetings'] }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmMeeting> & { id: string }) => {
      const { error } = await from('crm_meetings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-meetings'] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('crm_meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-meetings'] }),
  });
}
