import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom, type OwnerProspectRow } from '@/lib/untypedTables';
import { toast } from 'sonner';

export type OwnerProspect = OwnerProspectRow;

const from = () => typedFrom('owner_prospects');

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
      return data as OwnerProspect;
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
      return data as OwnerProspect;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-prospects'] });
    },
    onError: () => toast.error('Error updating prospect'),
  });
}
