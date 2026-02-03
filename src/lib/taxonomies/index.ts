/**
 * @module Taxonomies
 * @description Central export hub for all platform taxonomies
 * Provides unified access to both static fallbacks and dynamic database values
 */

// Re-export static taxonomies with namespaces to avoid conflicts
export * as PropertyTaxonomy from '../propertyTaxonomy';
export * as TransportTaxonomy from '../config/transportTaxonomy';
export * as HomeServicesTaxonomy from '../config/homeServicesTaxonomy';
export * as ExperiencesTaxonomy from './experiencesTaxonomy';
export * as BeautyTaxonomy from './beautyTaxonomy';

// Export dynamic taxonomy hooks
export { 
  useTaxonomy, 
  useTaxonomyHierarchy, 
  useTaxonomyValue, 
  useTaxonomyLabel,
  useTaxonomyLabels,
  formatForSelect,
  formatForChips,
  type TaxonomyOption,
  type TaxonomyValue,
  type TaxonomyHierarchy,
} from '@/hooks/useTaxonomy';

// Export fallback utilities
export {
  useTaxonomyWithFallback,
  getTaxonomyLabel,
  getTaxonomyIcon,
  getTaxonomyLabels,
  getSelectOptions,
  getChipOptions,
} from './useTaxonomyWithFallback';

// ============= TAXONOMY TYPE CONSTANTS =============
// Use these keys when querying the lookup_values table

export const TAXONOMY_TYPES = {
  // Property
  PROPERTY_TYPE: 'property_type',
  DISTRICT: 'district',
  BEDROOM: 'bedroom',
  LISTING_TYPE: 'listing_type',
  AMENITY: 'amenity',
  VIEW_TYPE: 'view_type',
  FURNISHING: 'furnishing',
  HOUSE_RULE: 'house_rule',
  
  // Transport
  VEHICLE_CATEGORY: 'vehicle_category',
  TRANSMISSION: 'transmission',
  FUEL_TYPE: 'fuel_type',
  VEHICLE_FEATURE: 'vehicle_feature',
  
  // Home Services
  SERVICE_DOMAIN: 'service_domain',
  SERVICE_CATEGORY: 'service_category',
  
  // Common
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  PAYMENT_METHOD: 'payment_method',
  
  // Verticals
  SALON_TYPE: 'salon_type',
  RESTAURANT_CUISINE: 'restaurant_cuisine',
  TOUR_CATEGORY: 'tour_category',
  YACHT_TYPE: 'yacht_type',
  PET_TYPE: 'pet_type',
  EDUCATION_TYPE: 'education_type',
  EXPERIENCE_CATEGORY: 'experience_category',
} as const;

export type TaxonomyType = typeof TAXONOMY_TYPES[keyof typeof TAXONOMY_TYPES];
