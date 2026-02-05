import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  type AppRole, 
  ROLE_METADATA, 
  SELF_ACTIVATABLE_ROLES,
  SWITCHABLE_ROLES 
} from '@/types/auth';

// Re-export AppRole for backward compatibility
export type { AppRole } from '@/types/auth';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// Role metadata for UI
// Map ROLE_METADATA to legacy ROLE_CONFIG format for backward compatibility
export const ROLE_CONFIG: Record<AppRole, {
  labelEn: string;
  labelRu: string;
  icon: string;
  color: string;
  path: string;
  description?: { en: string; ru: string };
}> = Object.fromEntries(
  Object.entries(ROLE_METADATA).map(([role, meta]) => [
    role,
    {
      labelEn: meta.labelEn,
      labelRu: meta.labelRu,
      icon: meta.icon,
      color: meta.color,
      path: meta.defaultPath,
      ...(meta.descriptionEn && meta.descriptionRu ? {
        description: { en: meta.descriptionEn, ru: meta.descriptionRu }
      } : {}),
    }
  ])
) as Record<AppRole, { labelEn: string; labelRu: string; icon: string; color: string; path: string; description?: { en: string; ru: string } }>;

// Re-export from canonical source
export const ACTIVATABLE_ROLES: AppRole[] = [...SELF_ACTIVATABLE_ROLES];

export function useUserRoles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []) as UserRole[];
    },
    enabled: !!user?.id,
  });

  const addRole = useMutation({
    mutationFn: async (role: AppRole) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', user?.id] });
    },
  });

  const removeRole = useMutation({
    mutationFn: async (role: AppRole) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', user?.id] });
    },
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.some(r => r.role === role) || false;
  };

  const activeRoles = roles?.map(r => r.role) || [];

  // Get available roles for switching (only roles user has)
  const switchableRoles = activeRoles.filter(role => 
    SWITCHABLE_ROLES.includes(role as AppRole)
  );

  return {
    roles,
    activeRoles,
    switchableRoles,
    isLoading,
    hasRole,
    addRole: addRole.mutateAsync,
    removeRole: removeRole.mutateAsync,
    isAddingRole: addRole.isPending,
    isRemovingRole: removeRole.isPending,
  };
}

// Note: useActiveRole has been removed
// Use useUserContext from '@/hooks/useUserContext' for role management
// It provides: activeRole, switchContext, availableRoles, hasRole
