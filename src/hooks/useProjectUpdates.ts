/**
 * Hook for fetching construction updates for a project
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  photo_urls: string[] | null;
  progress_at_time: number | null;
  published_at: string | null;
}

export function useProjectUpdates(projectId?: string) {
  return useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: async (): Promise<ProjectUpdate[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('nb_project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectUpdate[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
