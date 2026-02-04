/**
 * Format product unit for display
 * Handles: weight (g, kg), volume (ml, L), pieces (pc/pcs)
 */

export interface ProductUnitData {
  unit_value?: number | null;
  unit_measure?: string | null;
  pack_quantity?: number | null;
  unit?: string;
  unit_ru?: string;
}

const measureLabels: Record<string, { en: string; ru: string }> = {
  g: { en: 'g', ru: 'г' },
  kg: { en: 'kg', ru: 'кг' },
  ml: { en: 'ml', ru: 'мл' },
  L: { en: 'L', ru: 'л' },
  pc: { en: 'pc', ru: 'шт' },
  pcs: { en: 'pcs', ru: 'шт' },
  pack: { en: 'pack', ru: 'уп' },
  bunch: { en: 'bunch', ru: 'пучок' },
  bottle: { en: 'bottle', ru: 'бут' },
  box: { en: 'box', ru: 'кор' },
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
  language: 'en' | 'ru' = 'en'
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
    const pcLabel = language === 'ru' ? 'шт' : 'pcs';
    return `${pack_quantity} ${pcLabel}`;
  }
  
  // Fallback to legacy unit field
  return language === 'ru' ? (unit_ru || unit || '') : (unit || '');
}

/**
 * Calculate and format price per standard unit (e.g., per kg, per L)
 * Useful for comparing products of different sizes
 */
export function formatPricePerUnit(
  product: (ProductUnitData & { price: number }) | null | undefined,
  language: 'en' | 'ru' = 'en'
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
      standardUnit = language === 'ru' ? 'кг' : 'kg';
      multiplier = 1000 / numericValue;
      break;
    case 'ml':
      standardUnit = language === 'ru' ? 'л' : 'L';
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
  return `฿${pricePerUnit}/${standardUnit}`;
}

/**
 * Get unit measure options for forms
 */
export function getUnitMeasureOptions(language: 'en' | 'ru' = 'en') {
  return [
    { value: 'g', label: language === 'ru' ? 'граммы (г)' : 'grams (g)' },
    { value: 'kg', label: language === 'ru' ? 'килограммы (кг)' : 'kilograms (kg)' },
    { value: 'ml', label: language === 'ru' ? 'миллилитры (мл)' : 'milliliters (ml)' },
    { value: 'L', label: language === 'ru' ? 'литры (л)' : 'liters (L)' },
    { value: 'pc', label: language === 'ru' ? 'штуки (шт)' : 'pieces (pc)' },
    { value: 'pack', label: language === 'ru' ? 'упаковка' : 'pack' },
    { value: 'bunch', label: language === 'ru' ? 'пучок' : 'bunch' },
    { value: 'bottle', label: language === 'ru' ? 'бутылка' : 'bottle' },
    { value: 'box', label: language === 'ru' ? 'коробка' : 'box' },
  ];
}
