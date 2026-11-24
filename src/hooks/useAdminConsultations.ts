import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isInboxRequestId } from '@/lib/adminInbox';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { getLeadSourceFilterValues, getLeadVerticalFilterValues } from '@/lib/leadVerticalConfig';
import type { ConsultationRequest, ConsultationStatus, ConsultationRequestType } from './useConsultationRequests';

export interface ConsultationFilters {
  status?: ConsultationStatus | 'all';
  requestType?: ConsultationRequestType | 'all';
  verticalId?: string | 'all';
  leadSource?: string | 'all';
  search?: string;
}

export function useAdminConsultations(filters?: ConsultationFilters, selection?: { requestId: string; actorId: string | undefined }) {
  const queryClient = useQueryClient();

  const refreshConsultation = (id: string) => queryClient.invalidateQueries({
    predicate: ({ queryKey: [family, , source, requestId] }) =>
      family === 'admin-consultations' ||
      (family === 'admin-inbox' && source === 'consultation_requests') ||
      (family === 'admin-inbox-request' && source === 'consultation_requests' && requestId === id),
  });

  // Fetch all consultation requests (admin only)
  const { data: consultations, isLoading, isError, refetch } = useQuery({
    queryKey: selection
      ? ['admin-consultations', 'request', selection.actorId, selection.requestId]
      : ['admin-consultations', filters],
    enabled: !selection || (!!selection.actorId && isInboxRequestId(selection.requestId)),
    queryFn: async () => {
      if (selection) {
        if (!selection.actorId || !isInboxRequestId(selection.requestId)) throw new Error('Invalid consultation selection');
        const { data, error } = await supabase.from('consultation_requests').select('*').eq('id', selection.requestId).maybeSingle();
        if (error) throw error;
        if (data && data.id !== selection.requestId) throw new Error('Consultation identity mismatch');
        return data ? [data as unknown as ConsultationRequest] : [];
      }
      let query = supabase
        .from('consultation_requests')
        .select('*')
       .order('created_at', { ascending: false })
       .limit(500); // P0 FIX: Limit for scalability - use pagination UI for older records

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.requestType && filters.requestType !== 'all') {
        query = query.eq('request_type', filters.requestType);
      }

      if (filters?.verticalId && filters.verticalId !== 'all') {
        query = query.in('vertical_id', getLeadVerticalFilterValues(filters.verticalId));
      }

      if (filters?.leadSource && filters.leadSource !== 'all') {
        query = query.in('lead_source', getLeadSourceFilterValues(filters.leadSource));
      }

      if (filters?.search) {
        const s = sanitizeSearchTerm(filters.search);
        if (s) query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as ConsultationRequest[];
    },
  });

  // Update consultation status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: ConsultationStatus; admin_notes?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (admin_notes !== undefined) {
        updateData.admin_notes = admin_notes;
      }

      const { data, error } = await supabase
        .from('consultation_requests')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { id }) => {
      void refreshConsultation(id);
      toast.success('Статус обновлён');
    },
    onError: () => {
      toast.error('Ошибка при обновлении статуса');
    },
  });

  // Update admin notes
  const updateNotes = useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes: string }) => {
      const { data, error } = await supabase
        .from('consultation_requests')
        .update({ admin_notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { id }) => {
      void refreshConsultation(id);
      toast.success('Заметка сохранена');
    },
    onError: () => {
      toast.error('Ошибка при сохранении заметки');
    },
  });

  // Get counts by status
  const pendingCount = consultations?.filter(c => c.status === 'pending').length || 0;
  const inProgressCount = consultations?.filter(c => c.status === 'in_progress' || c.status === 'contacted' || c.status === 'scheduled').length || 0;
  const completedCount = consultations?.filter(c => c.status === 'completed').length || 0;

  return {
    consultations,
    isLoading,
    isError,
    refetch,
    updateStatus,
    updateNotes,
    pendingCount,
    inProgressCount,
    completedCount,
  };
}
