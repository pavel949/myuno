import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const VERTICALS = [
  'tours',
  'yachts',
  'properties',
  'restaurants',
  'salons',
  'events',
  'clinics',
  'gyms',
  'water_activities',
  'cleaning',
  'babysitters',
  'education',
  'flowers',
  'pets',
  'vehicles',
  'insurance',
] as const;

export type Vertical = typeof VERTICALS[number];

export const VERTICAL_LABELS: Record<Vertical, { en: string; ru: string }> = {
  tours: { en: 'Tours', ru: 'Туры' },
  yachts: { en: 'Yachts', ru: 'Яхты' },
  properties: { en: 'Properties', ru: 'Недвижимость' },
  restaurants: { en: 'Restaurants', ru: 'Рестораны' },
  salons: { en: 'Beauty Salons', ru: 'Салоны красоты' },
  events: { en: 'Events', ru: 'События' },
  clinics: { en: 'Clinics', ru: 'Клиники' },
  gyms: { en: 'Fitness', ru: 'Фитнес' },
  water_activities: { en: 'Water Activities', ru: 'Водные активности' },
  cleaning: { en: 'Cleaning', ru: 'Уборка' },
  babysitters: { en: 'Babysitters', ru: 'Няни' },
  education: { en: 'Education', ru: 'Образование' },
  flowers: { en: 'Flowers', ru: 'Цветы' },
  pets: { en: 'Pet Services', ru: 'Услуги для животных' },
  vehicles: { en: 'Transport', ru: 'Транспорт' },
  insurance: { en: 'Insurance', ru: 'Страхование' },
};

export interface UnoTeamPermission {
  id: string;
  user_id: string;
  vertical: Vertical;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_submit_for_review: boolean;
  created_at: string;
  updated_at: string;
  granted_by: string | null;
}

export interface UnoTeamMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  permissions: UnoTeamPermission[];
}

// Hook for fetching UNO Team members and their permissions (admin use)
export function useUnoTeamMembers() {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['uno-team-members'],
    queryFn: async () => {
      // Get all users with uno_team role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'uno_team');

      if (roleError) throw roleError;

      const userIds = roleData?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Get permissions
      const { data: permissions, error: permError } = await supabase
        .from('uno_team_permissions')
        .select('*')
        .in('user_id', userIds);

      if (permError) throw permError;

      // Combine
      return (profiles || []).map(p => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
        permissions: (permissions || []).filter(perm => perm.user_id === p.id) as UnoTeamPermission[],
      })) as UnoTeamMember[];
    },
  });

  const updatePermission = useMutation({
    mutationFn: async ({
      userId,
      vertical,
      permissions,
    }: {
      userId: string;
      vertical: Vertical;
      permissions: Partial<Pick<UnoTeamPermission, 'can_create' | 'can_edit' | 'can_delete' | 'can_submit_for_review'>>;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('uno_team_permissions')
        .upsert({
          user_id: userId,
          vertical,
          ...permissions,
          granted_by: currentUser.user?.id,
        }, {
          onConflict: 'user_id,vertical',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uno-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['my-uno-permissions'] });
      toast('Права обновлены', { description: 'Изменения сохранены' });
    },
    onError: () => {
      toast.error('Ошибка', { description: 'Не удалось обновить права' });
    },
  });

  const removePermission = useMutation({
    mutationFn: async ({ userId, vertical }: { userId: string; vertical: Vertical }) => {
      const { error } = await supabase
        .from('uno_team_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('vertical', vertical);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uno-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['my-uno-permissions'] });
      toast('Доступ удалён');
    },
  });

  const grantAllPermissions = useMutation({
    mutationFn: async ({ userId, verticals }: { userId: string; verticals: Vertical[] }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const permissions = verticals.map(vertical => ({
        user_id: userId,
        vertical,
        can_create: true,
        can_edit: true,
        can_delete: false,
        can_submit_for_review: true,
        granted_by: currentUser.user?.id,
      }));

      const { error } = await supabase
        .from('uno_team_permissions')
        .upsert(permissions, { onConflict: 'user_id,vertical' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uno-team-members'] });
      toast('Права назначены');
    },
  });

  return {
    members,
    isLoading,
    updatePermission: updatePermission.mutateAsync,
    removePermission: removePermission.mutateAsync,
    grantAllPermissions: grantAllPermissions.mutateAsync,
    isUpdating: updatePermission.isPending,
  };
}

// Hook for current user's own permissions (UNO Team member use)
export function useMyUnoPermissions() {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['my-uno-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('uno_team_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as UnoTeamPermission[];
    },
    enabled: !!user?.id,
  });

  const canAccess = (vertical: Vertical, action: 'create' | 'edit' | 'delete' | 'submit'): boolean => {
    const perm = permissions?.find(p => p.vertical === vertical);
    if (!perm) return false;
    
    switch (action) {
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      case 'submit': return perm.can_submit_for_review;
      default: return false;
    }
  };

  const allowedVerticals = permissions?.filter(p => p.can_create).map(p => p.vertical) || [];

  return {
    permissions,
    isLoading,
    canAccess,
    allowedVerticals,
  };
}
