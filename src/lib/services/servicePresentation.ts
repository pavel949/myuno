import { pickLang } from '@/lib/i18n/pickLang';
import { SERVICE_CATEGORIES } from '@/lib/config/homeServiceFunctions';
import type { Language } from '@/i18n';

const HOME_CATEGORY_TH: Record<string, string> = {
  ac: 'เครื่องปรับอากาศ', plumbing: 'ประปา', electrical: 'ระบบไฟฟ้า',
  handyman: 'ช่างซ่อมทั่วไป', appliance_repair: 'ซ่อมเครื่องใช้ไฟฟ้า',
  cleaning: 'ทำความสะอาด', pool: 'สระว่ายน้ำและจากุซซี', garden: 'สวน',
  pest_control: 'กำจัดแมลง', security: 'ความปลอดภัย', moving: 'ขนย้าย',
};

/** Presentation over canonical categories; never infer a trade from a name. */
export function homeServiceCategoryLabel(id: string, language: Language): string {
  const category = SERVICE_CATEGORIES.find(item => item.id === id);
  if (category) return pickLang(language, { ru: category.nameRu, en: category.nameEn, th: HOME_CATEGORY_TH[id] });
  return pickLang(language, { ru: 'Другие услуги', en: 'Other services', th: 'บริการอื่น ๆ' });
}

export function groupHomeServices<T extends { id: string; category: string }>(items: T[]): { id: string; items: T[] }[] {
  const seen = new Set<string>();
  const unique = items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const groups = SERVICE_CATEGORIES.map(category => ({
    id: category.id,
    items: unique.filter(item => item.category === category.id),
  })).filter(group => group.items.length > 0);
  const other = unique.filter(item => !SERVICE_CATEGORIES.some(category => category.id === item.category));
  return other.length ? [...groups, { id: 'other', items: other }] : groups;
}

/** Missing currency/price is unknown, not free or implicitly Thai baht. */
export function servicePriceLabel(price: number | null | undefined, currency: string | null | undefined, language: Language): string {
  const quote = pickLang(language, { ru: 'Цена по запросу', en: 'Request a quote', th: 'สอบถามราคา' });
  if (price == null || !Number.isFinite(price) || price < 0 || !currency?.trim()) return quote;
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return quote;
  return `${code} ${price.toLocaleString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-US')}`;
}

export function cleaningServicePrice(service: { price_fixed?: number | null; price_per_hour?: number | null }) {
  const valid = (value: number | null | undefined): value is number => value != null && Number.isFinite(value) && value >= 0;
  if (valid(service.price_fixed)) return { price: service.price_fixed, hourly: false };
  if (valid(service.price_per_hour)) return { price: service.price_per_hour, hourly: true };
  return { price: undefined, hourly: false };
}
