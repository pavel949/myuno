/**
 * Format product unit for display
 * Handles: weight (g, kg), volume (ml, L), pieces (pc/pcs)
 */

import { getCurrencySymbol } from '@/lib/config/currencies';

export interface ProductUnitData {
  unit_value?: number | null;
  unit_measure?: string | null;
  pack_quantity?: number | null;
  unit?: string;
  unit_ru?: string;
}

type UnitLang = 'en' | 'ru' | 'th';

const measureLabels: Record<string, { en: string; ru: string; th: string }> = {
  g: { en: 'g', ru: 'г', th: 'ก.' },
  kg: { en: 'kg', ru: 'кг', th: 'กก.' },
  ml: { en: 'ml', ru: 'мл', th: 'มล.' },
  L: { en: 'L', ru: 'л', th: 'ล.' },
  pc: { en: 'pc', ru: 'шт', th: 'ชิ้น' },
  pcs: { en: 'pcs', ru: 'шт', th: 'ชิ้น' },
  pack: { en: 'pack', ru: 'уп', th: 'แพ็ค' },
  bunch: { en: 'bunch', ru: 'пучок', th: 'ช่อ' },
  bottle: { en: 'bottle', ru: 'бут', th: 'ขวด' },
  box: { en: 'box', ru: 'кор', th: 'กล่อง' },
};

/**
 * Format precise unit string from product data
 * Examples:
 *   - unit_value: 500, unit_measure: 'g' → "500g" / "500г"
 *   - unit_value: 1, unit_measure: 'L' → "1L" / "1л"
 *   - pack_quantity: 6, unit_measure: 'pc' → "6 pcs" / "6 шт"
 *   - pack_quantity: 6, unit_value: 500, unit_measure: 'ml' → "6×500ml" / "6×500мл"
 */
export function formatProductUnit(
  product: ProductUnitData | null | undefined,
  language: UnitLang = 'en'
): string {
  // Guard against null/undefined product
  if (!product) return '';
  
  const { unit_value, unit_measure, pack_quantity, unit, unit_ru } = product;
  
  // If we have precise unit data, use it
  if (unit_value && unit_measure) {
    const measureLabel = measureLabels[unit_measure]?.[language] || unit_measure;
    
    // Handle edge case: unit_value could be string from DB
    const numericValue = typeof unit_value === 'string' ? parseFloat(unit_value) : unit_value;
    if (isNaN(numericValue)) return '';
    
    if (pack_quantity && pack_quantity > 1) {
      // Multi-pack: "6×500ml"
      return `${pack_quantity}×${numericValue}${measureLabel}`;
    }
    
    // Single unit: "500g"
    return `${numericValue}${measureLabel}`;
  }
  
  // Pack quantity without unit value: "6 pcs"
  if (pack_quantity && pack_quantity > 0) {
    const pcLabel = language === 'ru' ? 'шт' : language === 'th' ? 'ชิ้น' : 'pcs';
    return `${pack_quantity} ${pcLabel}`;
  }

  // Fallback to legacy unit field (DB-sourced; Thai falls back to the English field)
  return language === 'ru' ? (unit_ru || unit || '') : (unit || '');
}

/**
 * Calculate and format price per standard unit (e.g., per kg, per L)
 * Useful for comparing products of different sizes
 */
export function formatPricePerUnit(
  product: (ProductUnitData & { price: number }) | null | undefined,
  language: UnitLang = 'en'
): string | null {
  // Guard against null/undefined product
  if (!product) return null;
  
  const { unit_value, unit_measure, price } = product;
  
  if (!unit_value || !unit_measure || !price) return null;
  
  // Handle edge case: unit_value could be string from DB
  const numericValue = typeof unit_value === 'string' ? parseFloat(unit_value) : unit_value;
  if (isNaN(numericValue) || numericValue <= 0) return null;
  
  // Calculate price per standard unit
  let standardUnit: string;
  let multiplier: number;
  
  switch (unit_measure) {
    case 'g':
      standardUnit = language === 'ru' ? 'кг' : language === 'th' ? 'กก.' : 'kg';
      multiplier = 1000 / numericValue;
      break;
    case 'ml':
      standardUnit = language === 'ru' ? 'л' : language === 'th' ? 'ล.' : 'L';
      multiplier = 1000 / numericValue;
      break;
    case 'kg':
    case 'L':
      // Already standard unit
      return null;
    default:
      return null;
  }
  
  const pricePerUnit = Math.round(price * multiplier);
  return `${getCurrencySymbol('THB')}${pricePerUnit}/${standardUnit}`;
}

/**
 * Get unit measure options for forms
 */
export function getUnitMeasureOptions(language: UnitLang = 'en') {
  const tt = (ru: string, en: string, th: string) =>
    language === 'ru' ? ru : language === 'th' ? th : en;
  return [
    { value: 'g', label: tt('граммы (г)', 'grams (g)', 'กรัม (ก.)') },
    { value: 'kg', label: tt('килограммы (кг)', 'kilograms (kg)', 'กิโลกรัม (กก.)') },
    { value: 'ml', label: tt('миллилитры (мл)', 'milliliters (ml)', 'มิลลิลิตร (มล.)') },
    { value: 'L', label: tt('литры (л)', 'liters (L)', 'ลิตร (ล.)') },
    { value: 'pc', label: tt('штуки (шт)', 'pieces (pc)', 'ชิ้น') },
    { value: 'pack', label: tt('упаковка', 'pack', 'แพ็ค') },
    { value: 'bunch', label: tt('пучок', 'bunch', 'ช่อ') },
    { value: 'bottle', label: tt('бутылка', 'bottle', 'ขวด') },
    { value: 'box', label: tt('коробка', 'box', 'กล่อง') },
  ];
}
