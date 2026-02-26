import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityEntry {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

/**
 * Mutation to log a user action into team_activity_log.
 * Fire-and-forget — errors are silently ignored.
 */
export function useLogActivity() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: {
      action_type: string;
      entity_type?: string;
      entity_id?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;
      await supabase.from('team_activity_log').insert({
        user_id: user.id,
        action_type: entry.action_type,
        entity_type: entry.entity_type ?? null,
        entity_id: entry.entity_id ?? null,
        metadata: entry.metadata ?? null,
      } as any);
    },
  });
}

/**
 * Query to fetch the last 100 activity entries for a specific team member.
 */
export function useMemberActivityLog(userId?: string) {
  return useQuery({
    queryKey: ['team-activity-log', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_activity_log')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as ActivityEntry[];
    },
    enabled: !!userId,
  });
}
