import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type TeamSpecialization = 
  | 'content_manager'
  | 'support_operator'
  | 'sales_manager'
  | 'moderation_officer'
  | 'team_lead';

export interface TeamMember {
  id: string;
  user_id: string;
  specializations: TeamSpecialization[];
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  shift_schedule: Record<string, string>;
  is_active: boolean;
  hired_at: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export const SPECIALIZATION_LABELS: Record<TeamSpecialization, { en: string; ru: string; icon: string; color: string }> = {
  content_manager: { en: 'Content Manager', ru: 'Контент-менеджер', icon: 'file-edit', color: 'bg-blue-500' },
  support_operator: { en: 'Support Operator', ru: 'Оператор поддержки', icon: 'headphones', color: 'bg-green-500' },
  sales_manager: { en: 'Sales Manager', ru: 'Менеджер по продажам', icon: 'trending-up', color: 'bg-purple-500' },
  moderation_officer: { en: 'Moderator', ru: 'Модератор', icon: 'shield-check', color: 'bg-amber-500' },
  team_lead: { en: 'Team Lead', ru: 'Тимлид', icon: 'crown', color: 'bg-red-500' },
};

/**
 * Hook to get and manage current user's team member profile
 */
export function useTeamMember() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: member, isLoading, error } = useQuery({
    queryKey: ['team-member', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as TeamMember | null;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<TeamMember, 'display_name' | 'avatar_url' | 'phone' | 'bio'>>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-member', user?.id] });
      toast({ title: 'Профиль обновлён' });
    },
    onError: () => {
      toast({ title: 'Ошибка обновления', variant: 'destructive' });
    },
  });

  const hasSpecialization = (spec: TeamSpecialization): boolean => {
    return member?.specializations?.includes(spec) ?? false;
  };

  const isTeamLead = member?.specializations?.includes('team_lead') ?? false;

  return {
    member,
    isLoading,
    error,
    hasSpecialization,
    isTeamLead,
    updateProfile: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
  };
}

/**
 * Hook to get all team members (for leaderboards, chat, etc.)
 */
export function useTeamMembers() {
  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });

  return { members, isLoading };
}
