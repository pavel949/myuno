import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyCompanyId } from './useAgentDeals';

export interface CrmTask {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  property_id: string | null;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  due_date: string | null;
  reminder_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useCrmTasks(filters?: { status?: string; assigned_to?: string; due_today?: boolean }) {
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  return useQuery({
    queryKey: ['crm-tasks', companyId, filters],
    queryFn: async () => {
      let q = supabase
        .from('crm_tasks')
        .select('*')
        .eq('company_id', companyId!)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
    if (filters?.due_today) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;
        q = q.gte('due_date', today + 'T00:00:00')
             .lte('due_date', today + 'T23:59:59');
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as CrmTask[];
    },
    enabled: !!companyId,
  });
}

export function useTodayTasksCount() {
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  return useQuery({
    queryKey: ['crm-tasks-today-count', companyId],
    queryFn: async () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const today = `${yyyy}-${mm}-${dd}`;
      const { count, error } = await supabase
        .from('crm_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId!)
        .eq('status', 'pending')
        .lte('due_date', today + 'T23:59:59');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });
}

export function useCreateCrmTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      company_id: string;
      title: string;
      description?: string;
      task_type?: string;
      priority?: string;
      due_date?: string;
      reminder_at?: string;
      contact_id?: string;
      deal_id?: string;
      property_id?: string;
      assigned_to?: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(task as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['crm-tasks'] });
      // Activity logging is handled by the caller if needed
    },
  });
}

export function useUpdateCrmTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; completed_at?: string; title?: string; due_date?: string; priority?: string }) => {
      const { error } = await supabase
        .from('crm_tasks')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
  });
}

export function useDeleteCrmTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
  });
}
