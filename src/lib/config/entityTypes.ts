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
  ShoppingBag, GraduationCap, Briefcase, Heart, Sparkles
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
    labelEn: 'Accommodation',
    labelRu: 'Жильё',
    pluralEn: 'Properties',
    pluralRu: 'Недвижимость',
    priority: 'primary',
  },
  vehicle: {
    type: 'vehicle',
    icon: Car,
    route: '/transport',
    labelEn: 'Transport',
    labelRu: 'Транспорт',
    pluralEn: 'Vehicles',
    pluralRu: 'Транспорт',
    priority: 'primary',
  },
  transport: {
    type: 'transport',
    icon: Car,
    route: '/transport',
    labelEn: 'Transport',
    labelRu: 'Транспорт',
    pluralEn: 'Transport',
    pluralRu: 'Транспорт',
    priority: 'primary',
  },
  yacht: {
    type: 'yacht',
    icon: Ship,
    route: '/yachts',
    labelEn: 'Boat Charter',
    labelRu: 'Чартер',
    pluralEn: 'Boat Charters',
    pluralRu: 'Аренда яхт и катеров',
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
  tour: {
    type: 'tour',
    icon: MapPin,
    route: '/tours',
    labelEn: 'Tour',
    labelRu: 'Тур',
    pluralEn: 'Tours',
    pluralRu: 'Туры',
    priority: 'secondary',
  },
  experience: {
    type: 'experience',
    icon: Compass,
    route: '/experiences',
    labelEn: 'Experience',
    labelRu: 'Впечатление',
    pluralEn: 'Experiences',
    pluralRu: 'Впечатления',
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
    route: '/salons',
    labelEn: 'Beauty Salon',
    labelRu: 'Салон красоты',
    pluralEn: 'Salons',
    pluralRu: 'Салоны',
    priority: 'secondary',
  },
  clinic: {
    type: 'clinic',
    icon: Building2,
    route: '/clinics',
    labelEn: 'Medical Clinic',
    labelRu: 'Клиника',
    pluralEn: 'Clinics',
    pluralRu: 'Клиники',
    priority: 'secondary',
  },
  gym: {
    type: 'gym',
    icon: Dumbbell,
    route: '/gyms',
    labelEn: 'Gym',
    labelRu: 'Спортзал',
    pluralEn: 'Gyms',
    pluralRu: 'Спортзалы',
    priority: 'secondary',
  },
  babysitter: {
    type: 'babysitter',
    icon: Baby,
    route: '/babysitters',
    labelEn: 'Babysitter',
    labelRu: 'Няня',
    pluralEn: 'Babysitters',
    pluralRu: 'Няни',
    priority: 'secondary',
  },
  pet_service: {
    type: 'pet_service',
    icon: PawPrint,
    route: '/pet-services',
    labelEn: 'Pet Care',
    labelRu: 'Уход за питомцами',
    pluralEn: 'Pet Services',
    pluralRu: 'Услуги для питомцев',
    priority: 'secondary',
  },
  legal_service: {
    type: 'legal_service',
    icon: Scale,
    route: '/legal-services',
    labelEn: 'Legal Service',
    labelRu: 'Юридическая услуга',
    pluralEn: 'Legal Services',
    pluralRu: 'Юридические услуги',
    priority: 'secondary',
  },
  flower_shop: {
    type: 'flower_shop',
    icon: Flower2,
    route: '/flowers',
    labelEn: 'Flower Shop',
    labelRu: 'Цветочный магазин',
    pluralEn: 'Flower Shops',
    pluralRu: 'Цветочные магазины',
    priority: 'secondary',
  },
  marketplace_product: {
    type: 'marketplace_product',
    icon: ShoppingBag,
    route: '/market',
    labelEn: 'Product',
    labelRu: 'Товар',
    pluralEn: 'Products',
    pluralRu: 'Товары',
    priority: 'secondary',
  },
  school: {
    type: 'school',
    icon: GraduationCap,
    route: '/schools',
    labelEn: 'School',
    labelRu: 'Школа',
    pluralEn: 'Schools',
    pluralRu: 'Школы',
    priority: 'secondary',
  },
  kindergarten: {
    type: 'kindergarten',
    icon: Baby,
    route: '/kindergartens',
    labelEn: 'Kindergarten',
    labelRu: 'Детский сад',
    pluralEn: 'Kindergartens',
    pluralRu: 'Детские сады',
    priority: 'secondary',
  },
  coworking: {
    type: 'coworking',
    icon: Briefcase,
    route: '/coworking',
    labelEn: 'Coworking',
    labelRu: 'Коворкинг',
    pluralEn: 'Coworking Spaces',
    pluralRu: 'Коворкинги',
    priority: 'secondary',
  },
  spa: {
    type: 'spa',
    icon: Sparkles,
    route: '/spa',
    labelEn: 'Spa',
    labelRu: 'Спа',
    pluralEn: 'Spas',
    pluralRu: 'Спа-центры',
    priority: 'secondary',
  },
  wellness: {
    type: 'wellness',
    icon: Heart,
    route: '/wellness',
    labelEn: 'Wellness',
    labelRu: 'Велнес',
    pluralEn: 'Wellness Centers',
    pluralRu: 'Велнес-центры',
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
  // Replace underscores and hyphens with spaces
  const formatted = type.replace(/[_-]/g, ' ');
  // Capitalize first letter of each word
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
