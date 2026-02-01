import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface ExperienceCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon: string;
  experience_type: 'tour' | 'activity' | 'all';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExperienceCategoryInsert = Omit<ExperienceCategory, 'id' | 'created_at' | 'updated_at'>;
export type ExperienceCategoryUpdate = Partial<ExperienceCategoryInsert>;

const QUERY_KEY = ['experience-categories'];

// Fetch all categories (for admin)
const fetchAllCategories = async (): Promise<ExperienceCategory[]> => {
  const { data, error } = await supabase
    .from('experience_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as ExperienceCategory[];
};

// Fetch active categories only (for public use)
const fetchActiveCategories = async (experienceType?: 'tour' | 'activity' | 'all'): Promise<ExperienceCategory[]> => {
  let query = supabase
    .from('experience_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (experienceType && experienceType !== 'all') {
    query = query.or(`experience_type.eq.${experienceType},experience_type.eq.all`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ExperienceCategory[];
};

// Public hook - fetches only active categories
export function useExperienceCategories(experienceType?: 'tour' | 'activity' | 'all') {
  return useQuery({
    queryKey: [...QUERY_KEY, 'active', experienceType || 'all'],
    queryFn: () => fetchActiveCategories(experienceType),
    ...CACHE_PROFILES.SEMI_STATIC,
  });
}

// Admin hook - full CRUD
export function useAdminExperienceCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY, 'admin'],
    queryFn: fetchAllCategories,
    staleTime: 0, // Always fresh for admin
  });

  const createMutation = useMutation({
    mutationFn: async (newCategory: ExperienceCategoryInsert) => {
      const { data, error } = await supabase
        .from('experience_categories')
        .insert(newCategory)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ExperienceCategoryUpdate }) => {
      const { data, error } = await supabase
        .from('experience_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experience_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    categories,
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    update: (id: string, updates: ExperienceCategoryUpdate) => 
      updateMutation.mutateAsync({ id, updates }),
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
