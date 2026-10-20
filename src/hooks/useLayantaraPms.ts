import type { QueryClient } from '@tanstack/react-query';
import { FEATURE_FLAGS_QUERY_KEY, fetchFlags, useFeatureFlag, useFeatureFlags } from '@/hooks/useFeatureFlag';

export const LAYANTARA_PMS_FLAG = 'layantara_pms';

/** `feature_flag:layantara_pms` (system_settings). Default OFF. */
export function useLayantaraPmsEnabled(): boolean {
  return useFeatureFlag(LAYANTARA_PMS_FLAG, false);
}

/** Flag plus load state, so UI can tell "off" from "still loading / failed to load". */
export function useLayantaraPmsFlagState(): { enabled: boolean; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useFeatureFlags();
  return { enabled: data?.[LAYANTARA_PMS_FLAG] === true, isLoading, isError };
}

/**
 * Imperative flag read for mutations: shares the `feature-flags` cache but does
 * not issue a request until a write actually needs the answer. A failed read
 * counts as OFF (the DB trigger remains the backstop when the flag is on).
 */
export async function isLayantaraPmsEnabled(queryClient: QueryClient): Promise<boolean> {
  try {
    const flags = await queryClient.ensureQueryData({
      queryKey: FEATURE_FLAGS_QUERY_KEY,
      queryFn: fetchFlags,
      revalidateIfStale: false,
    });
    return flags[LAYANTARA_PMS_FLAG] === true;
  } catch {
    return false;
  }
}
