/**
 * @module CanonicalTypes
 * @description Canonical segmentation framework types (M3).
 *
 * Source of truth for the 6-role canonical taxonomy, lifecycle stages,
 * personas (P1..P25), household types, clusters and triggers defined in
 * `/docs/canonical/01-segmentation-framework.md`.
 *
 * These types map onto the **smart-additive** Supabase schema introduced
 * in M2 (see `docs/canonical/audits/M2-schema-extension.md`):
 *  - `profiles.lifecycle_stage`           → enum `lifecycle_stage`
 *  - `profiles.household_type`            → enum `household_type_enum`
 *  - `profiles.preferred_language`        → enum `language_code` (existing)
 *  - `profiles.detected_persona`          → text (free-form `P1`..`P25`)
 *  - `profiles.active_clusters` / triggers / special_status → text[]
 *  - `profiles.kids_ages`                 → int[]
 *  - `profiles.visits_count` / total_days_in_thailand → int
 *  - `v_profiles_canonical.canonical_primary_role` → mapped role
 *
 * **Pure types only.** No imports from `supabase/client` to keep this
 * module tree-shakeable and consumable from edge runtimes.
 */

import type { Database } from '@/integrations/supabase/types';

/* ------------------------------------------------------------------ */
/*  Canonical roles (6) — see § 0.4 of segmentation-framework         */
/* ------------------------------------------------------------------ */

export type CanonicalRole =
  | 'consumer'
  | 'resident-user'
  | 'investor-passive'
  | 'investor-active'
  | 'operator'
  | 'provider';

export const CANONICAL_ROLES: readonly CanonicalRole[] = [
  'consumer',
  'resident-user',
  'investor-passive',
  'investor-active',
  'operator',
  'provider',
] as const;

/**
 * Mapping table: canonical role → existing `app_role` enum values.
 * Mirrors `/docs/canonical/audits/M2-schema-extension.md` § Role Mapping.
 *
 * Used both client-side (display) and as documentation for the SQL
 * functions `get_canonical_primary_role` / `has_canonical_role`.
 */
export const CANONICAL_TO_APP_ROLE: Record<CanonicalRole, readonly Database['public']['Enums']['app_role'][]> = {
  consumer:           ['user', 'tourist'],
  'resident-user':    ['resident'],
  'investor-passive': ['investor'],
  'investor-active':  ['investor', 'broker'],
  operator:           ['property_owner', 'owner'],
  provider:           ['vendor', 'partner'],
} as const;

export interface CanonicalRoleMeta {
  role: CanonicalRole;
  labelEn: string;
  labelRu: string;
  /** One-line elevator pitch in RU — see segmentation-framework § 0.4 */
  descriptionRu: string;
  /** Default cluster surface for this role (Arrive/Live/Manage/Invest/Build) */
  defaultCluster: ClusterId;
}

export const CANONICAL_ROLE_META: Record<CanonicalRole, CanonicalRoleMeta> = {
  consumer: {
    role: 'consumer',
    labelEn: 'Consumer',
    labelRu: 'Потребитель',
    descriptionRu: 'Покупает услуги и впечатления, без длинных обязательств.',
    defaultCluster: 'arrive',
  },
  'resident-user': {
    role: 'resident-user',
    labelEn: 'Resident',
    labelRu: 'Резидент',
    descriptionRu: 'Живёт на острове, нужны бытовые сервисы и легализация.',
    defaultCluster: 'live',
  },
  'investor-passive': {
    role: 'investor-passive',
    labelEn: 'Passive Investor',
    labelRu: 'Пассивный инвестор',
    descriptionRu: 'Покупает доходные юниты под управлением УК.',
    defaultCluster: 'invest',
  },
  'investor-active': {
    role: 'investor-active',
    labelEn: 'Active Investor',
    labelRu: 'Активный инвестор',
    descriptionRu: 'Структурирует сделки, перепродажи, broker-уровень.',
    defaultCluster: 'invest',
  },
  operator: {
    role: 'operator',
    labelEn: 'Operator',
    labelRu: 'Оператор',
    descriptionRu: 'Управляет своим/чужим объектом — STR, аренда, MC.',
    defaultCluster: 'manage',
  },
  provider: {
    role: 'provider',
    labelEn: 'Provider',
    labelRu: 'Поставщик',
    descriptionRu: 'Поставщик услуг и контента в маркетплейсе.',
    defaultCluster: 'build',
  },
};

