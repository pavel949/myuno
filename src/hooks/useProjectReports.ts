/**
 * Hook for fetching monthly project reports
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectReport {
  id: string;
  project_id: string;
  month: string;
  summary: string | null;
  pdf_url: string | null;
  created_at: string | null;
}

export function useProjectReports(projectId?: string) {
  return useQuery({
    queryKey: ['project-reports', projectId],
    queryFn: async (): Promise<ProjectReport[]> => {
      if (!projectId) return [];
      const { data, error } = await (supabase.from('nb_project_reports' as any) as any)
        .select('*')
        .eq('project_id', projectId)
        .order('month', { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectReport[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
