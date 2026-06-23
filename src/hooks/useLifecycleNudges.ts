/**
 * @module useLifecycleNudges
 * @description React hook over the canonical profile that derives the
 * § 9.4 lifecycle-trigger nudges. Thin wrapper around the pure
 * `computeLifecycleNudges` so UI never re-implements the rules.
 *
 * Returns `[]` for guests / loading / no-signal profiles, so consumers can
 * render nothing without extra guards.
 */

import { useMemo } from 'react';
import { useCanonicalProfile } from '@/hooks/useCanonicalProfile';
import {
  computeLifecycleNudges,
  type LifecycleNudge,
} from '@/lib/segmentation/lifecycleNudges';

export function useLifecycleNudges(options?: { limit?: number }): {
  nudges: LifecycleNudge[];
  isLoading: boolean;
} {
  const { profile, isLoading } = useCanonicalProfile();
  const limit = options?.limit;

  const nudges = useMemo(
    () => computeLifecycleNudges(profile, { limit }),
    [profile, limit],
  );

  return { nudges, isLoading };
}
