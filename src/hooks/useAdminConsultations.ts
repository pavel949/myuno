import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ConsultationRequest, ConsultationStatus, ConsultationRequestType } from './useConsultationRequests';

export interface ConsultationFilters {
  status?: ConsultationStatus | 'all';
  requestType?: ConsultationRequestType | 'all';
  verticalId?: string | 'all';
  leadSource?: string | 'all';
  search?: string;
}

export function useAdminConsultations(filters?: ConsultationFilters) {
  const queryClient = useQueryClient();

  // Fetch all consultation requests (admin only)
  const { data: consultations, isLoading, refetch } = useQuery({
    queryKey: ['admin-consultations', filters],
    queryFn: async () => {
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
        query = query.eq('vertical_id', filters.verticalId);
      }

      if (filters?.leadSource && filters.leadSource !== 'all') {
        query = query.eq('lead_source', filters.leadSource);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
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
    refetch,
    updateStatus,
    updateNotes,
    pendingCount,
    inProgressCount,
    completedCount,
  };
}
