/**
 * useFeatureFlag — read `feature_flag:*` keys from `system_settings`.
 *
 * Source of truth: `system_settings.value` (jsonb). Accepts boolean/"true"/"on"/1.
 * Default = `false` (gates the feature off until explicitly enabled in DB).
 *
 * Used by RERE blocks (RealEstateEntry, TrustAsAService) and ClearView/Pricing
 * surfaces to honour rule §13.7 (every new feature gated until GA).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FLAG_PREFIX = 'feature_flag:';

function coerce(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    return v === 'true' || v === 'on' || v === '1';
  }
  return false;
}

async function fetchFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .like('key', `${FLAG_PREFIX}%`);

  if (error) throw error;
  const map: Record<string, boolean> = {};
  for (const row of data ?? []) {
    const id = (row.key as string).slice(FLAG_PREFIX.length);
    map[id] = coerce(row.value);
  }
  return map;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFlags,
    staleTime: 5 * 60_000,
  });
}

/**
 * Single-flag accessor. `defaultValue` is returned while loading or if
 * the key is absent from `system_settings`.
 */
export function useFeatureFlag(id: string, defaultValue = false): boolean {
  const { data } = useFeatureFlags();
  if (!data) return defaultValue;
  return data[id] ?? defaultValue;
}