/* ------------------------------------------------------------------ */
/*  Lifecycle stages — § 0.2                                          */
/* ------------------------------------------------------------------ */

export type LifecycleStage = Database['public']['Enums']['lifecycle_stage'];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, { en: string; ru: string }> = {
  scout:    { en: 'Scout',    ru: 'Разведчик' },
  tourist:  { en: 'Tourist',  ru: 'Турист' },
  snowbird: { en: 'Snowbird', ru: 'Сезонник' },
  nomad:    { en: 'Nomad',    ru: 'Номад' },
  settler:  { en: 'Settler',  ru: 'Переселенец' },
  resident: { en: 'Resident', ru: 'Резидент' },
  absentee: { en: 'Absentee', ru: 'Заочный собственник' },
  returnee: { en: 'Returnee', ru: 'Возвращенец' },
};

/** Ordered linear progression for funnel/UX visualisation. */
export const LIFECYCLE_PROGRESSION: readonly LifecycleStage[] = [
  'scout',
  'tourist',
  'snowbird',
  'nomad',
  'settler',
  'resident',
  'absentee',
  'returnee',
] as const;

/* ------------------------------------------------------------------ */
/*  Household types — § 0.3                                           */
/* ------------------------------------------------------------------ */

export type HouseholdType = Database['public']['Enums']['household_type_enum'];

export const HOUSEHOLD_TYPE_LABELS: Record<HouseholdType, { en: string; ru: string }> = {
  solo:             { en: 'Solo',             ru: 'Один' },
  couple:           { en: 'Couple',           ru: 'Пара' },
  family_with_kids: { en: 'Family + kids',    ru: 'Семья с детьми' },
  family_extended:  { en: 'Extended family',  ru: 'Большая семья' },
  group_friends:    { en: 'Group of friends', ru: 'Группа друзей' },
};

/* ------------------------------------------------------------------ */
/*  Clusters — § 0.5 (matches handoff/ARCHITECTURE_V2.md surfaces)    */
/* ------------------------------------------------------------------ */

export type ClusterId = 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';

export const CLUSTER_IDS: readonly ClusterId[] = [
  'arrive',
  'live',
  'manage',
  'invest',
  'legal',
  'build',
] as const;

export const CLUSTER_META: Record<ClusterId, { labelEn: string; labelRu: string; tokenColor: string }> = {
  arrive: { labelEn: 'Arrive', labelRu: 'Прилёт',     tokenColor: 'cluster-arrive' },
  live:   { labelEn: 'Live',   labelRu: 'Жизнь',      tokenColor: 'cluster-live' },
  manage: { labelEn: 'Manage', labelRu: 'Управление', tokenColor: 'cluster-manage' },
  invest: { labelEn: 'Invest', labelRu: 'Инвестиции', tokenColor: 'cluster-invest' },
  legal:  { labelEn: 'Legal',  labelRu: 'Право',      tokenColor: 'cluster-legal' },
  build:  { labelEn: 'Build',  labelRu: 'Стройка',    tokenColor: 'cluster-build' },
};

/* ------------------------------------------------------------------ */
/*  Personas — § 0.6 (P1..P25 free-form text in DB)                   */
/* ------------------------------------------------------------------ */

export type PersonaCode =
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
  | 'P6' | 'P7' | 'P8' | 'P9' | 'P10'
  | 'P11' | 'P12' | 'P13' | 'P14' | 'P15'
  | 'P16' | 'P17' | 'P18' | 'P19' | 'P20'
  | 'P21' | 'P22' | 'P23' | 'P24' | 'P25'
  | 'P26';

