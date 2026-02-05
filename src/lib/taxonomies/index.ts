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
// Re-export from dedicated file to prevent circular dependencies
export { TAXONOMY_TYPES, type TaxonomyType } from './taxonomyTypes';

// ============= CANONICAL SOURCES OF TRUTH =============
// Re-export for unified access across the application
export { VERTICALS, type VerticalId, getVerticalById, getVerticalByTable, getAllVerticalIds, normalizeVerticalId } from '../verticals';
export { PRICING_MODELS, type PricingModelId, getPricingModelById, getAllPricingModelIds, formatPriceWithModel, getPricingModelsForVertical } from '../pricing';
export { CURRENCIES, type CurrencyCode, getCurrencySymbol, getCurrencyByCode, formatCurrencyAmount } from '../config/currencies';
