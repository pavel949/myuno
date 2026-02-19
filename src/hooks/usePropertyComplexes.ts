import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PropertyComplex {
  id: string;
  owner_id: string;
  name: string;
  name_ru?: string;
  description?: string;
  address?: string;
  district?: string;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function usePropertyComplexes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-complexes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('property_complexes')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as PropertyComplex[];
    },
  });
}

export function useCreateComplex() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<PropertyComplex, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db
        .from('property_complexes')
        .insert({ ...payload, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as PropertyComplex;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
    },
  });
}

export function useUpdateComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyComplex> & { id: string }) => {
      const { data, error } = await db
        .from('property_complexes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyComplex;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
    },
  });
}

export function useDeleteComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('property_complexes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс удалён');
    },
  });
}

/** Assign property to complex (or remove — pass null) */
export function useAssignPropertyToComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, complexId }: { propertyId: string; complexId: string | null }) => {
      const { error } = await db
        .from('owner_properties')
        .update({ complex_id: complexId })
        .eq('id', propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
    },
  });
}
