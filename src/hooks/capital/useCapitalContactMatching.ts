import { useQuery } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalContact, CapitalProject } from '@/types/capital';

export function useCapitalContactMatching(project: CapitalProject | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['capital-contact-matching', user?.id, project?.id],
    queryFn: async () => {
      if (!project) return [];

      let query = typedFrom('capital_contacts')
        .select('*')
        .order('warmth', { ascending: false });

      if (project.target_buyer_types.length > 0) {
        query = query.in('buyer_type', project.target_buyer_types);
      }

      if (project.price_from != null) {
        query = query.or(`budget_max.is.null,budget_max.gte.${project.price_from}`);
      }
      if (project.price_to != null) {
        query = query.or(`budget_min.is.null,budget_min.lte.${project.price_to}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CapitalContact[];
    },
    enabled: !!user?.id && !!project?.id,
  });
}
