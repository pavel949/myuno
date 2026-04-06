import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  note_type: string;
  content: string;
  created_at: string;
}

export function useContactNotes(contactId: string | undefined) {
  return useQuery({
    queryKey: ['crm-contact-notes', contactId],
    queryFn: async (): Promise<CrmContactNote[]> => {
      const { data, error } = await supabase
        .from('crm_contact_notes')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CrmContactNote[];
    },
    enabled: !!contactId,
  });
}

export function useAddContactNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: Omit<CrmContactNote, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('crm_contact_notes')
        .insert(note as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-contact-notes', vars.contact_id] });
    },
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to add note'));
    },
  });
}

export function useDeleteContactNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contactId }: { id: string; contactId: string }) => {
      const { error } = await supabase.from('crm_contact_notes').delete().eq('id', id);
      if (error) throw error;
      return contactId;
    },
    onSuccess: (contactId) => {
      qc.invalidateQueries({ queryKey: ['crm-contact-notes', contactId] });
    },
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to delete note'));
    },
  });
}
