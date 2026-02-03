/**
 * @module Taxonomies
 * @description Central export hub for all platform taxonomies
 * Provides unified access to both static fallbacks and dynamic database values
 * 
 * USAGE:
 * 1. Import from this hub instead of direct file imports
 * 2. Use hooks for dynamic data: useTaxonomyWithFallback('property_type')
 * 3. Use helpers for labels: getTaxonomyLabel('district', 'patong', 'ru')
 */

// ============= STATIC TAXONOMY NAMESPACES =============
// Use for backward compatibility and type definitions
export * as PropertyTaxonomy from '../propertyTaxonomy';
export * as TransportTaxonomy from '../config/transportTaxonomy';
export * as HomeServicesTaxonomy from '../config/homeServicesTaxonomy';
export * as ExperiencesTaxonomy from './experiencesTaxonomy';
export * as BeautyTaxonomy from './beautyTaxonomy';

// ============= DYNAMIC TAXONOMY HOOKS =============
// Primary interface for fetching taxonomy data
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

// ============= HYBRID FALLBACK SYSTEM =============
// Uses DB with static fallback for gradual migration
export {
  useTaxonomyWithFallback,
  getTaxonomyLabel,
  getTaxonomyIcon,
  getTaxonomyLabels,
  getSelectOptions,
  getChipOptions,
} from './useTaxonomyWithFallback';

// ============= DIRECT STATIC EXPORTS =============
// For components that need direct access to static arrays
export {
  PROPERTY_TYPES,
  PHUKET_DISTRICTS,
  BEDROOM_OPTIONS,
  ALL_AMENITIES,
  PROPERTY_AMENITIES,
  VIEW_TYPES,
  FURNISHING_LEVELS,
  LISTING_TYPES,
  KEY_HANDOVER_METHODS,
  DEPOSIT_TYPES,
  CLEANING_FREQUENCIES,
  PAYMENT_MODELS,
  HOUSE_RULES_PRESETS,
  INCLUDED_SERVICES,
  EXTRA_SERVICES,
  PROPERTY_HIGHLIGHTS,
  // Helper functions
  getAmenityLabel,
  getAmenityIcon,
  getDistrictLabel,
  getPropertyTypeLabel,
  normalizeAmenityId,
  normalizeAmenities,
  normalizeDistrictId,
  normalizePropertyType,
  getIncludedServiceLabel,
  getExtraServiceLabel,
} from '../propertyTaxonomy';

export {
  VEHICLE_CATEGORIES,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
  VEHICLE_FEATURES,
  CATEGORY_MAP as VEHICLE_CATEGORY_MAP,
  TRANSMISSION_MAP,
  FUEL_MAP,
  FEATURE_MAP,
  // Helper functions
  normalizeVehicleType,
  getCategoryConfig,
  getTransmissionLabel,
  getFuelLabel,
  getLocalizedFeatures,
  getRibbonCategories,
  matchesCategory,
} from '../config/transportTaxonomy';

export {
  SERVICE_DOMAINS,
  ALL_SERVICE_CATEGORIES,
  DOMAIN_MAP,
  CATEGORY_MAP as SERVICE_CATEGORY_MAP,
  PROVIDER_TYPE_OPTIONS,
  // Helper functions
  getCategoryById,
  getDomainByCategory,
  getCategoriesByDomain,
  normalizeCategory,
} from '../config/homeServicesTaxonomy';

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
  INCLUDED_SERVICE: 'included_service',
  EXTRA_SERVICE: 'extra_service',
  PROPERTY_HIGHLIGHT: 'property_highlight',
  
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
