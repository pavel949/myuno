/**
 * @module lifecycleNudges
 * @description Lifecycle Triggers (segmentation-framework § 9.4) surfaced
 * in the UX as contextual nudges.
 *
 * Pure, deterministic, no React/Supabase deps — mirrors `recommendServices`.
 * Takes the already-persisted canonical profile signals and derives a
 * prioritised list of nudges. Anon / empty profile → `[]` (regression-safe;
 * the consuming component renders nothing).
 *
 * Rules (canonical § 9.4):
 *  - `total_days_in_thailand > 175`            → TaxNav (tax-residency risk)
 *  - `visits ≥ 2 AND total_days > 21` (early)  → Snowbird path
 *  - `kids_ages.min < 18`                      → Family Hub
 *  - `special_status includes 'pet-owner'`     → Pet services
 *
 * NOTE: this is read-only activation. It does NOT write to `profiles` and
 * intentionally avoids the (currently dormant) persona-persistence path.
 */

import type { CanonicalProfile, LifecycleStage } from '@/types/canonical';
import { APP_ROUTES } from '@/lib/config/routes';

export type NudgeSeverity = 'high' | 'medium' | 'low';

export interface LifecycleNudge {
  id: string;
  severity: NudgeSeverity;
  icon: string;
  title: { en: string; ru: string };
  body: { en: string; ru: string };
  cta: { en: string; ru: string };
  route: string;
}

/** Subset of `CanonicalProfile` the rules actually read. */
export type LifecycleNudgeInput = Pick<
  CanonicalProfile,
  'lifecycleStage' | 'visitsCount' | 'totalDaysInThailand' | 'kidsAges' | 'specialStatus'
>;

const SEVERITY_RANK: Record<NudgeSeverity, number> = { high: 0, medium: 1, low: 2 };

/** Stages where a "you keep coming back → Snowbird" nudge still makes sense. */
const EARLY_STAGES: ReadonlySet<LifecycleStage> = new Set<LifecycleStage>([
  'scout',
  'tourist',
  'snowbird',
]);

export function computeLifecycleNudges(
  profile: LifecycleNudgeInput | null | undefined,
  options?: { limit?: number },
): LifecycleNudge[] {
  if (!profile) return [];

  const {
    lifecycleStage,
    visitsCount,
    totalDaysInThailand,
    kidsAges,
    specialStatus,
  } = profile;

  const out: LifecycleNudge[] = [];

  // 1 · Tax-residency risk — § 9.4 `days_in_thailand > 175 → TaxNav`
  if (totalDaysInThailand > 175) {
    out.push({
      id: 'tax-residency-175',
      severity: 'high',
      icon: '🧾',
      title: {
        en: 'Tax-residency threshold approaching',
        ru: 'Приближается налоговое резидентство',
      },
      body: {
        en: `${totalDaysInThailand} days in Thailand this year — 183+ makes you a tax resident. Plan ahead.`,
        ru: `${totalDaysInThailand} дней в Таиланде за год — при 183+ вы становитесь налоговым резидентом. Спланируйте заранее.`,
      },
      cta: { en: 'Open TaxNav', ru: 'Открыть TaxNav' },
      route: APP_ROUTES.TAX_NAV,
    });
  }

  // 2 · Snowbird eligible — § 9.4 `visits ≥ 2 AND total_days > 21`
  const isEarly = lifecycleStage == null || EARLY_STAGES.has(lifecycleStage);
  if (isEarly && visitsCount >= 2 && totalDaysInThailand > 21) {
    out.push({
      id: 'snowbird-eligible',
      severity: 'medium',
      icon: '❄️',
      title: { en: 'You keep coming back', ru: 'Вы возвращаетесь снова' },
      body: {
        en: 'Second season and 3+ weeks here — the Snowbird setup (visa, home, insurance) may fit you.',
        ru: 'Второй сезон и 3+ недели здесь — пакет Snowbird (виза, жильё, страховка) может вам подойти.',
      },
      cta: { en: 'See Snowbird path', ru: 'Путь Snowbird' },
      route: '/for/snowbirds',
    });
  }

  // 3 · Family with kids — § 9.4 `kids_age.min < 18 → Family Hub`
  if (kidsAges.some((age) => age >= 0 && age < 18)) {
    out.push({
      id: 'family-hub',
      severity: 'medium',
      icon: '👨‍👩‍👧',
      title: { en: 'Settling in with kids', ru: 'Обустройство с детьми' },
      body: {
        en: 'Schools, paediatrics and family services curated for your children’s ages.',
        ru: 'Школы, педиатрия и семейные сервисы под возраст ваших детей.',
      },
      cta: { en: 'Open Family Hub', ru: 'Открыть Family Hub' },
      route: '/for/families',
    });
  }

  // 4 · Pet owner — § 9.4 `modifiers includes 'pet' → Pet section`
  if (specialStatus.includes('pet-owner') || specialStatus.includes('pet')) {
    out.push({
      id: 'pet-section',
      severity: 'low',
      icon: '🐾',
      title: { en: 'Bringing or keeping a pet', ru: 'С питомцем на острове' },
      body: {
        en: 'Vets, grooming, pet-sitting and import help in one place.',
        ru: 'Ветеринары, груминг, передержка и помощь с ввозом — в одном месте.',
      },
      cta: { en: 'Open Pet services', ru: 'Открыть Pet-сервисы' },
      route: APP_ROUTES.PETS,
    });
  }

  out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const limit = options?.limit ?? out.length;
  return out.slice(0, Math.max(0, limit));
}
