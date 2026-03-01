import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OwnerProspect {
  id: string;
  owner_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  property_type: string | null;
  property_location: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

const from = () => (supabase as any).from('owner_prospects');

export function useOwnerProspects(statusFilter?: string) {
  return useQuery({
    queryKey: ['owner-prospects', statusFilter],
    queryFn: async (): Promise<OwnerProspect[]> => {
      let q = from().select('*').order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as OwnerProspect[];
    },
  });
}

export function useCreateOwnerProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prospect: Partial<OwnerProspect>) => {
      const { data, error } = await from().insert(prospect).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-prospects'] });
      toast.success('Owner prospect added');
    },
    onError: () => toast.error('Error creating prospect'),
  });
}

export function useUpdateOwnerProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<OwnerProspect>) => {
      const { data, error } = await from().update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-prospects'] });
    },
    onError: () => toast.error('Error updating prospect'),
  });
}
