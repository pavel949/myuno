import { useMemo } from 'react';
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
  return useQuery({
    queryKey: ['feature-flags-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .like('key', `${FLAG_PREFIX}%`);

      if (error) throw error;

      const map = new Map<string, StoredFlagValue>();
      (data || []).forEach(row => {
        const flagKey = row.key.replace(FLAG_PREFIX, '');
        try {
          const val = typeof row.value === 'string' ? JSON.parse(row.value as string) : row.value;
          map.set(flagKey, val as StoredFlagValue);
        } catch {
          map.set(flagKey, { enabled: Boolean(row.value) });
        }
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
  const { data: dbOverrides } = useDbFlagOverrides();

  const context = useMemo(() => ({
    userId: user?.id,
    userRoles: (roles ?? []).map(r => r.role),
  }), [user?.id, roles]);

  const isEnabled = useMemo(() => {
    return (flagKey: FeatureFlagKey): boolean => {
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
  }, [context, dbOverrides]);

  const allFlags = useMemo(() => {
    const result = getAllFlags(context);
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
  }, [context, dbOverrides]);

  return {
    isEnabled,
    allFlags,
    flags: FEATURE_FLAGS,
    dbOverrides,
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
  const { data: dbOverrides, isLoading } = useDbFlagOverrides();

  const mergedFlags = useMemo(() => {
    return Object.entries(FEATURE_FLAGS).map(([constKey, flag]) => {
      const dbVal = dbOverrides?.get(flag.key);
      return {
        constKey,
        key: flag.key,
        description: flag.description,
        enabled: dbVal !== undefined ? dbVal.enabled : flag.enabled,
        rolloutPct: dbVal?.rolloutPct ?? flag.rolloutPercentage ?? 100,
        hasDbOverride: dbVal !== undefined,
        allowedRoles: flag.allowedRoles,
      };
    });
  }, [dbOverrides]);

  return { flags: mergedFlags, isLoading };
}

/**
 * Admin hook: toggle a feature flag in system_settings.
 */
export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ flagKey, enabled, rolloutPct }: { flagKey: string; enabled: boolean; rolloutPct?: number }) => {
      const dbKey = `${FLAG_PREFIX}${flagKey}`;
      const value = JSON.stringify({ enabled, rolloutPct: rolloutPct ?? 100 });

      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', dbKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value } as any)
          .eq('key', dbKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert({ key: dbKey, value } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags-db'] });
    },
  });
}
