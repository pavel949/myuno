/**
 * Transport Taxonomy - Single source of truth for vehicle categories
 * Based on Turo/Rentalcars industry standards
 */

export type VehicleCategory = 'sedan' | 'suv' | 'van' | 'luxury' | 'motorcycle' | 'electric' | 'compact';
export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';

export interface VehicleCategoryConfig {
  id: VehicleCategory;
  labelEn: string;
  labelRu: string;
  icon: string;
  /** Legacy IDs that should map to this category */
  aliases: string[];
}

export interface TransmissionConfig {
  id: TransmissionType;
  labelEn: string;
  labelRu: string;
  icon: string;
}

export interface FuelTypeConfig {
  id: FuelType;
  labelEn: string;
  labelRu: string;
  icon: string;
}

export interface VehicleFeatureConfig {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: string;
}

// ====== VEHICLE CATEGORIES ======
export const VEHICLE_CATEGORIES: VehicleCategoryConfig[] = [
  { id: 'sedan', labelEn: 'Sedan', labelRu: 'Седан', icon: '🚗', aliases: ['car', 'standard', 'full-size'] },
  { id: 'compact', labelEn: 'Compact', labelRu: 'Компакт', icon: '🚙', aliases: ['economy', 'small'] },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚙', aliases: ['crossover', '4x4'] },
  { id: 'van', labelEn: 'Van', labelRu: 'Минивэн', icon: '🚐', aliases: ['minivan', 'mpv'] },
  { id: 'luxury', labelEn: 'Luxury', labelRu: 'Премиум', icon: '🏎️', aliases: ['premium', 'vip'] },
  { id: 'motorcycle', labelEn: 'Motorcycle', labelRu: 'Мотоцикл', icon: '🏍️', aliases: ['motorbike', 'bike', 'scooter'] },
  { id: 'electric', labelEn: 'Electric', labelRu: 'Электро', icon: '⚡', aliases: ['ev', 'tesla'] },
];

// ====== TRANSMISSION TYPES ======
export const TRANSMISSION_TYPES: TransmissionConfig[] = [
  { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🔄' },
  { id: 'manual', labelEn: 'Manual', labelRu: 'Механика', icon: '🎛️' },
];

// ====== FUEL TYPES ======
export const FUEL_TYPES: FuelTypeConfig[] = [
  { id: 'petrol', labelEn: 'Petrol', labelRu: 'Бензин', icon: '⛽' },
  { id: 'diesel', labelEn: 'Diesel', labelRu: 'Дизель', icon: '🛢️' },
  { id: 'hybrid', labelEn: 'Hybrid', labelRu: 'Гибрид', icon: '🔋' },
  { id: 'electric', labelEn: 'Electric', labelRu: 'Электро', icon: '⚡' },
];

// ====== VEHICLE FEATURES ======
export const VEHICLE_FEATURES: VehicleFeatureConfig[] = [
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'gps', labelEn: 'GPS Navigation', labelRu: 'GPS навигатор', icon: '📍' },
  { id: 'bluetooth', labelEn: 'Bluetooth', labelRu: 'Bluetooth', icon: '📱' },
  { id: 'usb', labelEn: 'USB Charging', labelRu: 'USB зарядка', icon: '🔌' },
  { id: 'child_seat', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '👶' },
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
  { id: 'insurance', labelEn: 'Full Insurance', labelRu: 'Полная страховка', icon: '🛡️' },
  { id: 'unlimited_km', labelEn: 'Unlimited KM', labelRu: 'Без лимита км', icon: '∞' },
  { id: 'english_driver', labelEn: 'English Driver', labelRu: 'Англ. водитель', icon: '🇬🇧' },
  { id: 'water', labelEn: 'Water', labelRu: 'Вода', icon: '💧' },
  { id: 'dashcam', labelEn: 'Dashcam', labelRu: 'Видеорегистратор', icon: '📹' },
  { id: 'backup_camera', labelEn: 'Backup Camera', labelRu: 'Камера заднего вида', icon: '📷' },
];

// ====== MAPS FOR QUICK LOOKUP ======
export const CATEGORY_MAP: Record<string, VehicleCategoryConfig> = Object.fromEntries(
  VEHICLE_CATEGORIES.flatMap(cat => [
    [cat.id, cat],
    ...cat.aliases.map(alias => [alias, cat])
  ])
);

export const TRANSMISSION_MAP: Record<string, TransmissionConfig> = Object.fromEntries(
  TRANSMISSION_TYPES.map(t => [t.id, t])
);

export const FUEL_MAP: Record<string, FuelTypeConfig> = Object.fromEntries(
  FUEL_TYPES.map(f => [f.id, f])
);

export const FEATURE_MAP: Record<string, VehicleFeatureConfig> = Object.fromEntries(
  VEHICLE_FEATURES.map(f => [f.id, f])
);

// ====== HELPER FUNCTIONS ======

/**
 * Normalize vehicle type to canonical category ID
 * Handles legacy IDs like 'car' → 'sedan', 'motorbike' → 'motorcycle'
 */
export function normalizeVehicleType(type: string | null | undefined): VehicleCategory {
  if (!type) return 'sedan';
  const normalized = type.toLowerCase();
  const category = CATEGORY_MAP[normalized];
  return category ? category.id : 'sedan';
}

/**
 * Get category config by ID or alias
 */
export function getCategoryConfig(type: string | null | undefined): VehicleCategoryConfig {
  const normalized = normalizeVehicleType(type);
  return CATEGORY_MAP[normalized] || VEHICLE_CATEGORIES[0];
}

/**
 * Get transmission label
 */
export function getTransmissionLabel(transmission: string | null | undefined, language: string): string {
  const lang = language === 'ru' ? 'ru' : 'en';
  if (!transmission) return lang === 'ru' ? 'Автомат' : 'Auto';
  const config = TRANSMISSION_MAP[transmission.toLowerCase()];
  if (!config) return transmission;
  return lang === 'ru' ? config.labelRu : config.labelEn;
}

/**
 * Get fuel type label
 */
export function getFuelLabel(fuel: string | null | undefined, language: string): string {
  const lang = language === 'ru' ? 'ru' : 'en';
  if (!fuel) return '';
  const config = FUEL_MAP[fuel.toLowerCase()];
  if (!config) return fuel;
  return lang === 'ru' ? config.labelRu : config.labelEn;
}

/**
 * Get localized feature labels for an array of feature IDs
 */
export function getLocalizedFeatures(features: string[] | null | undefined, language: string): string[] {
  const lang = language === 'ru' ? 'ru' : 'en';
  if (!features?.length) return [];
  return features.map(f => {
    const config = FEATURE_MAP[f.toLowerCase()];
    if (!config) return f;
    return lang === 'ru' ? config.labelRu : config.labelEn;
  });
}

/**
 * Get category ribbon options for UI (MiniAppLayout categories)
 */
export function getRibbonCategories(language: string) {
  const lang = language === 'ru' ? 'ru' : 'en';
  return [
    { id: 'all', labelEn: 'All', labelRu: 'Все' },
    ...VEHICLE_CATEGORIES.map(cat => ({
      id: cat.id,
      labelEn: cat.labelEn,
      labelRu: cat.labelRu,
    }))
  ];
}

/**
 * Check if a vehicle type matches a selected category (including aliases)
 */
export function matchesCategory(vehicleType: string | null | undefined, selectedCategory: string): boolean {
  if (selectedCategory === 'all') return true;
  const normalized = normalizeVehicleType(vehicleType);
  return normalized === selectedCategory;
}
