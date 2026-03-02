/**
 * @module useResolvedContext
 * @description Server-side context resolution hook.
 * 
 * This is the SINGLE SOURCE OF TRUTH for user permissions in myUNO.
 * Role derivation happens on the server via resolve_user_context() RPC.
 * Client-side code should NEVER derive roles from memberships directly.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export type ContextMode = 'user' | 'owner' | 'mc' | 'investor' | 'vendor' | 'admin' | 'team';

export interface ResolvedContext {
  mode: ContextMode;
  entity_id: string | null;
  role: string;
  permissions: string[];
  resolved_at: string;
}

/**
 * Hook that resolves the user's active context from the server.
 * Uses resolve_user_context() RPC which checks:
 * - user_active_context table for current mode
 * - management_company_members for MC role
 * - team_member_permissions for granular access
 * - user_roles for platform roles
 */
export function useResolvedContext() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: resolved, isLoading, error } = useQuery({
    queryKey: ['resolved-context', user?.id],
    queryFn: async (): Promise<ResolvedContext> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('resolve_user_context', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const ctx = data as unknown as ResolvedContext;
      return {
        mode: ctx.mode as ContextMode,
        entity_id: ctx.entity_id,
        role: ctx.role,
        permissions: ctx.permissions || [],
        resolved_at: ctx.resolved_at,
      };
    },
    enabled: !!user?.id,
    ...CACHE_PROFILES.DYNAMIC,
  });

  /** Switch context mode (e.g., from 'owner' to 'mc') */
  const switchMode = useMutation({
    mutationFn: async ({ mode, entityId }: { mode: ContextMode; entityId?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Upsert the user's active context
      const { error: upsertError } = await supabase
        .from('user_active_context')
        .upsert({
          user_id: user.id,
          mode,
          entity_id: entityId || null,
          active_role: mode, // keep legacy column in sync
          active_org_id: entityId || null, // keep legacy column in sync
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      // Re-resolve from server
      const { data, error } = await supabase.rpc('resolve_user_context', {
        p_user_id: user.id,
        p_mode: mode,
        p_entity_id: entityId || null,
      });

      if (error) throw error;
      return data as unknown as ResolvedContext;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['resolved-context', user?.id], data);
      // Invalidate company-scoped caches
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length === 0) return false;
          const prefix = String(key[0]);
          return !['resolved-context', 'user-roles', 'user-active-context', 'profile'].includes(prefix);
        },
      });
    },
  });

  /** Check if user has a specific permission in current context */
  const hasPermission = (module: string): boolean => {
    if (!resolved) return false;
    if (resolved.permissions.includes('*')) return true;
    return resolved.permissions.includes(module);
  };

  /** Check if user's current role matches */
  const isRole = (role: string): boolean => {
    return resolved?.role === role;
  };

  /** Check if user is in MC mode */
  const isMCMode = resolved?.mode === 'mc';
  const isAdminMode = resolved?.mode === 'admin' || resolved?.mode === 'team';

  return {
    context: resolved || null,
    mode: resolved?.mode || 'user',
    role: resolved?.role || 'user',
    entityId: resolved?.entity_id || null,
    permissions: resolved?.permissions || [],
    
    hasPermission,
    isRole,
    isMCMode,
    isAdminMode,
    
    switchMode: switchMode.mutateAsync,
    isSwitching: switchMode.isPending,
    
    isLoading,
    error,
  };
}
