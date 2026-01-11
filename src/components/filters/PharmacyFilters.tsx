import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== PHARMACY CATEGORIES ======
export const pharmacyCategoryOptions: FilterOption[] = [
  { id: 'general', labelEn: 'General', labelRu: 'Общие', icon: '💊' },
  { id: 'prescription', labelEn: 'Prescription', labelRu: 'По рецепту', icon: '📋' },
  { id: 'vitamins', labelEn: 'Vitamins', labelRu: 'Витамины', icon: '🌿' },
  { id: 'skincare', labelEn: 'Skincare', labelRu: 'Уход за кожей', icon: '✨' },
  { id: 'baby', labelEn: 'Baby Care', labelRu: 'Детское', icon: '👶' },
  { id: 'first-aid', labelEn: 'First Aid', labelRu: 'Первая помощь', icon: '🩹' },
];

// ====== PHARMACY FEATURES ======
export const pharmacyFeatureOptions: FilterOption[] = [
  { id: '24h', labelEn: '24/7 Open', labelRu: 'Круглосуточно', icon: '🕐' },
  { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: '🚚' },
  { id: 'pharmacist', labelEn: 'Pharmacist Consult', labelRu: 'Консультация', icon: '👨‍⚕️' },
  { id: 'express', labelEn: 'Express Delivery', labelRu: 'Экспресс', icon: '⚡' },
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✅' },
];

// ====== DISTANCE OPTIONS ======
export const pharmacyDistanceOptions: FilterOption[] = [
  { id: '1km', labelEn: 'Within 1 km', labelRu: 'До 1 км', icon: '📍' },
  { id: '3km', labelEn: 'Within 3 km', labelRu: 'До 3 км', icon: '📍' },
  { id: '5km', labelEn: 'Within 5 km', labelRu: 'До 5 км', icon: '📍' },
  { id: 'any', labelEn: 'Any Distance', labelRu: 'Любое', icon: '🌐' },
];

// ====== COMPLETE PHARMACY FILTER CONFIG ======
export const pharmacyFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'category',
      titleEn: 'Category',
      titleRu: 'Категория',
      type: 'multi',
      options: pharmacyCategoryOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: pharmacyFeatureOptions,
    },
    {
      id: 'distance',
      titleEn: 'Distance',
      titleRu: 'Расстояние',
      type: 'single',
      options: pharmacyDistanceOptions,
    },
  ],
};
