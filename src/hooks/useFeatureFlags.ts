import { useMemo, useRef, useEffect } from 'react';
import { saveAdminSystemSettings } from '@/lib/adminSystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled, getAllFlags, FeatureFlagKey, FEATURE_FLAGS } from '@/lib/featureFlags';

const FLAG_PREFIX = 'feature_flag:';

interface StoredFlagValue {
  enabled: boolean;
  rolloutPct?: number;
}

/**
 * Load feature flag overrides from system_settings table.
 */
function useDbFlagOverrides() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feature-flags-db', user?.id ?? 'anonymous'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .like('key', `${FLAG_PREFIX}%`);

      if (error) throw error;

      if (!Array.isArray(data)) throw new Error('Feature flag settings could not be verified.');
      const map = new Map<string, StoredFlagValue>();
      data.forEach(row => {
        const flagKey = row.key.replace(FLAG_PREFIX, '');
        const val: unknown = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (typeof val === 'boolean') { map.set(flagKey, { enabled: val }); return; }
        if (typeof val !== 'object' || val === null || !('enabled' in val) || typeof val.enabled !== 'boolean') throw new Error('Feature flag settings could not be verified.');
        if ('rolloutPct' in val && (typeof val.rolloutPct !== 'number' || !Number.isFinite(val.rolloutPct) || val.rolloutPct < 0 || val.rolloutPct > 100)) throw new Error('Feature flag rollout could not be verified.');
        map.set(flagKey, val as StoredFlagValue);
      });
      return map;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * React hook for checking feature flags.
 * Loads DB overrides from system_settings, falls back to hardcoded defaults.
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const { data: dbOverrides, error, isLoading } = useDbFlagOverrides();

  const context = useMemo(() => ({
    userId: user?.id,
    userRoles: (roles ?? []).map(r => r.role),
  }), [user?.id, roles]);

  const isEnabled = useMemo(() => {
    return (flagKey: FeatureFlagKey): boolean => {
      if (error || isLoading) return false;
      // Check DB override first
      const flag = FEATURE_FLAGS[flagKey];
      if (flag && dbOverrides?.has(flag.key)) {
        const override = dbOverrides.get(flag.key)!;
        if (!override.enabled) return false;
        // If DB says enabled, still check role/rollout from hardcoded config
        return isFeatureEnabled(flagKey, context);
      }
      return isFeatureEnabled(flagKey, context);
    };
  }, [context, dbOverrides, error, isLoading]);

  const allFlags = useMemo(() => {
    const result = getAllFlags(context);
    if (error || isLoading) { for (const key of Object.keys(result)) result[key] = false; return result; }
    // Apply DB overrides
    if (dbOverrides) {
      for (const [constKey, flag] of Object.entries(FEATURE_FLAGS)) {
        const dbVal = dbOverrides.get(flag.key);
        if (dbVal !== undefined) {
          result[constKey] = dbVal.enabled && result[constKey];
        }
      }
    }
    return result;
  }, [context, dbOverrides, error, isLoading]);

  return {
    isEnabled,
    allFlags,
    flags: FEATURE_FLAGS,
    dbOverrides,
    error,
    isLoading,
  };
}

/**
 * Simple hook for checking a single feature flag
 */
export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const { isEnabled } = useFeatureFlags();
  return useMemo(() => isEnabled(flagKey), [isEnabled, flagKey]);
}

/**
 * Admin hook: get all flags with merged DB state for the flag manager UI.
 */
export function useAdminFeatureFlags() {
  const { user } = useAuth();
  const { roles, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useUserRoles();
  const { data: dbOverrides, isLoading: dbLoading, isFetching, error: dbError, refetch } = useDbFlagOverrides();
  const isLoading = dbLoading || rolesLoading;
  const error = dbError || rolesError;

  const mergedFlags = useMemo(() => {
    if (error || isLoading) return [];
    const context = { userId: user?.id, userRoles: (roles ?? []).map(role => role.role) };
    return Object.entries(FEATURE_FLAGS).map(([constKey, flag]) => {
      const dbVal = dbOverrides?.get(flag.key);
      return {
        constKey,
        key: flag.key,
        description: flag.description,
        enabled: dbVal !== undefined ? dbVal.enabled : flag.enabled,
        effectiveEnabled: (dbVal !== undefined ? dbVal.enabled : flag.enabled) && isFeatureEnabled(constKey as FeatureFlagKey, context),
        rolloutPct: dbVal?.rolloutPct ?? flag.rolloutPercentage ?? 100,
        hasDbOverride: dbVal !== undefined,
        allowedRoles: flag.allowedRoles,
      };
    });
  }, [dbOverrides, error, isLoading, user?.id, roles]);

  const reload = async () => {
    const [flagsResult, rolesResult] = await Promise.all([refetch(), refetchRoles()]);
    return { error: flagsResult.error || rolesResult.error };
  };
  return { flags: mergedFlags, isLoading, isFetching, error, refetch: reload };
}

/**
 * Admin hook: toggle a feature flag in system_settings.
 */
export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const actorId = user?.id ?? null;
  const actor = useRef(actorId); actor.current = actorId;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  return useMutation({
    mutationFn: async ({ flagKey, enabled, rolloutPct }: { flagKey: string; enabled: boolean; rolloutPct?: number }) => {
      const expected = actorId;
      const assertCurrent = () => { if (!expected || actor.current !== expected || !alive.current) throw new Error('Settings account changed. Reload before continuing.'); };
      if (!Object.values(FEATURE_FLAGS).some(flag => flag.key === flagKey)) throw new Error('Unknown feature flag');
      if (rolloutPct !== undefined && (!Number.isFinite(rolloutPct) || rolloutPct < 0 || rolloutPct > 100)) throw new Error('Invalid rollout');
      await saveAdminSystemSettings([{ key: `${FLAG_PREFIX}${flagKey}`, value: JSON.stringify({ enabled, rolloutPct: rolloutPct ?? 100 }) }], assertCurrent);
      return { actorId: expected };
    },
    onSuccess: result => {
      if (actor.current !== result.actorId || !alive.current) return;
      void queryClient.invalidateQueries({ queryKey: ['feature-flags-db'] });
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}
