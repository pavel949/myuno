/**
 * Hooks for newbuild leads (nb_leads table)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NewbuildLead {
  id: string;
  project_id: string | null;
  developer_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  budget_min: number | null;
  budget_max: number | null;
  unit_preference: string | null;
  message: string | null;
  source: string;
  score: number;
  status: string;
  transferred_to_developer: boolean;
  transferred_at: string | null;
  created_at: string;
  crm_contact_id: string | null;
  // joined
  project_name?: string;
}

export function useNewbuildLeads(filters?: { project_id?: string; status?: string; developer_id?: string }) {
  return useQuery({
    queryKey: ['nb-leads', filters],
    queryFn: async (): Promise<NewbuildLead[]> => {
      let query = supabase
        .from('nb_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.project_id) query = query.eq('project_id', filters.project_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.developer_id) query = query.eq('developer_id', filters.developer_id);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as NewbuildLead[];
    },
  });
}

export function useNewbuildLead(id?: string) {
  return useQuery({
    queryKey: ['nb-lead', id],
    queryFn: async (): Promise<NewbuildLead | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('nb_leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as NewbuildLead | null;
    },
    enabled: !!id,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('nb_leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nb-leads'] });
      toast.success('Статус обновлён');
    },
    onError: () => toast.error('Ошибка обновления'),
  });
}

export function useCreateNewbuildLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NewbuildLead>) => {
      const { error } = await supabase.from('nb_leads').insert(data as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nb-leads'] });
      toast.success('Запрос отправлен');
    },
    onError: () => toast.error('Ошибка отправки'),
  });
}

export function useDeveloperLeads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['nb-developer-leads', user?.id],
    queryFn: async (): Promise<NewbuildLead[]> => {
      if (!user) return [];
      // Get developer_id for current user
      const { data: dev } = await supabase
        .from('developers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!dev) return [];

      const { data, error } = await supabase
        .from('nb_leads')
        .select('*')
        .eq('developer_id', dev.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as NewbuildLead[];
    },
    enabled: !!user,
  });
}
