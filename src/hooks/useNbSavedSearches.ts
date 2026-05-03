/**
 * Saved off-plan/newbuild searches CRUD.
 * Backed by public.nb_saved_searches.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { OffplanUiFilterState } from '@/lib/offplan/types';

export interface NbSavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: OffplanUiFilterState;
  notify_email: boolean;
  notify_whatsapp: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  is_active: boolean;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useNbSavedSearches() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['nb-saved-searches', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NbSavedSearch[]> => {
      const { data, error } = await supabase
        .from('nb_saved_searches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NbSavedSearch[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      name: string;
      filters: OffplanUiFilterState;
      notify_email: boolean;
      notify_whatsapp: boolean;
      frequency?: NbSavedSearch['frequency'];
    }) => {
      if (!user) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from('nb_saved_searches')
        .insert({
          user_id: user.id,
          name: input.name,
          filters: input.filters as unknown as Record<string, unknown>,
          notify_email: input.notify_email,
          notify_whatsapp: input.notify_whatsapp,
          frequency: input.frequency ?? 'daily',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nb-saved-searches', user?.id] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NbSavedSearch> }) => {
      const { error } = await supabase
        .from('nb_saved_searches')
        .update(patch as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nb-saved-searches', user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nb_saved_searches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nb-saved-searches', user?.id] }),
  });

  return { list, create, update, remove };
}
