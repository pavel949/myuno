import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { isFeatureEnabled, getAllFlags, FeatureFlagKey, FEATURE_FLAGS } from '@/lib/featureFlags';

/**
 * React hook for checking feature flags
 * Automatically includes user context for personalized rollouts
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const { roles } = useUserRoles();

  const context = useMemo(() => ({
    userId: user?.id,
    userRoles: roles.map(r => r.role),
  }), [user?.id, roles]);

  const isEnabled = useMemo(() => {
    return (flagKey: FeatureFlagKey): boolean => {
      return isFeatureEnabled(flagKey, context);
    };
  }, [context]);

  const allFlags = useMemo(() => {
    return getAllFlags(context);
  }, [context]);

  return {
    isEnabled,
    allFlags,
    flags: FEATURE_FLAGS,
  };
}

/**
 * Simple hook for checking a single feature flag
 */
export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const { isEnabled } = useFeatureFlags();
  return useMemo(() => isEnabled(flagKey), [isEnabled, flagKey]);
}
