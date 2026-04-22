/**
 * @module CanonicalProfileApi
 * @description Typed API contract for the canonical profile read-model.
 *
 * Wraps:
 *  - `public.v_profiles_canonical`  (read)
 *  - `public.profiles` (write — additive patch)
 *  - RPCs `get_canonical_primary_role`, `get_canonical_secondary_roles`,
 *    `has_canonical_role`
 *
 * **Important:** This is the only sanctioned read path for canonical
 * segmentation. UI code MUST NOT query `profiles` directly for any of
 * the M2 columns — go through `fetchCanonicalProfile`.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CanonicalProfile,
  CanonicalProfilePatch,
  CanonicalRole,
  ClusterId,
  HouseholdType,
  LanguageCode,
  LifecycleStage,
  PersonaCode,
} from '@/types/canonical';
import { isCanonicalRole, isPersonaCode } from '@/types/canonical';

const VIEW_COLUMNS = `
  id,
  canonical_primary_role,
  lifecycle_stage,
  next_lifecycle_stage_eta,
  household_type,
  kids_ages,
  visits_count,
  total_days_in_thailand,
  detected_persona,
  detected_persona_confidence,
  active_clusters,
  triggers_active,
  special_status,
  preferred_language
` as const;

/* ------------------------------------------------------------------ */
/*  Reads                                                             */
/* ------------------------------------------------------------------ */

/**
 * Fetch canonical profile for the given user id.
 * Returns `null` if the user has no `profiles` row (guest).
 */
export async function fetchCanonicalProfile(userId: string): Promise<CanonicalProfile | null> {
  const [viewResult, secondaryResult] = await Promise.all([
    supabase
      .from('v_profiles_canonical')
      .select(VIEW_COLUMNS)
      .eq('id', userId)
      .maybeSingle(),
    supabase.rpc('get_canonical_secondary_roles', { _user_id: userId }),
  ]);

  if (viewResult.error) throw viewResult.error;
  if (!viewResult.data) return null;
  if (secondaryResult.error) throw secondaryResult.error;

  const row = viewResult.data;
  const secondaryRaw = (secondaryResult.data ?? []) as string[];

  return {
    id: row.id as string,
    primaryRole: isCanonicalRole(row.canonical_primary_role) ? row.canonical_primary_role : null,
    secondaryRoles: secondaryRaw.filter(isCanonicalRole),
    lifecycleStage: (row.lifecycle_stage as LifecycleStage | null) ?? null,
    nextLifecycleStageEta: row.next_lifecycle_stage_eta ?? null,
    householdType: (row.household_type as HouseholdType | null) ?? null,
    kidsAges: row.kids_ages ?? [],
    visitsCount: row.visits_count ?? 0,
    totalDaysInThailand: row.total_days_in_thailand ?? 0,
    detectedPersona: isPersonaCode(row.detected_persona) ? row.detected_persona : null,
    detectedPersonaConfidence: row.detected_persona_confidence ?? null,
    activeClusters: ((row.active_clusters ?? []) as string[]).filter(isClusterId),
    triggersActive: row.triggers_active ?? [],
    specialStatus: row.special_status ?? [],
    preferredLanguage: (row.preferred_language as LanguageCode | null) ?? null,
  };
}

/**
 * Server-side authoritative role check. Use sparingly — most UI gating
 * should rely on the cached `CanonicalProfile.primaryRole` instead.
 */
export async function hasCanonicalRole(userId: string, role: CanonicalRole): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_canonical_role', {
    _user_id: userId,
    _canonical_role: role,
  });
  if (error) throw error;
  return data === true;
}

/* ------------------------------------------------------------------ */
/*  Writes (additive patch)                                           */
/* ------------------------------------------------------------------ */

export async function updateCanonicalProfile(
  userId: string,
  patch: CanonicalProfilePatch,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if ('lifecycleStage' in patch)            dbPatch.lifecycle_stage = patch.lifecycleStage;
  if ('nextLifecycleStageEta' in patch)     dbPatch.next_lifecycle_stage_eta = patch.nextLifecycleStageEta;
  if ('householdType' in patch)             dbPatch.household_type = patch.householdType;
  if ('kidsAges' in patch)                  dbPatch.kids_ages = patch.kidsAges;
  if ('visitsCount' in patch)               dbPatch.visits_count = patch.visitsCount;
  if ('totalDaysInThailand' in patch)       dbPatch.total_days_in_thailand = patch.totalDaysInThailand;
  if ('detectedPersona' in patch)           dbPatch.detected_persona = patch.detectedPersona;
  if ('detectedPersonaConfidence' in patch) dbPatch.detected_persona_confidence = patch.detectedPersonaConfidence;
  if ('activeClusters' in patch)            dbPatch.active_clusters = patch.activeClusters;
  if ('triggersActive' in patch)            dbPatch.triggers_active = patch.triggersActive;
  if ('specialStatus' in patch)             dbPatch.special_status = patch.specialStatus;
  if ('preferredLanguage' in patch)         dbPatch.preferred_language = patch.preferredLanguage;

  if (Object.keys(dbPatch).length === 0) return;

  const { error } = await supabase
    .from('profiles')
    .update(dbPatch)
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Append (deduped) values to one of the array-columns without overwriting
 * existing entries. Implemented as read-modify-write on the client because
 * we don't yet have a server-side merge RPC.
 */
export async function appendCanonicalArray(
  userId: string,
  field: 'activeClusters' | 'triggersActive' | 'specialStatus',
  values: string[],
): Promise<void> {
  if (values.length === 0) return;

  const current = await fetchCanonicalProfile(userId);
  if (!current) throw new Error('Profile not found');

  const existing = current[field] as string[];
  const merged = Array.from(new Set([...existing, ...values]));

  // Only write if the set actually changed
  if (merged.length === existing.length) return;

  if (field === 'activeClusters') {
    await updateCanonicalProfile(userId, { activeClusters: merged.filter(isClusterId) });
  } else if (field === 'triggersActive') {
    await updateCanonicalProfile(userId, { triggersActive: merged });
  } else {
    await updateCanonicalProfile(userId, { specialStatus: merged });
  }
}

/* ------------------------------------------------------------------ */
/*  Local helpers                                                     */
/* ------------------------------------------------------------------ */

function isClusterId(value: string): value is ClusterId {
  return (
    value === 'arrive' ||
    value === 'live' ||
    value === 'manage' ||
    value === 'invest' ||
    value === 'legal' ||
    value === 'build'
  );
}

// Re-export for convenience so consumers don't need two imports
export type { CanonicalProfile, CanonicalProfilePatch, PersonaCode };
