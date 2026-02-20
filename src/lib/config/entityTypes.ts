/**
 * @module EntityTypes
 * @description Canonical entity type definitions for the catalog
 * 
 * This is the SINGLE SOURCE OF TRUTH for entity type metadata.
 * All components must use these definitions instead of hardcoding labels.
 */

import {
  Home, Car, Ship, UtensilsCrossed, Compass, MapPin, Package,
  Scissors, Building2, Dumbbell, Baby, PawPrint, Scale, Flower2,
  ShoppingBag, GraduationCap, Briefcase, Heart, Sparkles, FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface EntityTypeDefinition {
  /** Database entity_type value */
  type: string;
  /** Icon component */
  icon: LucideIcon;
  /** Route prefix for navigation */
  route: string;
  /** English label */
  labelEn: string;
  /** Russian label */
  labelRu: string;
  /** Default priority in LifeOS flows */
  priority: 'primary' | 'secondary';
  /** Plural label in English */
  pluralEn: string;
  /** Plural label in Russian */
  pluralRu: string;
}

/**
 * Complete entity type configuration
 * Covers all catalog entity types in the platform
 */
export const ENTITY_TYPES: Record<string, EntityTypeDefinition> = {
  property: {
    type: 'property',
    icon: Home,
    route: '/property',
    labelEn: 'Real Estate',
    labelRu: 'Недвижимость',
    pluralEn: 'Real Estate',
    pluralRu: 'Недвижимость',
    priority: 'primary',
  },
  vehicle: {
    type: 'vehicle',
    icon: Car,
    route: '/transport',
    labelEn: 'Car & Bike Rental',
    labelRu: 'Аренда авто и мото',
    pluralEn: 'Car & Bike Rental',
    pluralRu: 'Аренда авто и мото',
    priority: 'primary',
  },
  transport: {
    type: 'transport',
    icon: Car,
    route: '/transport',
    labelEn: 'Car & Bike Rental',
    labelRu: 'Аренда авто и мото',
    pluralEn: 'Car & Bike Rental',
    pluralRu: 'Аренда авто и мото',
    priority: 'primary',
  },
  yacht: {
    type: 'yacht',
    icon: Ship,
    route: '/yachts',
    labelEn: 'Yacht Charter',
    labelRu: 'Яхт-чартер',
    pluralEn: 'Yacht Charter',
    pluralRu: 'Яхт-чартер',
    priority: 'secondary',
  },
  restaurant: {
    type: 'restaurant',
    icon: UtensilsCrossed,
    route: '/restaurants',
    labelEn: 'Restaurant',
    labelRu: 'Ресторан',
    pluralEn: 'Restaurants',
    pluralRu: 'Рестораны',
    priority: 'secondary',
  },
  experience: {
    type: 'experience',
    icon: Compass,
    route: '/experiences',
    labelEn: 'Things To Do',
    labelRu: 'Чем заняться',
    pluralEn: 'Things To Do',
    pluralRu: 'Чем заняться',
    priority: 'secondary',
  },
  service: {
    type: 'service',
    icon: Package,
    route: '/services',
    labelEn: 'Service',
    labelRu: 'Услуга',
    pluralEn: 'Services',
    pluralRu: 'Услуги',
    priority: 'secondary',
  },
  salon: {
    type: 'salon',
    icon: Scissors,
    route: '/beauty',
    labelEn: 'Beauty & Wellness',
    labelRu: 'Красота и велнес',
    pluralEn: 'Beauty & Wellness',
    pluralRu: 'Красота и велнес',
    priority: 'secondary',
  },
  clinic: {
    type: 'clinic',
    icon: Building2,
    route: '/medical',
    labelEn: 'Healthcare',
    labelRu: 'Здоровье',
    pluralEn: 'Healthcare',
    pluralRu: 'Здоровье',
    priority: 'secondary',
  },
  gym: {
    type: 'gym',
    icon: Dumbbell,
    route: '/fitness',
    labelEn: 'Fitness & Gyms',
    labelRu: 'Фитнес и залы',
    pluralEn: 'Fitness & Gyms',
    pluralRu: 'Фитнес и залы',
    priority: 'secondary',
  },
  babysitter: {
    type: 'babysitter',
    icon: Baby,
    route: '/babysitter',
    labelEn: 'Childcare',
    labelRu: 'Присмотр за детьми',
    pluralEn: 'Childcare',
    pluralRu: 'Присмотр за детьми',
    priority: 'secondary',
  },
  pet_service: {
    type: 'pet_service',
    icon: PawPrint,
    route: '/pets',
    labelEn: 'Pet Care',
    labelRu: 'Уход за питомцами',
    pluralEn: 'Pet Care',
    pluralRu: 'Уход за питомцами',
    priority: 'secondary',
  },
  legal_service: {
    type: 'legal_service',
    icon: Scale,
    route: '/legal',
    labelEn: 'Legal Services',
    labelRu: 'Юридические услуги',
    pluralEn: 'Legal Services',
    pluralRu: 'Юридические услуги',
    priority: 'secondary',
  },
  flower_shop: {
    type: 'flower_shop',
    icon: Flower2,
    route: '/flowers',
    labelEn: 'Flower Delivery',
    labelRu: 'Доставка цветов',
    pluralEn: 'Flower Delivery',
    pluralRu: 'Доставка цветов',
    priority: 'secondary',
  },
  marketplace_product: {
    type: 'marketplace_product',
    icon: ShoppingBag,
    route: '/market',
    labelEn: 'Product',
    labelRu: 'Товар',
    pluralEn: 'Marketplace',
    pluralRu: 'Маркетплейс',
    priority: 'secondary',
  },
  school: {
    type: 'school',
    icon: GraduationCap,
    route: '/education',
    labelEn: 'Education & Courses',
    labelRu: 'Образование',
    pluralEn: 'Education & Courses',
    pluralRu: 'Образование',
    priority: 'secondary',
  },
  kindergarten: {
    type: 'kindergarten',
    icon: Baby,
    route: '/education',
    labelEn: 'Kindergarten',
    labelRu: 'Детский сад',
    pluralEn: 'Kindergartens',
    pluralRu: 'Детские сады',
    priority: 'secondary',
  },
  coworking: {
    type: 'coworking',
    icon: Briefcase,
    route: '/services',
    labelEn: 'Coworking',
    labelRu: 'Коворкинг',
    pluralEn: 'Coworking Spaces',
    pluralRu: 'Коворкинги',
    priority: 'secondary',
  },
  spa: {
    type: 'spa',
    icon: Sparkles,
    route: '/beauty',
    labelEn: 'Beauty & Wellness',
    labelRu: 'Красота и велнес',
    pluralEn: 'Beauty & Wellness',
    pluralRu: 'Красота и велнес',
    priority: 'secondary',
  },
  wellness: {
    type: 'wellness',
    icon: Heart,
    route: '/beauty',
    labelEn: 'Beauty & Wellness',
    labelRu: 'Красота и велнес',
    pluralEn: 'Beauty & Wellness',
    pluralRu: 'Красота и велнес',
    priority: 'secondary',
  },
  cleaning: {
    type: 'cleaning',
    icon: Package,
    route: '/cleaning',
    labelEn: 'Home Cleaning',
    labelRu: 'Клининг',
    pluralEn: 'Home Cleaning',
    pluralRu: 'Клининг',
    priority: 'secondary',
  },
  water_activity: {
    type: 'water_activity',
    icon: Compass,
    route: '/experiences',
    labelEn: 'Water Sports',
    labelRu: 'Водный спорт',
    pluralEn: 'Water Sports',
    pluralRu: 'Водный спорт',
    priority: 'secondary',
  },
  insurance: {
    type: 'insurance',
    icon: Package,
    route: '/insurance',
    labelEn: 'Insurance',
    labelRu: 'Страхование',
    pluralEn: 'Insurance',
    pluralRu: 'Страхование',
    priority: 'secondary',
  },
  event: {
    type: 'event',
    icon: Sparkles,
    route: '/events',
    labelEn: 'Event',
    labelRu: 'Событие',
    pluralEn: 'Events',
    pluralRu: 'События',
    priority: 'secondary',
  },
  education: {
    type: 'education',
    icon: GraduationCap,
    route: '/education',
    labelEn: 'Education & Courses',
    labelRu: 'Образование',
    pluralEn: 'Education & Courses',
    pluralRu: 'Образование',
    priority: 'secondary',
  },
  airport_service: {
    type: 'airport_service',
    icon: Package,
    route: '/transport/airport-transfer',
    labelEn: 'Fast Track',
    labelRu: 'Фаст-трек',
    pluralEn: 'Airport Services',
    pluralRu: 'Услуги аэропорта',
    priority: 'secondary',
  },
  transfer: {
    type: 'transfer',
    icon: Car,
    route: '/transfer',
    labelEn: 'Airport & City Transfers',
    labelRu: 'Трансферы',
    pluralEn: 'Airport & City Transfers',
    pluralRu: 'Трансферы',
    priority: 'primary',
  },
  page: {
    type: 'page',
    icon: FileText,
    route: '/',
    labelEn: 'Page',
    labelRu: 'Страница',
    pluralEn: 'Pages',
    pluralRu: 'Страницы',
    priority: 'secondary',
  },
} as const;

/**
 * Get entity type definition with fallback
 */
export function getEntityType(type: string): EntityTypeDefinition {
  return ENTITY_TYPES[type] || {
    type,
    icon: Package,
    route: '/',
    labelEn: formatEntityTypeLabel(type, 'en'),
    labelRu: formatEntityTypeLabel(type, 'ru'),
    pluralEn: formatEntityTypeLabel(type, 'en'),
    pluralRu: formatEntityTypeLabel(type, 'ru'),
    priority: 'secondary',
  };
}

/**
 * Get localized label for entity type
 */
export function getEntityTypeLabel(type: string, locale: 'en' | 'ru' = 'en'): string {
  const def = getEntityType(type);
  return locale === 'ru' ? def.labelRu : def.labelEn;
}

/**
 * Get localized plural label for entity type
 */
export function getEntityTypePluralLabel(type: string, locale: 'en' | 'ru' = 'en'): string {
  const def = getEntityType(type);
  return locale === 'ru' ? def.pluralRu : def.pluralEn;
}

/**
 * Format raw entity type slug into human-readable label
 * Used as fallback when type is not in ENTITY_TYPES
 */
function formatEntityTypeLabel(type: string, locale: 'en' | 'ru'): string {
  const formatted = type.replace(/[_-]/g, ' ');
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all entity type codes
 */
export function getAllEntityTypes(): string[] {
  return Object.keys(ENTITY_TYPES);
}

/**
 * Check if entity type is primary (for LifeOS flows)
 */
export function isPrimaryEntityType(type: string): boolean {
  return getEntityType(type).priority === 'primary';
}
