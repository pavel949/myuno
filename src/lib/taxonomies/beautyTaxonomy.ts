/**
 * Beauty & Wellness Taxonomy
 * Single source of truth for salon types, services, and specializations
 */

export type SalonType = 
  | 'beauty_salon'
  | 'spa'
  | 'nail_studio'
  | 'barbershop'
  | 'massage'
  | 'wellness'
  | 'fitness';

export type ServiceCategory = 
  | 'hair'
  | 'nails'
  | 'face'
  | 'body'
  | 'massage'
  | 'makeup'
  | 'waxing'
  | 'lashes'
  | 'brows';

export interface SalonTypeConfig {
  id: SalonType;
  labelEn: string;
  labelRu: string;
  icon: string;
  color: string;
}

export interface ServiceCategoryConfig {
  id: ServiceCategory;
  labelEn: string;
  labelRu: string;
  icon: string;
  salonTypes: SalonType[];
}

// ====== SALON TYPES ======
export const SALON_TYPES: SalonTypeConfig[] = [
  { id: 'beauty_salon', labelEn: 'Beauty Salon', labelRu: 'Салон красоты', icon: '💇‍♀️', color: 'pink' },
  { id: 'spa', labelEn: 'Spa', labelRu: 'СПА', icon: '🧖', color: 'teal' },
  { id: 'nail_studio', labelEn: 'Nail Studio', labelRu: 'Ногтевая студия', icon: '💅', color: 'purple' },
  { id: 'barbershop', labelEn: 'Barbershop', labelRu: 'Барбершоп', icon: '✂️', color: 'slate' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж', icon: '💆', color: 'amber' },
  { id: 'wellness', labelEn: 'Wellness', labelRu: 'Веллнес', icon: '🌿', color: 'green' },
  { id: 'fitness', labelEn: 'Fitness', labelRu: 'Фитнес', icon: '🏋️', color: 'orange' },
];

// ====== SERVICE CATEGORIES ======
export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  { id: 'hair', labelEn: 'Hair', labelRu: 'Волосы', icon: '💇', salonTypes: ['beauty_salon', 'barbershop'] },
  { id: 'nails', labelEn: 'Nails', labelRu: 'Ногти', icon: '💅', salonTypes: ['beauty_salon', 'nail_studio'] },
  { id: 'face', labelEn: 'Facial', labelRu: 'Лицо', icon: '✨', salonTypes: ['beauty_salon', 'spa'] },
  { id: 'body', labelEn: 'Body', labelRu: 'Тело', icon: '🧴', salonTypes: ['spa', 'wellness'] },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж', icon: '💆', salonTypes: ['spa', 'massage', 'wellness'] },
  { id: 'makeup', labelEn: 'Makeup', labelRu: 'Макияж', icon: '💄', salonTypes: ['beauty_salon'] },
  { id: 'waxing', labelEn: 'Waxing', labelRu: 'Депиляция', icon: '🌸', salonTypes: ['beauty_salon', 'spa'] },
  { id: 'lashes', labelEn: 'Lashes', labelRu: 'Ресницы', icon: '👁️', salonTypes: ['beauty_salon'] },
  { id: 'brows', labelEn: 'Brows', labelRu: 'Брови', icon: '🤨', salonTypes: ['beauty_salon'] },
];

// ====== AMENITIES ======
export const SALON_AMENITIES = [
  { id: 'parking', labelEn: 'Free Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
  { id: 'drinks', labelEn: 'Complimentary Drinks', labelRu: 'Напитки', icon: '☕' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'kids_friendly', labelEn: 'Kids Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'accessible', labelEn: 'Wheelchair Access', labelRu: 'Для колясок', icon: '♿' },
  { id: 'online_booking', labelEn: 'Online Booking', labelRu: 'Онлайн-запись', icon: '📱' },
  { id: 'cards', labelEn: 'Cards Accepted', labelRu: 'Картой', icon: '💳' },
] as const;

// ====== STAFF SPECIALIZATIONS ======
export const STAFF_SPECIALIZATIONS = [
  { id: 'colorist', labelEn: 'Colorist', labelRu: 'Колорист', icon: '🎨' },
  { id: 'stylist', labelEn: 'Stylist', labelRu: 'Стилист', icon: '✂️' },
  { id: 'nail_tech', labelEn: 'Nail Technician', labelRu: 'Мастер маникюра', icon: '💅' },
  { id: 'massage_therapist', labelEn: 'Massage Therapist', labelRu: 'Массажист', icon: '💆' },
  { id: 'esthetician', labelEn: 'Esthetician', labelRu: 'Косметолог', icon: '✨' },
  { id: 'makeup_artist', labelEn: 'Makeup Artist', labelRu: 'Визажист', icon: '💄' },
  { id: 'lash_tech', labelEn: 'Lash Technician', labelRu: 'Лашмейкер', icon: '👁️' },
  { id: 'brow_artist', labelEn: 'Brow Artist', labelRu: 'Бровист', icon: '🤨' },
] as const;

// ====== MAPS ======
export const SALON_TYPE_MAP: Record<string, SalonTypeConfig> = Object.fromEntries(
  SALON_TYPES.map(t => [t.id, t])
);

export const SERVICE_CATEGORY_MAP: Record<string, ServiceCategoryConfig> = Object.fromEntries(
  SERVICE_CATEGORIES.map(c => [c.id, c])
);

// ====== HELPER FUNCTIONS ======
export function getSalonTypeLabel(id: string, language: 'en' | 'ru'): string {
  const type = SALON_TYPE_MAP[id];
  if (!type) return id;
  return language === 'ru' ? type.labelRu : type.labelEn;
}

export function getServiceCategoryLabel(id: string, language: 'en' | 'ru'): string {
  const cat = SERVICE_CATEGORY_MAP[id];
  if (!cat) return id;
  return language === 'ru' ? cat.labelRu : cat.labelEn;
}

export function getServiceCategoriesForSalon(salonType: SalonType): ServiceCategoryConfig[] {
  return SERVICE_CATEGORIES.filter(cat => cat.salonTypes.includes(salonType));
}

/**
 * Get ribbon categories for salon type filter
 */
export function getSalonRibbonCategories(language: 'en' | 'ru' = 'en') {
  return [
    { id: 'all', label: language === 'ru' ? 'Все' : 'All' },
    ...SALON_TYPES.map(type => ({
      id: type.id,
      label: language === 'ru' ? type.labelRu : type.labelEn,
      icon: type.icon,
    })),
  ];
}

/**
 * Get service category chips for filtering
 */
export function getServiceCategoryChips(language: 'en' | 'ru' = 'en') {
  return SERVICE_CATEGORIES.map(cat => ({
    id: cat.id,
    label: language === 'ru' ? cat.labelRu : cat.labelEn,
    icon: cat.icon,
  }));
}
