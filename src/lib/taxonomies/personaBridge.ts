/**
 * Persona Bridge — мост между legacy `UserPersona` (14 строковых ID)
 * и каноническим Master Taxonomy v1.0 `PersonaCode` (P01..P25).
 *
 * Wave-1 IA cleanup (2026-06): БД-enum `user_persona` пока остаётся
 * legacy-формате (миграция = отдельная Wave). Этот мап позволяет новым
 * компонентам (Discover v3, AI-routing, lifecycle messaging) работать
 * с P-кодами уже сейчас, читая legacy-значения из `useUserPersonas`.
 *
 * Источник истины: `src/lib/taxonomies/master.ts` (PERSONAS, P01..P25).
 *
 * Правила маппинга:
 *  - Если у legacy-значения нет очевидного P-аналога — возвращаем `null`
 *    (не угадываем).
 *  - Mapping — many-to-one в сторону Master Taxonomy: legacy `family` и
 *    `couple` оба → P05/P02 в зависимости от долгосрочности, поэтому
 *    выбираем «наиболее частый» P-код, а нюансы решает persona-detector.
 */
import type { UserPersona } from '@/hooks/useUserPersonas';
import type { PersonaCode } from '@/lib/taxonomies/master';

/**
 * Legacy 14-value enum → canonical P-code.
 * Returns `null` for legacy values без однозначного соответствия.
 */
const LEGACY_TO_PCODE: Record<UserPersona, PersonaCode | null> = {
  tourist: 'P01_first_time_tourist',
  resident: 'P09_relocator_solo',
  property_owner: 'P23_property_owner',
  investor: 'P20_passive_investor',
  family: 'P08_relocator_family',
  couple: 'P02_repeat_tourist',
  nightlife: 'P03_long_stay_tourist',
  active: 'P16_athlete_training',
  business: 'P12_business_owner_local',
  nomad: 'P04_digital_nomad',
  pet_owner: 'P05_remote_worker_family',
  relocation: 'P09_relocator_solo',
  real_estate_developer: 'P22_developer_partner',
  local_services_provider: 'P25_service_vendor',
};

export function mapLegacyPersonaToCode(legacy: UserPersona): PersonaCode | null {
  return LEGACY_TO_PCODE[legacy] ?? null;
}

/**
 * Map a stack of legacy personas to canonical P-codes, dropping nulls
 * and de-duplicating while preserving stable order.
 */
export function mapLegacyPersonasToCodes(legacy: UserPersona[]): PersonaCode[] {
  const seen = new Set<PersonaCode>();
  const out: PersonaCode[] = [];
  for (const p of legacy) {
    const code = mapLegacyPersonaToCode(p);
    if (code && !seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}
