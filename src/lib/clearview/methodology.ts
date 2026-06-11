/**
 * ClearView V3 — single source of truth for methodology.
 * Mirrors `06-clearview-methodology.md` (Canon V3, March 2025).
 *
 * Used by:
 * - <ClearViewBadge />, <ClearViewGauge />, <ClearViewRadar />
 * - <ClearViewReport /> for category labels and weights
 * - useDueDiligence hook for grade derivation
 */

export type ClearViewGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB';
export type ClearViewRecommendation = 'BUY' | 'WATCH' | 'AVOID';

export interface ClearViewCategory {
  /** Canon V3 short code: LRC, DCF, CQP, LMA, FRC, ROI, MAS, LRT */
  code: string;
  /** Maps to score_* columns in due_diligence_reports */
  scoreField:
    | 'score_legal'
    | 'score_developer'
    | 'score_construction'
    | 'score_location'
    | 'score_financial'
    | 'score_returns'
    | 'score_marketing'
    | 'score_liquidity';
  weight: number; // 0.05 – 0.20
  nameEn: string;
  nameRu: string;
  shortRu: string;
  shortEn: string;
}

/** 8 categories, weights sum to 1.00 (Canon V3) */
export const CLEARVIEW_CATEGORIES: ClearViewCategory[] = [
  { code: 'LRC', scoreField: 'score_legal',         weight: 0.20, nameEn: 'Legal & Regulatory Compliance', nameRu: 'Юридическая чистота',          shortEn: 'Legal',         shortRu: 'Право' },
  { code: 'DCF', scoreField: 'score_developer',     weight: 0.20, nameEn: 'Developer Capital & Financials', nameRu: 'Капитал девелопера',          shortEn: 'Developer',     shortRu: 'Девелопер' },
  { code: 'CQP', scoreField: 'score_construction',  weight: 0.15, nameEn: 'Construction Quality & Progress', nameRu: 'Качество стройки',           shortEn: 'Construction',  shortRu: 'Стройка' },
  { code: 'LMA', scoreField: 'score_location',      weight: 0.15, nameEn: 'Location & Market Attractiveness', nameRu: 'Локация и рынок',           shortEn: 'Location',      shortRu: 'Локация' },
  { code: 'FRC', scoreField: 'score_financial',     weight: 0.10, nameEn: 'Financial Resilience & Cash Flow', nameRu: 'Финансовая устойчивость',  shortEn: 'Financial',     shortRu: 'Финансы' },
  { code: 'ROI', scoreField: 'score_returns',       weight: 0.10, nameEn: 'Return on Investment',           nameRu: 'Доходность ROI',              shortEn: 'ROI',           shortRu: 'ROI' },
  { code: 'MAS', scoreField: 'score_marketing',     weight: 0.05, nameEn: 'Marketing & Sales Strategy',     nameRu: 'Маркетинг и продажи',         shortEn: 'Marketing',     shortRu: 'Маркетинг' },
  { code: 'LRT', scoreField: 'score_liquidity',     weight: 0.05, nameEn: 'Long-term Resilience & Exit',    nameRu: 'Устойчивость и выход',        shortEn: 'Liquidity',     shortRu: 'Ликвидность' },
];

/** Grade thresholds (Canon V3): score 0–100 → grade */
export function scoreToGrade(score: number | null | undefined): ClearViewGrade | null {
  if (score == null || isNaN(score)) return null;
  if (score >= 90) return 'AAA';
  if (score >= 80) return 'AA';
  if (score >= 70) return 'A';
  if (score >= 60) return 'BBB';
  return 'BB';
}

/** Recommendation derived from grade */
export function gradeToRecommendation(grade: ClearViewGrade | null): ClearViewRecommendation | null {
  if (!grade) return null;
  if (grade === 'AAA' || grade === 'AA') return 'BUY';
  if (grade === 'A' || grade === 'BBB') return 'WATCH';
  return 'AVOID';
}

/** Semantic-token color class for a grade chip/badge */
export function gradeTokenClass(grade: ClearViewGrade | null): {
  bg: string;
  text: string;
  border: string;
} {
  switch (grade) {
    case 'AAA':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/40' };
    case 'AA':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30' };
    case 'A':
      return { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/30' };
    case 'BBB':
      return { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/30' };
    case 'BB':
      return { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/30' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
  }
}

/** Recommendation label */
export function recommendationLabel(rec: ClearViewRecommendation | null, isRu: boolean): string {
  if (!rec) return '';
  const map = {
    BUY: { en: 'Buy', ru: 'Покупать' },
    WATCH: { en: 'Watch', ru: 'Наблюдать' },
    AVOID: { en: 'Avoid', ru: 'Избегать' },
  } as const;
  return isRu ? map[rec].ru : map[rec].en;
}

/** Pricing for B2C report access (THB cents) — Trust Stack v1.0 §3 A-2 */
export const CLEARVIEW_PRICING = {
  SINGLE_REPORT_THB_CENTS: 490000, // ฿4,900
  BUNDLE_3_THB_CENTS: 1200000,     // ฿12,000
  ACCESS_DURATION_MONTHS: 12,
} as const;

/** Pricing for B2B (developer) — sales-led, displayed only */
export const CLEARVIEW_B2B_PRICING = {
  STANDARD_THB: 150000,
  PREMIUM_THB: 300000,
  ANNUAL_SUBSCRIPTION_THB: 500000,
} as const;
