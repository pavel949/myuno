import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TaskComment {
  id: string;
  task_id: string;
  task_source: 'crm' | 'ops';
  author_id: string;
  content: string;
  photos: string[];
  created_at: string;
  author_name?: string;
}

export function useTaskComments(taskId: string | undefined, taskSource: 'crm' | 'ops') {
  return useQuery({
    queryKey: ['task-comments', taskId, taskSource],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('task_comments' as any)
        .select('*')
        .eq('task_id', taskId)
        .eq('task_source', taskSource)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch author names
      const authorIds = [...new Set((data || []).map((c: any) => c.author_id))];
      const profileMap: Record<string, string> = {};
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', authorIds);
        for (const p of profiles || []) {
          profileMap[p.id] = p.full_name || 'User';
        }
      }

      return (data || []).map((c: any) => ({
        ...c,
        author_name: profileMap[c.author_id] || 'User',
      })) as TaskComment[];
    },
    enabled: !!taskId,
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { task_id: string; task_source: 'crm' | 'ops'; content: string; photos?: string[] }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('task_comments' as any)
        .insert({
          task_id: input.task_id,
          task_source: input.task_source,
          author_id: user.id,
          content: input.content,
          photos: input.photos || [],
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['task-comments', vars.task_id, vars.task_source] });
    },
  });
}
