import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Org {
  id: string;
  name: string;
  name_ru?: string;
  org_type: 'vendor' | 'owner' | 'operator' | 'platform';
  logo_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  is_verified: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  is_active: boolean;
  created_at: string;
  org?: Org;
}

export interface UserActiveContext {
  id: string;
  user_id: string;
  active_role: string;
  active_org_id: string | null;
  updated_at: string;
}

export type AppRole = 'user' | 'vendor' | 'owner' | 'admin' | 'staff' | 'uno_team';

/**
 * Hook for managing user's active context (role + org) stored in database
 * This replaces localStorage-based role switching
 */
export function useUserContext() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's active context from DB
  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: ['user-active-context', user?.id],
    queryFn: async (): Promise<UserActiveContext | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_active_context')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no context exists, create default
      if (!data) {
        const { data: newContext, error: createError } = await supabase
          .from('user_active_context')
          .insert({ user_id: user.id, active_role: 'user' })
          .select()
          .single();
        
        if (createError) throw createError;
        return newContext as UserActiveContext;
      }

      return data as UserActiveContext;
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch user's org memberships
  const { data: memberships, isLoading: membershipsLoading } = useQuery({
    queryKey: ['org-memberships', user?.id],
    queryFn: async (): Promise<OrgMember[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          org:orgs(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as OrgMember[];
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch user roles from user_roles table (legacy support)
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  // Switch active role and optionally org
  const switchContext = useMutation({
    mutationFn: async ({ role, orgId }: { role: AppRole; orgId?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_active_context')
        .upsert({
          user_id: user.id,
          active_role: role,
          active_org_id: orgId || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as UserActiveContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-active-context', user?.id] });
    },
  });

  // Get orgs by type
  const vendorOrgs = memberships?.filter(m => m.org?.org_type === 'vendor') || [];
  const ownerOrgs = memberships?.filter(m => m.org?.org_type === 'owner') || [];

  // Determine available roles based on memberships and user_roles
  const availableRoles: AppRole[] = ['user'];
  
  if (vendorOrgs.length > 0 || userRoles?.includes('vendor')) {
    availableRoles.push('vendor');
  }
  if (ownerOrgs.length > 0 || userRoles?.includes('property_owner') || userRoles?.includes('owner')) {
    availableRoles.push('owner');
  }
  if (userRoles?.includes('admin')) {
    availableRoles.push('admin');
  }
  if (userRoles?.includes('staff')) {
    availableRoles.push('staff');
  }

  // Get current active org
  const activeOrg = memberships?.find(m => m.org_id === context?.active_org_id)?.org || null;

  // Check if user has a specific role
  const hasRole = (role: AppRole): boolean => {
    return availableRoles.includes(role);
  };

  // Check if user is member of org
  const isOrgMember = (orgId: string): boolean => {
    return memberships?.some(m => m.org_id === orgId && m.is_active) || false;
  };

  return {
    // Current context
    activeRole: (context?.active_role as AppRole) || 'user',
    activeOrgId: context?.active_org_id || null,
    activeOrg,
    
    // Memberships
    memberships: memberships || [],
    vendorOrgs,
    ownerOrgs,
    
    // Available roles
    availableRoles,
    hasRole,
    isOrgMember,
    
    // Actions
    switchContext: switchContext.mutateAsync,
    isSwitching: switchContext.isPending,
    
    // Loading state - MUST include rolesLoading to prevent premature redirects
    isLoading: contextLoading || membershipsLoading || rolesLoading,
  };
}

/**
 * Hook for managing organizations
 */
export function useOrgs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Create new organization
  const createOrg = useMutation({
    mutationFn: async (input: {
      name: string;
      name_ru?: string;
      org_type: 'vendor' | 'owner' | 'operator';
      email?: string;
      phone?: string;
      address?: string;
      logo_url?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create org
      const { data: org, error: orgError } = await supabase
        .from('orgs')
        .insert(input)
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      return org as Org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-memberships', user?.id] });
    },
  });

  return {
    createOrg: createOrg.mutateAsync,
    isCreating: createOrg.isPending,
  };
}
