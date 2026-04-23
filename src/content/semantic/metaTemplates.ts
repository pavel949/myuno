/**
 * @module content/semantic/metaTemplates
 * @description Canonical meta description templates from §2.4 of the Semantic Core.
 *
 * Each template is ≤160 chars (validated at runtime). Use these as the baseline
 * for every new public page; only adjust facts (numbers, area names), never the
 * lexical structure (anchor words, ordering).
 */

import type { BilingualString } from '@/lib/landings/types';

const MAX_DESCRIPTION = 160;
const MAX_TITLE = 60;

// ────────────────────────────────────────────────────────────────────
// §2.4 · Reference templates
// ────────────────────────────────────────────────────────────────────

export const META_TEMPLATES: Readonly<Record<string, { title: BilingualString; description: BilingualString }>> = {
  homepage: {
    title: {
      ru: 'myUNO — цифровая инфраструктура для иностранцев в Таиланде',
      en: 'myUNO — digital infrastructure for foreigners in Thailand',
    },
    description: {
      ru: 'myUNO — цифровая инфраструктура для иностранцев в Таиланде. Недвижимость, визы, compliance, сопровождение сделок на Пхукете. На русском и английском.',
      en: 'myUNO — digital infrastructure for foreigners in Thailand. Real estate, visas, compliance, transaction support on Phuket. Russian and English.',
    },
  },
  invest: {
    title: {
      ru: 'Инвестиции в недвижимость Пхукета — myUNO Invest',
      en: 'Phuket real-estate investing — myUNO Invest',
    },
    description: {
      ru: 'Инвестиции в недвижимость Пхукета: off-plan и вторичный рынок. Due diligence, escrow, ClearView-рейтинги застройщиков. Сопровождение сделки от myUNO.',
      en: 'Phuket real-estate investing: off-plan and resale. Due diligence, escrow, ClearView developer ratings. Transaction support from myUNO.',
    },
  },
  clearview: {
    title: {
      ru: 'ClearView — публичные рейтинги застройщиков Пхукета',
      en: 'ClearView — public developer ratings for Phuket',
    },
    description: {
      ru: 'ClearView — публичная система рейтингов off-plan проектов Пхукета. Институциональная методология, 8 категорий, рейтинги AAA–BB. Независимая оценка.',
      en: 'ClearView — a public rating system for off-plan projects in Phuket. Institutional methodology, 8 categories, AAA–BB scale. Independent assessment.',
    },
  },
  stay: {
    title: {
      ru: 'Аренда жилья на Пхукете — myUNO Stay',
      en: 'Phuket rentals — myUNO Stay',
    },
    description: {
      ru: 'Долгосрочная и краткосрочная аренда на Пхукете. Проверенные объекты, прозрачные договоры, depositSafe. Без скрытых комиссий агента.',
      en: 'Long-term and short-term rentals on Phuket. Verified properties, transparent contracts, depositSafe escrow. No hidden agent fees.',
    },
  },
} as const;

// ────────────────────────────────────────────────────────────────────
// Builders
// ────────────────────────────────────────────────────────────────────

export interface MetaInput {
  /** Free-form fact insertion. */
  what: BilingualString;
  /** Geographic / lifecycle qualifier (e.g. «на Пхукете», «for nomads»). */
  where?: BilingualString;
  /** Why-it-matters tail (e.g. «прозрачные договоры», «5 working days»). */
  benefit?: BilingualString;
}

/**
 * Generic meta description builder following §2.4 anatomy:
 *   {what} {where}. {benefit}. От myUNO.
 *
 * The trailing «От myUNO» / «From myUNO» is appended only if the result fits
 * within MAX_DESCRIPTION; otherwise omitted (per §9.2 hard limit).
 */
export function buildMetaDescription(input: MetaInput): BilingualString {
  const compose = (lang: 'ru' | 'en'): string => {
    const parts: string[] = [];
    parts.push(input.what[lang]);
    if (input.where) parts.push(input.where[lang]);
    let result = parts.join(' ').trim();
    if (input.benefit) {
      const withBenefit = `${result}. ${input.benefit[lang]}`;
      if (withBenefit.length <= MAX_DESCRIPTION) result = withBenefit;
    }
    const tail = lang === 'ru' ? '. От myUNO.' : '. From myUNO.';
    if ((result + tail).length <= MAX_DESCRIPTION) result += tail;
    else if (!result.endsWith('.')) result += '.';
    return result;
  };
  return { ru: compose('ru'), en: compose('en') };
}

/** Validate that a meta block fits §9.2 hard limits. Throws in dev / returns false in prod. */
export function validateMeta(title: BilingualString, description: BilingualString): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const lang of ['ru', 'en'] as const) {
    if (title[lang].length > MAX_TITLE) errors.push(`title.${lang} ${title[lang].length}>${MAX_TITLE} chars`);
    if (description[lang].length > MAX_DESCRIPTION) errors.push(`description.${lang} ${description[lang].length}>${MAX_DESCRIPTION} chars`);
    if (!title[lang].trim()) errors.push(`title.${lang} is empty`);
    if (!description[lang].trim()) errors.push(`description.${lang} is empty`);
  }
  return { ok: errors.length === 0, errors };
}

export const META_LIMITS = { MAX_TITLE, MAX_DESCRIPTION } as const;
