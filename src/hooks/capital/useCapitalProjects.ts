import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalProject, CapitalProjectInsert, CapitalProjectUpdate } from '@/types/capital';

export function useCapitalProjects(activeOnly = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['capital-projects', user?.id, activeOnly],
    queryFn: async () => {
      let query = typedFrom('capital_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CapitalProject[];
    },
    enabled: !!user?.id,
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<CapitalProjectInsert, 'user_id'>) => {
      const { data, error } = await typedFrom('capital_projects')
        .insert({ ...project, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CapitalProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-projects'] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: CapitalProjectUpdate & { id: string }) => {
      const { data, error } = await typedFrom('capital_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-projects'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await typedFrom('capital_projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-projects'] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await typedFrom('capital_projects')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-projects'] });
    },
  });

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject,
    updateProject,
    deleteProject,
    toggleActive,
  };
}
