/**
 * Admin hooks for managing developers (property developers/builders)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Developer {
  id: string;
  name_en: string;
  name_ru: string;
  slug?: string;
  description_en?: string;
  description_ru?: string;
  logo_url?: string;
  cover_image?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  founded_year?: number;
  established_year?: number;
  headquarters?: string;
  projects_completed?: number;
  projects_ongoing?: number;
  total_units_sold?: number;
  total_units_delivered?: number;
  average_rating?: number | string;
  muuno_score?: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeveloperFormData {
  name_en: string;
  name_ru: string;
  slug?: string;
  description_en?: string;
  description_ru?: string;
  logo_url?: string;
  cover_image?: string;
  website?: string;
  phone?: string;
  email?: string;
  established_year?: number;
  headquarters?: string;
  projects_completed?: number;
  projects_ongoing?: number;
  total_units_delivered?: number;
  muuno_score?: number;
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
}

// Fetch all developers
export function useAdminDevelopers() {
  return useQuery({
    queryKey: ['admin-developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('name_en');

      if (error) throw error;
      return (data || []) as Developer[];
    },
  });
}

// Fetch single developer
export function useDeveloper(id?: string) {
  return useQuery({
    queryKey: ['developer', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Developer;
    },
    enabled: !!id,
  });
}

// Create developer
export function useCreateDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeveloperFormData) => {
      const { data: result, error } = await supabase
        .from('developers')
        .insert({
          ...data,
          is_active: data.is_active ?? true,
          is_verified: data.is_verified ?? false,
          is_featured: data.is_featured ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      toast.success('Developer created');
    },
    onError: () => {
      toast.error('Failed to create developer');
    },
  });
}

// Update developer
export function useUpdateDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: DeveloperFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('developers')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['developer', data.id] });
      toast.success('Developer updated');
    },
    onError: () => {
      toast.error('Failed to update developer');
    },
  });
}

// Delete developer
export function useDeleteDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('developers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      toast.success('Developer deleted');
    },
    onError: () => {
      toast.error('Failed to delete developer');
    },
  });
}
