import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type VisaRecordRow = Database['public']['Tables']['visa_records']['Row'];
type VisaRecordInsert = Database['public']['Tables']['visa_records']['Insert'];
type VisaRecordUpdate = Database['public']['Tables']['visa_records']['Update'];

export interface VisaRecord {
  id: string;
  user_id: string;
  visa_type: string;
  entry_date: string | null;
  expiry_date: string;
  status: string;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateVisaInput {
  visa_type: string;
  entry_date?: string;
  expiry_date: string;
  notes?: string;
  document_url?: string;
}

export function useVisaRecords() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['visa-records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visa_records')
        .select('*')
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as VisaRecord[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: CreateVisaInput) => {
      const payload: VisaRecordInsert = { ...input, user_id: user!.id } as VisaRecordInsert;
      const { data, error } = await supabase
        .from('visa_records')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as VisaRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visa-records'] });
      toast.success('Visa record added');
    },
    onError: () => toast.error('Failed to save visa record'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateVisaInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('visa_records')
        .update(input as VisaRecordUpdate)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as VisaRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visa-records'] });
      toast.success('Visa record updated');
    },
    onError: () => toast.error('Failed to update visa record'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('visa_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visa-records'] });
      toast.success('Visa record deleted');
    },
    onError: () => toast.error('Failed to delete visa record'),
  });

  return { records: query.data ?? [] as VisaRecordRow[] as unknown as VisaRecord[], isLoading: query.isLoading, create, update, remove };
}
