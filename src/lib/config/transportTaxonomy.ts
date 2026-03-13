/**
 * @module TransportTaxonomy
 * @deprecated Import from '@/lib/taxonomies' instead of this file directly.
 * This file is a FALLBACK data source. The database (lookup_values) is the source of truth.
 */

export type VehicleCategory = 'sedan' | 'suv' | 'van' | 'luxury' | 'motorcycle' | 'scooter' | 'electric' | 'compact';
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
  { id: 'scooter', labelEn: 'Scooter', labelRu: 'Скутер', icon: '🛵', aliases: ['moped'] },
  { id: 'motorcycle', labelEn: 'Motorcycle', labelRu: 'Мотоцикл', icon: '🏍️', aliases: ['motorbike', 'bike'] },
  { id: 'compact', labelEn: 'Compact', labelRu: 'Компакт', icon: '🚙', aliases: ['economy', 'small'] },
  { id: 'sedan', labelEn: 'Sedan', labelRu: 'Седан', icon: '🚗', aliases: ['car', 'standard', 'full-size'] },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚙', aliases: ['crossover', '4x4', 'pickup'] },
  { id: 'van', labelEn: 'Van', labelRu: 'Минивэн', icon: '🚐', aliases: ['minivan', 'mpv'] },
  { id: 'luxury', labelEn: 'Luxury', labelRu: 'Премиум', icon: '🏎️', aliases: ['premium', 'vip'] },
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
  { id: 'air conditioning', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'gps', labelEn: 'GPS Navigation', labelRu: 'GPS навигатор', icon: '📍' },
  { id: 'gps navigation', labelEn: 'GPS Navigation', labelRu: 'GPS навигатор', icon: '📍' },
  { id: 'bluetooth', labelEn: 'Bluetooth', labelRu: 'Bluetooth', icon: '📱' },
  { id: 'usb', labelEn: 'USB Charging', labelRu: 'USB зарядка', icon: '🔌' },
  { id: 'usb charging', labelEn: 'USB Charging', labelRu: 'USB зарядка', icon: '🔌' },
  { id: 'usb ports', labelEn: 'USB Ports', labelRu: 'USB порты', icon: '🔌' },
  { id: 'child_seat', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '👶' },
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
  { id: 'insurance', labelEn: 'Full Insurance', labelRu: 'Полная страховка', icon: '🛡️' },
  { id: 'unlimited_km', labelEn: 'Unlimited KM', labelRu: 'Без лимита км', icon: '∞' },
  { id: 'english_driver', labelEn: 'English Driver', labelRu: 'Англ. водитель', icon: '🇬🇧' },
  { id: 'water', labelEn: 'Water', labelRu: 'Вода', icon: '💧' },
  { id: 'dashcam', labelEn: 'Dashcam', labelRu: 'Видеорегистратор', icon: '📹' },
  { id: 'backup_camera', labelEn: 'Backup Camera', labelRu: 'Камера заднего вида', icon: '📷' },
  { id: 'backup camera', labelEn: 'Backup Camera', labelRu: 'Камера заднего вида', icon: '📷' },
  { id: 'helmet', labelEn: 'Helmet', labelRu: 'Шлем', icon: '🪖' },
  { id: 'helmet_included', labelEn: 'Helmet Included', labelRu: 'Шлем включён', icon: '🪖' },
  { id: 'airport_meet', labelEn: 'Airport Meet', labelRu: 'Встреча в аэропорту', icon: '✈️' },
  { id: 'luggage_assist', labelEn: 'Luggage Assist', labelRu: 'Помощь с багажом', icon: '🧳' },
  { id: 'roof_rack', labelEn: 'Roof Rack', labelRu: 'Багажник на крыше', icon: '📦' },
  { id: 'storage_box', labelEn: 'Storage Box', labelRu: 'Бокс для хранения', icon: '📦' },
  { id: '4wd', labelEn: '4WD', labelRu: 'Полный привод', icon: '🏔️' },
  { id: 'awd', labelEn: 'AWD', labelRu: 'Полный привод', icon: '🏔️' },
  { id: 'apple carplay', labelEn: 'Apple CarPlay', labelRu: 'Apple CarPlay', icon: '📱' },
  { id: 'android auto', labelEn: 'Android Auto', labelRu: 'Android Auto', icon: '📱' },
  { id: 'cruise control', labelEn: 'Cruise Control', labelRu: 'Круиз-контроль', icon: '🚀' },
  { id: 'adaptive cruise', labelEn: 'Adaptive Cruise', labelRu: 'Адаптивный круиз', icon: '🚀' },
  { id: 'leather seats', labelEn: 'Leather Seats', labelRu: 'Кожаный салон', icon: '💺' },
  { id: 'heated/cooled seats', labelEn: 'Heated/Cooled Seats', labelRu: 'Подогрев/охлаждение сидений', icon: '💺' },
  { id: 'panoramic roof', labelEn: 'Panoramic Roof', labelRu: 'Панорамная крыша', icon: '☀️' },
  { id: 'sunroof', labelEn: 'Sunroof', labelRu: 'Люк', icon: '☀️' },
  { id: 'lane assist', labelEn: 'Lane Assist', labelRu: 'Помощь в полосе', icon: '🛤️' },
  { id: 'head-up display', labelEn: 'Head-Up Display', labelRu: 'Проекция на лобовое', icon: '📊' },
  { id: 'wireless charging', labelEn: 'Wireless Charging', labelRu: 'Беспроводная зарядка', icon: '🔋' },
  { id: 'premium sound system', labelEn: 'Premium Sound', labelRu: 'Премиум звук', icon: '🔊' },
  { id: 'third row seating', labelEn: 'Third Row', labelRu: '3-й ряд сидений', icon: '💺' },
  { id: 'large luggage space', labelEn: 'Large Luggage', labelRu: 'Большой багажник', icon: '🧳' },
  { id: 'rear entertainment', labelEn: 'Rear Entertainment', labelRu: 'Развлечения сзади', icon: '📺' },
  { id: 'captain seats', labelEn: 'Captain Seats', labelRu: 'Капитанские кресла', icon: '💺' },
  { id: 'electric doors', labelEn: 'Electric Doors', labelRu: 'Электро-двери', icon: '🚪' },
  { id: 'dual air conditioning', labelEn: 'Dual AC', labelRu: 'Двухзонный климат', icon: '❄️' },
  { id: 'massage seats', labelEn: 'Massage Seats', labelRu: 'Массажные кресла', icon: '💆' },
  { id: 'ambient lighting', labelEn: 'Ambient Lighting', labelRu: 'Подсветка салона', icon: '💡' },
  { id: 'gesture control', labelEn: 'Gesture Control', labelRu: 'Управление жестами', icon: '👋' },
  { id: 'hands-free tailgate', labelEn: 'Hands-free Tailgate', labelRu: 'Бесключевой багажник', icon: '🚗' },
  { id: 'hill start assist', labelEn: 'Hill Start Assist', labelRu: 'Помощь при старте', icon: '⛰️' },
  { id: 'roof rails', labelEn: 'Roof Rails', labelRu: 'Рейлинги', icon: '📐' },
  { id: 'window curtains', labelEn: 'Window Curtains', labelRu: 'Шторки на окнах', icon: '🪟' },
  { id: 'ottoman function', labelEn: 'Ottoman Function', labelRu: 'Оттоманка', icon: '🛋️' },
  // Bike-specific features
  { id: 'abs', labelEn: 'ABS', labelRu: 'ABS', icon: '🛞' },
  { id: 'traction_control', labelEn: 'Traction Control', labelRu: 'Трекшн-контроль', icon: '⚙️' },
  { id: 'smart_key', labelEn: 'Smart Key', labelRu: 'Бесключевой доступ', icon: '🔑' },
  { id: 'phone_holder', labelEn: 'Phone Holder', labelRu: 'Держатель телефона', icon: '📱' },
  { id: 'usb_charger', labelEn: 'USB Charger', labelRu: 'USB зарядка', icon: '🔌' },
  { id: 'sport_mode', labelEn: 'Sport Mode', labelRu: 'Спорт-режим', icon: '🏎️' },
  { id: 'adventure_style', labelEn: 'Adventure Style', labelRu: 'Стиль Adventure', icon: '🏔️' },
  { id: 'classic_style', labelEn: 'Classic Style', labelRu: 'Классический стиль', icon: '🎩' },
  { id: 'off_road', labelEn: 'Off-Road', labelRu: 'Внедорожный', icon: '🏜️' },
  { id: 'sport', labelEn: 'Sport', labelRu: 'Спорт', icon: '🏁' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Adventure', icon: '🌍' },
  // Additional DB features
  { id: 'apple_carplay', labelEn: 'Apple CarPlay', labelRu: 'Apple CarPlay', icon: '📱' },
  { id: 'child_seat_available', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '👶' },
  { id: 'convertible', labelEn: 'Convertible', labelRu: 'Кабриолет', icon: '🏎️' },
  { id: 'free_delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🚚' },
  { id: 'insurance_casco', labelEn: 'CASCO Insurance', labelRu: 'Страховка КАСКО', icon: '🛡️' },
  { id: 'insurance_included', labelEn: 'Insurance Included', labelRu: 'Страховка включена', icon: '✅' },
  { id: 'leather_seats', labelEn: 'Leather Seats', labelRu: 'Кожаный салон', icon: '💺' },
  { id: 'no_passport_deposit', labelEn: 'No Passport Deposit', labelRu: 'Без залога паспорта', icon: '📄' },
  { id: 'rear_camera', labelEn: 'Rear Camera', labelRu: 'Камера заднего вида', icon: '📷' },
  { id: 'unlimited_mileage', labelEn: 'Unlimited Mileage', labelRu: 'Без лимита км', icon: '∞' },
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
