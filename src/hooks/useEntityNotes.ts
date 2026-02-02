import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EntityNote {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  is_important: boolean;
  mentioned_users: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export type EntityType = 
  | 'property' 
  | 'listing' 
  | 'lead' 
  | 'ticket' 
  | 'booking' 
  | 'order' 
  | 'user' 
  | 'vendor' 
  | 'review';

/**
 * Hook for entity notes
 */
export function useEntityNotes(entityType: EntityType, entityId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['entity-notes', entityType, entityId],
    queryFn: async () => {
      const { data: notesData, error: notesError } = await supabase
        .from('team_entity_notes')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      if (!notesData || notesData.length === 0) return [];

      // Get author details
      const authorIds = [...new Set(notesData.map(n => n.user_id))];
      const { data: membersData } = await supabase
        .from('team_members')
        .select('user_id, display_name, avatar_url')
        .in('user_id', authorIds);

      // Combine data
      const notes: EntityNote[] = notesData.map(n => {
        const author = membersData?.find(m => m.user_id === n.user_id);
        return {
          ...n,
          author: author ? {
            display_name: author.display_name,
            avatar_url: author.avatar_url,
          } : undefined,
        };
      });

      return notes;
    },
    enabled: !!entityType && !!entityId,
  });

  const addNote = useMutation({
    mutationFn: async ({
      content,
      isImportant = false,
      mentionedUsers = [],
    }: {
      content: string;
      isImportant?: boolean;
      mentionedUsers?: string[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_entity_notes')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          content,
          is_important: isImportant,
          mentioned_users: mentionedUsers,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-notes', entityType, entityId] });
      toast({ title: 'Заметка добавлена' });
    },
    onError: () => {
      toast({ title: 'Ошибка добавления заметки', variant: 'destructive' });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({
      noteId,
      content,
      isImportant,
    }: {
      noteId: string;
      content?: string;
      isImportant?: boolean;
    }) => {
      const updates: Partial<EntityNote> = {};
      if (content !== undefined) updates.content = content;
      if (isImportant !== undefined) updates.is_important = isImportant;

      const { error } = await supabase
        .from('team_entity_notes')
        .update(updates)
        .eq('id', noteId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-notes', entityType, entityId] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('team_entity_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-notes', entityType, entityId] });
      toast({ title: 'Заметка удалена' });
    },
  });

  const importantNotes = notes?.filter(n => n.is_important) || [];
  const notesCount = notes?.length || 0;

  return {
    notes,
    importantNotes,
    notesCount,
    isLoading,
    addNote: addNote.mutateAsync,
    isAdding: addNote.isPending,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
  };
}

/**
 * Hook to get notes count for multiple entities (for badges)
 */
export function useEntityNotesCount(entityType: EntityType, entityIds: string[]) {
  const { data: counts, isLoading } = useQuery({
    queryKey: ['entity-notes-count', entityType, entityIds],
    queryFn: async () => {
      if (entityIds.length === 0) return {};

      const { data, error } = await supabase
        .from('team_entity_notes')
        .select('entity_id')
        .eq('entity_type', entityType)
        .in('entity_id', entityIds);

      if (error) throw error;

      const countMap: Record<string, number> = {};
      entityIds.forEach(id => { countMap[id] = 0; });
      
      data?.forEach(note => {
        countMap[note.entity_id] = (countMap[note.entity_id] || 0) + 1;
      });

      return countMap;
    },
    enabled: entityIds.length > 0,
  });

  return { counts, isLoading };
}
