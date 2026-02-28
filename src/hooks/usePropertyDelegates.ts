import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DelegateRole = 'trustee' | 'agent' | 'manager' | 'management_company' | 'owner_readonly';
export type DelegateStatus = 'pending' | 'active' | 'revoked' | 'expired';

export interface DelegatePermissions {
  view: boolean;
  edit: boolean;
  financials: boolean;
  bookings: boolean;
  maintenance: boolean;
}

export interface PropertyDelegate {
  id: string;
  property_id: string;
  user_id: string | null;
  role: DelegateRole;
  permissions: DelegatePermissions;
  invited_by: string;
  invited_email: string | null;
  invited_name: string | null;
  status: DelegateStatus;
  accepted_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface PropertyActivityLog {
  id: string;
  property_id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  actor?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const ROLE_LABELS = {
  trustee: { en: 'Trustee', ru: 'Доверенное лицо' },
  agent: { en: 'Agent', ru: 'Агент' },
  manager: { en: 'Manager', ru: 'Управляющий' },
  management_company: { en: 'Management Company', ru: 'Управляющая компания' },
  owner_readonly: { en: 'Owner (Read-Only)', ru: 'Собственник (просмотр)' },
} as const;

export const ROLE_DESCRIPTIONS = {
  trustee: { 
    en: 'Full access except ownership transfer', 
    ru: 'Полный доступ кроме передачи права собственности' 
  },
  agent: { 
    en: 'Can manage bookings and calendar', 
    ru: 'Управление бронированиями и календарём' 
  },
  manager: { 
    en: 'Bookings, finances, and maintenance', 
    ru: 'Бронирования, финансы и обслуживание' 
  },
  management_company: { 
    en: 'Full property management', 
    ru: 'Полное управление недвижимостью' 
  },
  owner_readonly: {
    en: 'View-only access to property data and reports',
    ru: 'Просмотр данных и отчётов по объекту'
  },
} as const;

export const DEFAULT_PERMISSIONS: Record<DelegateRole, DelegatePermissions> = {
  trustee: { view: true, edit: true, financials: true, bookings: true, maintenance: true },
  agent: { view: true, edit: false, financials: false, bookings: true, maintenance: false },
  manager: { view: true, edit: true, financials: true, bookings: true, maintenance: true },
  management_company: { view: true, edit: true, financials: true, bookings: true, maintenance: true },
  owner_readonly: { view: true, edit: false, financials: true, bookings: true, maintenance: false },
};

export function usePropertyDelegates(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-delegates', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('property_delegates')
        .select(`
          *,
          profile:profiles!property_delegates_user_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq('property_id', propertyId)
        .neq('status', 'revoked')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PropertyDelegate[];
    },
    enabled: !!user && !!propertyId,
  });
}

export function useMyDelegations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-delegations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('property_delegates')
        .select(`
          *,
          property:properties!property_id(id, title, title_ru, address, cover_image)
        `)
        .or(`user_id.eq.${user.id},invited_email.eq.${user.email}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useInviteDelegate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      property_id: string;
      role: DelegateRole;
      invited_email: string;
      invited_name?: string;
      permissions?: Partial<DelegatePermissions>;
      expires_at?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const permissions = {
        ...DEFAULT_PERMISSIONS[data.role],
        ...data.permissions,
      };

      const { data: result, error } = await supabase
        .from('property_delegates')
        .insert({
          property_id: data.property_id,
          role: data.role,
          invited_email: data.invited_email.toLowerCase(),
          invited_name: data.invited_name,
          invited_by: user.id,
          permissions,
          expires_at: data.expires_at,
          notes: data.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-delegates', variables.property_id] });
      toast.success('Приглашение отправлено');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Этот пользователь уже приглашён');
      } else {
        toast.error('Ошибка: ' + error.message);
      }
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (delegateId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_delegates')
        .update({
          user_id: user.id,
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', delegateId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-delegations'] });
      queryClient.invalidateQueries({ queryKey: ['property-delegates'] });
      toast.success('Приглашение принято');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

export function useUpdateDelegate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PropertyDelegate> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('property_delegates')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-delegates', data.property_id] });
      toast.success('Права обновлены');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

export function useRevokeDelegate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('property_delegates')
        .update({ status: 'revoked' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-delegates', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['my-delegations'] });
      toast.success('Доступ отозван');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

export function usePropertyActivityLog(propertyId?: string, limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-activity', propertyId, limit],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('property_activity_log')
        .select(`
          *,
          actor:profiles!property_activity_log_actor_id_fkey(id, full_name, avatar_url)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as PropertyActivityLog[];
    },
    enabled: !!user && !!propertyId,
  });
}

// Helper to check user's role for a property
export function usePropertyUserRole(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-user-role', propertyId, user?.id],
    queryFn: async () => {
      if (!propertyId || !user) return null;

      // First check if owner
      const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single();

      if (property?.owner_id === user.id) {
        return { role: 'owner' as const, permissions: DEFAULT_PERMISSIONS.trustee };
      }

      // Check delegate
      const { data: delegate } = await supabase
        .from('property_delegates')
        .select('role, permissions')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (delegate) {
        return { 
          role: delegate.role as DelegateRole, 
          permissions: delegate.permissions as unknown as DelegatePermissions 
        };
      }

      return null;
    },
    enabled: !!user && !!propertyId,
  });
}
