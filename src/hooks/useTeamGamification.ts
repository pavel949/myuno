import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamGamification {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  badges: string[];
  weekly_points: number;
  monthly_points: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAchievement {
  id: string;
  key: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  icon: string;
  category: string;
  points_required: number;
  is_secret: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: TeamAchievement;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  level: number;
  streak_days: number;
  specializations: string[];
  rank?: number;
}

export const LEVEL_CONFIG = [
  { level: 1, name_en: 'Rookie', name_ru: 'Новичок', min_points: 0, color: 'text-gray-500' },
  { level: 2, name_en: 'Specialist', name_ru: 'Специалист', min_points: 500, color: 'text-blue-500' },
  { level: 3, name_en: 'Professional', name_ru: 'Профи', min_points: 2000, color: 'text-purple-500' },
  { level: 4, name_en: 'Expert', name_ru: 'Эксперт', min_points: 5000, color: 'text-amber-500' },
  { level: 5, name_en: 'Legend', name_ru: 'Легенда', min_points: 10000, color: 'text-red-500' },
];

/**
 * Get level info from points
 */
export function getLevelFromPoints(points: number) {
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (points >= LEVEL_CONFIG[i].min_points) {
      return LEVEL_CONFIG[i];
    }
  }
  return LEVEL_CONFIG[0];
}

/**
 * Get progress to next level
 */
export function getLevelProgress(points: number): { current: number; next: number; progress: number } {
  const currentLevel = getLevelFromPoints(points);
  const nextLevelIndex = LEVEL_CONFIG.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= LEVEL_CONFIG.length) {
    return { current: currentLevel.min_points, next: currentLevel.min_points, progress: 100 };
  }
  
  const nextLevel = LEVEL_CONFIG[nextLevelIndex];
  const pointsInLevel = points - currentLevel.min_points;
  const pointsNeeded = nextLevel.min_points - currentLevel.min_points;
  const progress = Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100));
  
  return { current: currentLevel.min_points, next: nextLevel.min_points, progress };
}

/**
 * Hook for current user's gamification stats
 */
export function useMyGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-gamification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('team_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as TeamGamification | null;
    },
    enabled: !!user?.id,
  });

  const { data: achievements } = useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('team_user_achievements')
        .select(`
          *,
          achievement:team_achievements(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as UserAchievement[];
    },
    enabled: !!user?.id,
  });

  const level = stats ? getLevelFromPoints(stats.total_points) : LEVEL_CONFIG[0];
  const progress = stats ? getLevelProgress(stats.total_points) : { current: 0, next: 500, progress: 0 };

  return {
    stats,
    achievements,
    level,
    progress,
    isLoading,
  };
}

/**
 * Hook for all achievements definitions
 */
export function useAllAchievements() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_achievements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return (data || []) as TeamAchievement[];
    },
  });

  return { achievements, isLoading };
}

/**
 * Hook for leaderboard
 */
export function useTeamLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'all_time') {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['team-leaderboard', period],
    queryFn: async () => {
      // First get gamification data
      const { data: gamificationData, error: gamError } = await supabase
        .from('team_gamification')
        .select('*')
        .order(period === 'weekly' ? 'weekly_points' : period === 'monthly' ? 'monthly_points' : 'total_points', { ascending: false })
        .limit(50);

      if (gamError) throw gamError;

      if (!gamificationData || gamificationData.length === 0) return [];

      // Get team member details
      const userIds = gamificationData.map(g => g.user_id);
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, display_name, avatar_url, specializations')
        .in('user_id', userIds);

      if (membersError) throw membersError;

      // Combine data
      const entries: LeaderboardEntry[] = gamificationData.map((g, index) => {
        const member = membersData?.find(m => m.user_id === g.user_id);
        return {
          user_id: g.user_id,
          display_name: member?.display_name || 'Team Member',
          avatar_url: member?.avatar_url,
          total_points: g.total_points,
          weekly_points: g.weekly_points,
          monthly_points: g.monthly_points,
          level: g.level,
          streak_days: g.streak_days,
          specializations: member?.specializations || [],
          rank: index + 1,
        };
      });

      return entries;
    },
  });

  return { leaderboard, isLoading };
}

/**
 * Hook to log activity and earn points
 */
export function useActivityLogger() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logActivity = useMutation({
    mutationFn: async ({
      actionType,
      points,
      entityType,
      entityId,
      metadata = {},
    }: {
      actionType: string;
      points: number;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Call the database function to add points
      const { data, error } = await supabase.rpc('add_team_points', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_points: points,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_metadata: metadata,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gamification'] });
      queryClient.invalidateQueries({ queryKey: ['team-leaderboard'] });
    },
  });

  return {
    logActivity: logActivity.mutateAsync,
    isLogging: logActivity.isPending,
  };
}
