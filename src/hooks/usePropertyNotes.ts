import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NoteCategory = 'general' | 'maintenance' | 'financial' | 'guest' | 'urgent';

export interface PropertyNote {
  id: string;
  property_id: string;
  author_id: string;
  note: string;
  category: NoteCategory;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const noteCategoryLabels: Record<NoteCategory, { en: string; ru: string; color: string }> = {
  general: { en: 'General', ru: 'Общее', color: 'bg-muted text-muted-foreground' },
  maintenance: { en: 'Maintenance', ru: 'Обслуживание', color: 'bg-warning/10 text-warning' },
  financial: { en: 'Financial', ru: 'Финансы', color: 'bg-success/10 text-success' },
  guest: { en: 'Guest', ru: 'Гости', color: 'bg-info/10 text-info' },
  urgent: { en: 'Urgent', ru: 'Срочно', color: 'bg-destructive/10 text-destructive' },
};

export function usePropertyNotes(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-notes', propertyId];

  const { data: notes, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_notes')
        .select('*')
        .eq('property_id', propertyId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PropertyNote[];
    },
    enabled: !!propertyId && !!user,
  });

  const addNote = useMutation({
    mutationFn: async (input: { note: string; category?: NoteCategory }) => {
      const { data, error } = await supabase
        .from('property_notes')
        .insert({
          property_id: propertyId!,
          author_id: user!.id,
          note: input.note,
          category: input.category || 'general',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('property_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('property_notes')
        .update({ is_pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { notes, isLoading, addNote, deleteNote, togglePin };
}
