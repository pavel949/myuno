/**
 * useIsProjectDeveloper — TRUE if the current user is the owner / verified team
 * member of the developer that owns this project. Used to bypass the ClearView
 * paywall on the developer's own projects.
 *
 * Two paths are checked:
 *  1. Single-owner / onboarding case → `developers.user_id = auth.uid()`
 *  2. Multi-seat developer org      → `developer_users` row with matching
 *     `developer_id`, `auth_user_id`, `status='active'`
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useIsProjectDeveloper(projectId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-project-developer', projectId, user?.id],
    enabled: !!projectId && !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<boolean> => {
      if (!projectId || !user?.id) return false;

      // 1. Resolve the project's developer_id
      const { data: project } = await supabase
        .from('property_projects')
        .select('developer_id')
        .eq('id', projectId)
        .maybeSingle();

      const devId = (project as { developer_id?: string | null } | null)?.developer_id;
      if (!devId) return false;

      // 2. Run both ownership checks in parallel
      const [ownRes, teamRes] = await Promise.all([
        supabase
          .from('developers')
          .select('id')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('id', devId as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('user_id' as any, user.id)
          .maybeSingle(),
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('developer_users' as any)
          .select('id')
          .eq('developer_id', devId)
          .eq('auth_user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
      ]);

      return !!ownRes.data || !!teamRes.data;
    },
  });
}

export default useIsProjectDeveloper;
