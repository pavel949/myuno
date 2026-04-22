/**
 * @module useCanonicalProfile
 * @description React Query hook over the canonical segmentation profile.
 *
 * Pairs with `src/lib/canonical/profileApi.ts` and the SQL view
 * `v_profiles_canonical`. Use this hook anywhere UI needs to branch on
 * the canonical role / lifecycle stage / persona — do NOT re-query
 * `profiles` directly for those columns.
 *
 * Cache key: `['canonical-profile', userId]`. Invalidated by
 * `useUpdateCanonicalProfile()` after every mutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createErrorHandler } from '@/lib/errorHandler';
import {
  appendCanonicalArray,
  fetchCanonicalProfile,
  hasCanonicalRole,
  updateCanonicalProfile,
  type CanonicalProfile,
  type CanonicalProfilePatch,
} from '@/lib/canonical/profileApi';
import type { CanonicalRole } from '@/types/canonical';

const CANONICAL_PROFILE_KEY = (userId: string | undefined) => ['canonical-profile', userId] as const;

export function useCanonicalProfile() {
  const { user } = useAuth();
  const errorLog = createErrorHandler('useCanonicalProfile');

  const query = useQuery<CanonicalProfile | null>({
    queryKey: CANONICAL_PROFILE_KEY(user?.id),
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await fetchCanonicalProfile(user.id);
      } catch (err) {
        errorLog.silent(err, 'fetch_canonical_profile');
        throw err;
      }
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateCanonicalProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const errorLog = createErrorHandler('useUpdateCanonicalProfile');

  return useMutation({
    mutationFn: async (patch: CanonicalProfilePatch) => {
      if (!user?.id) throw new Error('User not authenticated');
      await updateCanonicalProfile(user.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANONICAL_PROFILE_KEY(user?.id) });
    },
    onError: (err) => errorLog.silent(err, 'update_canonical_profile'),
  });
}

export function useAppendCanonicalArray() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const errorLog = createErrorHandler('useAppendCanonicalArray');

  return useMutation({
    mutationFn: async (input: {
      field: 'activeClusters' | 'triggersActive' | 'specialStatus';
      values: string[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await appendCanonicalArray(user.id, input.field, input.values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANONICAL_PROFILE_KEY(user?.id) });
    },
    onError: (err) => errorLog.silent(err, 'append_canonical_array'),
  });
}

/**
 * Server-authoritative role probe. Resolves once and caches per `(userId, role)`.
 * Prefer reading `useCanonicalProfile().profile.primaryRole` for synchronous gating.
 */
export function useHasCanonicalRole(role: CanonicalRole) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['canonical-has-role', user?.id, role],
    queryFn: async () => {
      if (!user?.id) return false;
      return hasCanonicalRole(user.id, role);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
}
