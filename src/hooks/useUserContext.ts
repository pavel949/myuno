import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { type AppRole } from '@/types/auth';

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

// Re-export for backward compatibility
export type { AppRole } from '@/types/auth';

/**
 * Hook for managing user's active context (role + org) stored in database.
 * 
 * Role sources (merged):
 * 1. user_roles table (platform roles: admin, uno_team, staff, etc.)
 * 2. management_company_members (→ adds 'owner' role)
 * 3. org_members (→ adds 'vendor'/'owner' based on org_type)
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
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Fetch user's org memberships (Clean Core orgs)
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
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Fetch user roles from user_roles table
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []).map(r => String(r.role));
    },
    enabled: !!user?.id,
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Fetch MC memberships — the PRIMARY source for 'owner' role
  const { data: mcMemberships, isLoading: mcLoading } = useQuery({
    queryKey: ['user-mc-membership-roles', user?.id],
    queryFn: async (): Promise<{ company_id: string; role: string }[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('management_company_members')
        .select('company_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id,
    ...CACHE_PROFILES.DYNAMIC,
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
    onMutate: async ({ role, orgId }) => {
      const contextKey = ['user-active-context', user?.id] as const;
      await queryClient.cancelQueries({ queryKey: contextKey });
      const previousContext = queryClient.getQueryData<UserActiveContext | null>(contextKey);

      queryClient.setQueryData<UserActiveContext | null>(contextKey, (old) => ({
        id: old?.id ?? `temp-${user?.id ?? 'user'}`,
        user_id: user?.id ?? old?.user_id ?? '',
        active_role: role,
        active_org_id: orgId || null,
        updated_at: new Date().toISOString(),
      }));

      return { previousContext };
    },
    onError: (_error, _variables, context) => {
      const contextKey = ['user-active-context', user?.id] as const;
      if (context?.previousContext !== undefined) {
        queryClient.setQueryData(contextKey, context.previousContext);
      }
    },
    onSuccess: (data) => {
      const contextKey = ['user-active-context', user?.id] as const;
      queryClient.setQueryData(contextKey, data);
      queryClient.invalidateQueries({ queryKey: contextKey });
    },
  });

  // Get orgs by type - memoized
  const vendorOrgs = useMemo(
    () => memberships?.filter(m => m.org?.org_type === 'vendor') || [],
    [memberships]
  );
  const ownerOrgs = useMemo(
    () => memberships?.filter(m => m.org?.org_type === 'owner') || [],
    [memberships]
  );

  // Normalize userRoles to string array - memoized
  const normalizedRoles = useMemo(() => 
    (userRoles || []).map((r: unknown) => 
      typeof r === 'string' ? r : (r as { role?: string })?.role || ''
    ).filter(Boolean),
    [userRoles]
  );

  // Whether user is an MC member (management_company_members)
  const hasMCMembership = useMemo(() => (mcMemberships || []).length > 0, [mcMemberships]);

  // Determine available roles from ALL sources - memoized
  const availableRoles = useMemo(() => {
    const roles: AppRole[] = ['user'];
    
    // From org_members
    if (vendorOrgs.length > 0 || normalizedRoles.includes('vendor')) {
      roles.push('vendor');
    }
    
    // From org_members OR management_company_members OR user_roles
    if (
      ownerOrgs.length > 0 || 
      hasMCMembership || 
      normalizedRoles.includes('property_owner') || 
      normalizedRoles.includes('owner')
    ) {
      roles.push('owner');
    }
    
    if (normalizedRoles.includes('admin')) {
      roles.push('admin');
    }
    if (normalizedRoles.includes('staff')) {
      roles.push('staff');
    }
    if (normalizedRoles.includes('uno_team')) {
      roles.push('uno_team');
    }
    
    return roles;
  }, [vendorOrgs.length, ownerOrgs.length, hasMCMembership, normalizedRoles]);

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
    
    // Loading state - includes MC membership loading
    isLoading: contextLoading || membershipsLoading || rolesLoading || mcLoading,
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
