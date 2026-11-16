import { formatRecordedPrice } from '@/lib/format/price';
import { pickLang } from '@/lib/i18n/pickLang';
import { propertySupportsMode, propertySaleAskingPrice, propertyRentalDisplayPrice } from './propertyDetailIntent';
import type { CommercialProperty } from '@/hooks/useCommercialProperties';

/** Same recorded offer/tariff selectors as homes; no conversion or price inference. */
export function commercialRecordedPrice(property: CommercialProperty, language: Parameters<typeof pickLang>[0]) {
  const unknownLabel = pickLang(language, { ru: 'Цена по запросу', en: 'Price on request', th: 'สอบถามราคา' });
  const mode = property.listing_type === 'rent' ? 'rent' : 'buy';
  if (!propertySupportsMode(property, mode)) return unknownLabel;
  if (mode === 'buy') return formatRecordedPrice(propertySaleAskingPrice(property), property.sale_price != null ? property.sale_currency : property.currency, { unknownLabel, locale: language });
  const rate = propertyRentalDisplayPrice(property);
  if (!rate) return unknownLabel;
  const amount = formatRecordedPrice(rate.amount, property.currency, { unknownLabel, locale: language });
  if (amount === unknownLabel) return amount;
  const periods = {
    night: { ru: 'ночь', en: 'night', th: 'คืน' }, week: { ru: 'неделю', en: 'week', th: 'สัปดาห์' },
    month: { ru: 'месяц', en: 'month', th: 'เดือน' }, year: { ru: 'год', en: 'year', th: 'ปี' },
    total: { ru: 'указанный срок', en: 'stated stay', th: 'ระยะเวลาที่ระบุ' },
  };
  return `${amount} / ${pickLang(language, periods[rate.period])}`;
}
