/**
 * @module content/semantic/forbiddenSynonyms
 * @description Forbidden→canonical synonym map from §14 of the Semantic Core.
 *
 * Source of truth — `docs/canonical/10-semantic-core.md` §5 + §14.
 * Consumed by:
 *  - `scripts/validate-semantic.mjs` (CI pre-merge check).
 *  - Documentation / PR reviewers.
 *
 * The ESLint guard in `eslint.config.js` mirrors the same patterns inline
 * (single regex, `no-restricted-syntax`). Drift between these two lists is
 * acceptable short-term (compromise §18); a follow-up M10 will auto-generate
 * the regex from this file.
 *
 * Context interpretation:
 *  - `all`: matches in any file (RU or EN literal).
 *  - `ru`: only literals containing Cyrillic glyphs.
 *  - `en`: only literals with Latin chars and no Cyrillic.
 *  - `commercial`: only paths under marketing / for / services / guides /
 *    rent / buy / clearview / landing.
 */

export type SynonymContext = 'all' | 'ru' | 'en' | 'commercial';

export interface ForbiddenSynonym {
  forbidden: string;
  canonical: string;
  contexts: SynonymContext[];
  /** Reference to the canon section that defines this rule. */
  source: string;
}

export const FORBIDDEN_SYNONYMS: readonly ForbiddenSynonym[] = [
  // §5.3 Real-estate lexicon
  { forbidden: 'юнит', canonical: 'объект', contexts: ['ru'], source: '10-semantic-core §5.3' },
  { forbidden: 'собственность', canonical: 'объект', contexts: ['ru', 'commercial'], source: '10-semantic-core §5.3' },
  { forbidden: 'приобретение', canonical: 'сделка', contexts: ['ru'], source: '10-semantic-core §5.3' },
  { forbidden: 'трансакция', canonical: 'сделка', contexts: ['ru'], source: '10-semantic-core §5.3' },
  { forbidden: 'чаноте', canonical: 'Chanote', contexts: ['ru'], source: '10-semantic-core §5.3' },
  { forbidden: 'котлован', canonical: 'off-plan', contexts: ['ru', 'commercial'], source: '10-semantic-core §5.3' },
  { forbidden: 'Земельный департамент', canonical: 'Land Office', contexts: ['ru'], source: '10-semantic-core §5.3' },
  { forbidden: 'гарантийный счёт', canonical: 'escrow', contexts: ['ru'], source: '10-semantic-core §5.3' },

  // §5.2 product names
  { forbidden: 'КонтрактAI', canonical: 'ContractAI', contexts: ['all'], source: '10-semantic-core §5.2' },
  { forbidden: 'ДоговорAI', canonical: 'ContractAI', contexts: ['all'], source: '10-semantic-core §5.2' },
  { forbidden: 'Клиарвью', canonical: 'ClearView', contexts: ['all'], source: '10-semantic-core §5.2' },
  { forbidden: 'КлирВью', canonical: 'ClearView', contexts: ['all'], source: '10-semantic-core §5.2' },
  { forbidden: 'MyUNO', canonical: 'myUNO', contexts: ['all'], source: '10-semantic-core §5.1' },
  { forbidden: 'My UNO', canonical: 'myUNO', contexts: ['all'], source: '10-semantic-core §5.1' },
  { forbidden: 'MYUNO', canonical: 'myUNO', contexts: ['all'], source: '10-semantic-core §5.1' },

  // From 03-tone-of-voice §15 (kept here so validate-semantic carries one map)
  // Exclusion: 'пользователь' / 'юзер' / 'лид' / 'поставщик' / 'вендор' would be too noisy
  // for the existing codebase. Will be raised after M9b content sweep.

  // ── Regulatory language guard (docs/business/regulatory-language.md §3-§4) ──
  // Scoped to `commercial` so it fires only inside public landings / i18n /
  // marketing surfaces, not in internal CRM / ops / type / route names.
  { forbidden: 'investment opportunity', canonical: 'featured listing / project profile', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'investment opportunities', canonical: 'featured listings / project profiles', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'guaranteed return', canonical: '(never used)', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'guaranteed returns', canonical: '(never used)', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'guaranteed yield', canonical: '(never used)', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'expected returns', canonical: 'historical comparable yield', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'Raise Funding', canonical: 'Submit your project', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'Pitch your project', canonical: 'Submit your project', contexts: ['commercial', 'en'], source: 'business/regulatory-language §3' },
  { forbidden: 'Привлечь инвестиции', canonical: 'Подать проект', contexts: ['commercial', 'ru'], source: 'business/regulatory-language §4' },
  { forbidden: 'Привлечь финансирование', canonical: 'Подать проект', contexts: ['commercial', 'ru'], source: 'business/regulatory-language §4' },
  { forbidden: 'инвестиционная возможность', canonical: 'объект каталога / профиль проекта', contexts: ['commercial', 'ru'], source: 'business/regulatory-language §4' },
  { forbidden: 'гарантированная доходность', canonical: '(никогда не используем)', contexts: ['commercial', 'ru'], source: 'business/regulatory-language §4' },
  { forbidden: 'ожидаемая доходность', canonical: 'историческая доходность сопоставимых объектов', contexts: ['commercial', 'ru'], source: 'business/regulatory-language §4' },
];

/** Regex-friendly flat list (helper for tooling that doesn't import full objects). */
export const FORBIDDEN_TERMS_FLAT: readonly string[] = FORBIDDEN_SYNONYMS.map((r) => r.forbidden);
