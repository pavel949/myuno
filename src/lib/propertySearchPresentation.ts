import type { Language } from '@/i18n';
import type { Property } from '@/hooks/useProperties';
import { getPropertyPriceSortGroup } from '@/lib/propertySortPrice';
import { pickLang } from '@/lib/i18n/pickLang';
/** Search intent labels only; owner features and structured pool_type retain their own vocabulary. */
export function propertySearchFeatureLabels(feature: { id: string; labelEn: string; labelRu: string }) {
  return feature.id === 'pool'
    ? { labelEn: 'Pool', labelRu: 'Бассейн' }
    : { labelEn: feature.labelEn, labelRu: feature.labelRu };
}

export function propertyPriceSortGroupLabel(property: Property, language: Language) {
  const group = getPropertyPriceSortGroup(property);
  const labels: Record<string, { ru: string; en: string; th: string }> = {
    asking: { ru: 'Продажа', en: 'Sale', th: 'ขาย' },
    night: { ru: 'Аренда за ночь', en: 'Rent per night', th: 'เช่าต่อคืน' },
    week: { ru: 'Аренда за неделю', en: 'Rent per week', th: 'เช่าต่อสัปดาห์' },
    month: { ru: 'Аренда за месяц', en: 'Rent per month', th: 'เช่าต่อเดือน' },
    total: { ru: 'Аренда за весь период', en: 'Rent total', th: 'ค่าเช่ารวม' },
    year: { ru: 'Аренда за год', en: 'Rent per year', th: 'เช่าต่อปี' },
  };
  const label = pickLang(language, labels[group.period] || { ru: 'Период не указан', en: 'Period unspecified', th: 'ไม่ระบุช่วงเวลา' });
  const currency = group.currency === 'UNKNOWN' ? pickLang(language, { ru: 'Валюта не указана', en: 'Currency unspecified', th: 'ไม่ระบุสกุลเงิน' }) : group.currency;
  return `${label} · ${currency}`;
}
