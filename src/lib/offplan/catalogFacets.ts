import type { OffplanProject } from '@/hooks/useOffplanProjects';
import type { LangValues } from '@/lib/i18n/pickLang';
import type { OffplanSortKey } from './types';

type Option<T extends string = string> = { value: T; label: LangValues };

/** Budget buckets in THB; bounds are [min, max). */
export const BUDGET_RANGES: Record<string, [number, number]> = {
  lt5: [0, 5_000_000],
  '5to10': [5_000_000, 10_000_000],
  '10to20': [10_000_000, 20_000_000],
  gt20: [20_000_000, Number.POSITIVE_INFINITY],
};

export const BUDGET_OPTIONS: Option[] = [
  { value: 'lt5', label: { ru: 'до 5 млн ฿', en: 'Under ฿5M', th: 'ต่ำกว่า 5 ล้าน' } },
  { value: '5to10', label: { ru: '5–10 млн ฿', en: '฿5–10M', th: '5–10 ล้าน' } },
  { value: '10to20', label: { ru: '10–20 млн ฿', en: '฿10–20M', th: '10–20 ล้าน' } },
  { value: 'gt20', label: { ru: 'от 20 млн ฿', en: '฿20M+', th: '20 ล้านขึ้นไป' } },
];

export const YEAR_OPTIONS: Option[] = [
  { value: 'done25', label: { ru: 'Сдан в 2025', en: 'Completed 2025', th: 'เสร็จ 2025' } },
  { value: '2026', label: { ru: '2026', en: '2026', th: '2026' } },
  { value: '2027', label: { ru: '2027', en: '2027', th: '2027' } },
  { value: '2028', label: { ru: '2028 и позже', en: '2028 or later', th: '2028 ขึ้นไป' } },
];

export const OWN_OPTIONS: Option[] = [
  { value: 'freehold', label: { ru: 'Freehold (квота иностранцев)', en: 'Foreign freehold', th: 'ฟรีโฮลด์' } },
  { value: 'leasehold', label: { ru: 'Leasehold (аренда 30+ лет)', en: 'Leasehold', th: 'ลีสโฮลด์' } },
];

export const BEACH_OPTIONS: Option[] = [
  { value: 'bf', label: { ru: 'Первая линия', en: 'Beachfront', th: 'ติดชายหาด' } },
  { value: '500', label: { ru: 'до 500 м', en: 'Within 500 m', th: 'ภายใน 500 ม.' } },
  { value: '1k', label: { ru: 'до 1 км', en: 'Within 1 km', th: 'ภายใน 1 กม.' } },
  { value: 'inl', label: { ru: 'Дальше 1 км', en: 'Over 1 km', th: 'เกิน 1 กม.' } },
];

export const SORT_OPTIONS: Option<OffplanSortKey>[] = [
  { value: 'score', label: { ru: 'Рекомендуемые', en: 'Recommended', th: 'แนะนำ' } },
  { value: 'price_asc', label: { ru: 'Сначала дешевле', en: 'Price: low to high', th: 'ราคาต่ำไปสูง' } },
  { value: 'price_desc', label: { ru: 'Сначала дороже', en: 'Price: high to low', th: 'ราคาสูงไปต่ำ' } },
  { value: 'completion', label: { ru: 'Ближайшая сдача', en: 'Earliest completion', th: 'เสร็จเร็วสุด' } },
  { value: 'yield', label: { ru: 'Доходность', en: 'Projected yield', th: 'ผลตอบแทน' } },
  { value: 'beach', label: { ru: 'Ближе к морю', en: 'Closest to beach', th: 'ใกล้ทะเล' } },
];

/** Projects without a known starting price are excluded when a budget is chosen (unknown is not a match). */
export function filterByBudget(projects: OffplanProject[], budget: string): OffplanProject[] {
  const range = BUDGET_RANGES[budget];
  if (!range) return projects;
  return projects.filter((p) => typeof p.priceFrom === 'number' && p.priceFrom > 0
    && p.priceFrom >= range[0] && p.priceFrom < range[1]);
}
