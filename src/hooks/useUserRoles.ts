import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'guest' | 'user' | 'tourist' | 'resident' | 'partner' | 'owner' | 'property_owner' | 'vendor' | 'staff' | 'admin' | 'ombudsman';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// Role metadata for UI
export const ROLE_CONFIG: Record<AppRole, {
  labelEn: string;
  labelRu: string;
  icon: string;
  color: string;
  path: string;
  description?: {
    en: string;
    ru: string;
  };
}> = {
  guest: {
    labelEn: 'Guest',
    labelRu: 'Гость',
    icon: 'User',
    color: 'from-gray-400 to-gray-500',
    path: '/',
  },
  user: {
    labelEn: 'Client',
    labelRu: 'Клиент',
    icon: 'User',
    color: 'from-blue-400 to-blue-500',
    path: '/',
    description: {
      en: 'Browse services and make bookings',
      ru: 'Просматривайте услуги и делайте заказы',
    },
  },
  tourist: {
    labelEn: 'Tourist',
    labelRu: 'Турист',
    icon: 'Plane',
    color: 'from-cyan-400 to-cyan-500',
    path: '/',
  },
  resident: {
    labelEn: 'Resident',
    labelRu: 'Резидент',
    icon: 'Home',
    color: 'from-green-400 to-green-500',
    path: '/',
  },
  partner: {
    labelEn: 'Partner',
    labelRu: 'Партнёр',
    icon: 'Handshake',
    color: 'from-indigo-400 to-indigo-500',
    path: '/vendor',
  },
  owner: {
    labelEn: 'Owner',
    labelRu: 'Владелец',
    icon: 'Building',
    color: 'from-amber-400 to-amber-500',
    path: '/owner',
  },
  property_owner: {
    labelEn: 'Property Owner',
    labelRu: 'Владелец недвижимости',
    icon: 'Building2',
    color: 'from-teal-400 to-teal-500',
    path: '/owner',
    description: {
      en: 'Manage your properties and bookings',
      ru: 'Управляйте своей недвижимостью и бронированиями',
    },
  },
  vendor: {
    labelEn: 'Service Provider',
    labelRu: 'Поставщик услуг',
    icon: 'Store',
    color: 'from-purple-400 to-purple-500',
    path: '/vendor',
    description: {
      en: 'Offer tours, activities, and services',
      ru: 'Предлагайте туры, впечатления и услуги',
    },
  },
  staff: {
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    icon: 'UserCog',
    color: 'from-orange-400 to-orange-500',
    path: '/admin',
  },
  admin: {
    labelEn: 'Admin',
    labelRu: 'Администратор',
    icon: 'Shield',
    color: 'from-red-400 to-red-500',
    path: '/admin',
  },
  ombudsman: {
    labelEn: 'Ombudsman',
    labelRu: 'Омбудсмен',
    icon: 'Scale',
    color: 'from-slate-400 to-slate-500',
    path: '/admin',
  },
};

// Roles that users can self-activate
export const ACTIVATABLE_ROLES: AppRole[] = ['property_owner', 'vendor'];

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
    ['user', 'property_owner', 'vendor', 'admin', 'staff'].includes(role)
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

// Hook for managing active role in UI
export function useActiveRole() {
  const { activeRoles } = useUserRoles();
  
  // Get stored active role from localStorage
  const getStoredRole = (): AppRole => {
    const stored = localStorage.getItem('myuno-active-role');
    if (stored && activeRoles.includes(stored as AppRole)) {
      return stored as AppRole;
    }
    // Default to first available switchable role or 'user'
    return activeRoles.find(r => ['property_owner', 'vendor', 'admin'].includes(r)) || 'user';
  };

  const setActiveRole = (role: AppRole) => {
    localStorage.setItem('myuno-active-role', role);
    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', { key: 'myuno-active-role', newValue: role }));
  };

  return {
    activeRole: getStoredRole(),
    setActiveRole,
  };
}