export const PERSONA_CODES: readonly PersonaCode[] = [
  'P1','P2','P3','P4','P5','P6','P7','P8','P9','P10',
  'P11','P12','P13','P14','P15','P16','P17','P18','P19','P20',
  'P21','P22','P23','P24','P25','P26',
] as const;

export function isPersonaCode(value: string | null | undefined): value is PersonaCode {
  if (!value) return false;
  return (PERSONA_CODES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/*  Triggers / special_status — § 0.7                                 */
/* ------------------------------------------------------------------ */

/** Open vocabulary; canonical seeds. Free-form text in DB. */
export const TRIGGER_SEEDS = [
  'first_visit',
  'returning_guest',
  'visa_expiry_30d',
  'visa_expiry_7d',
  'high_value_lead',
  'family_with_kids_arriving',
  'cart_abandoned',
  'investment_intent_detected',
  'long_stay_eligible',
  'ml_property_owner_inactive',
] as const;

export type TriggerSeed = typeof TRIGGER_SEEDS[number];

export const SPECIAL_STATUS_SEEDS = [
  'vip',
  'do_not_contact',
  'gdpr_erasure_requested',
  'compliance_flag',
  'beta_tester',
  'partner_referred',
] as const;

export type SpecialStatusSeed = typeof SPECIAL_STATUS_SEEDS[number];

/* ------------------------------------------------------------------ */
/*  Canonical profile DTO                                             */
/* ------------------------------------------------------------------ */

export type LanguageCode = Database['public']['Enums']['language_code'];

/**
 * Read-model returned by `useCanonicalProfile()` — sourced from the SQL
 * view `public.v_profiles_canonical` (security_invoker = true).
 *
 * Combines existing profile fields with the M2 segmentation columns and
 * the mapped `canonical_primary_role`.
 */
export interface CanonicalProfile {
  id: string;
  /** Mapped from existing `app_role` via SQL function. May be `null` for guests. */
  primaryRole: CanonicalRole | null;
  /** Computed at read-time via `get_canonical_secondary_roles()`. */
  secondaryRoles: CanonicalRole[];
  lifecycleStage: LifecycleStage | null;
  nextLifecycleStageEta: string | null;
  householdType: HouseholdType | null;
  kidsAges: number[];
  visitsCount: number;
  totalDaysInThailand: number;
  detectedPersona: PersonaCode | null;
  detectedPersonaConfidence: number | null;
  activeClusters: ClusterId[];
  triggersActive: string[];
  specialStatus: string[];
  preferredLanguage: LanguageCode | null;
}

/**
 * Patch payload for canonical mutations. All fields optional and additive —
 * never deletes existing array entries unless explicitly replaced.
 */
export interface CanonicalProfilePatch {
  lifecycleStage?: LifecycleStage | null;
  nextLifecycleStageEta?: string | null;
  householdType?: HouseholdType | null;
  kidsAges?: number[];
  visitsCount?: number;
  totalDaysInThailand?: number;
  detectedPersona?: PersonaCode | null;
  detectedPersonaConfidence?: number | null;
  activeClusters?: ClusterId[];
  triggersActive?: string[];
  specialStatus?: string[];
  preferredLanguage?: LanguageCode | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export function isCanonicalRole(value: string | null | undefined): value is CanonicalRole {
  if (!value) return false;
  return (CANONICAL_ROLES as readonly string[]).includes(value);
}

export function getCanonicalRoleMeta(role: CanonicalRole | null | undefined): CanonicalRoleMeta | null {
  if (!role) return null;
  return CANONICAL_ROLE_META[role] ?? null;
}

export function nextLifecycleStage(stage: LifecycleStage | null): LifecycleStage | null {
  if (!stage) return null;
  const idx = LIFECYCLE_PROGRESSION.indexOf(stage);
  if (idx < 0 || idx === LIFECYCLE_PROGRESSION.length - 1) return null;
  return LIFECYCLE_PROGRESSION[idx + 1];
}
