/**
 * @module Taxonomies
 * @description ★ SINGLE SOURCE OF TRUTH for all platform taxonomies ★
 * 
 * ALL taxonomy imports MUST come from this hub.
 * DO NOT import directly from propertyTaxonomy.ts, transportTaxonomy.ts, etc.
 * 
 * USAGE:
 * 1. Import from this hub: import { PROPERTY_TYPES, getDistrictLabel } from '@/lib/taxonomies'
 * 2. Use hooks for dynamic data: useTaxonomyWithFallback('property_type')
 * 3. Use helpers for labels: getTaxonomyLabel('district', 'patong', 'ru')
 * 
 * ARCHITECTURE:
 * - Database (lookup_values) is the runtime source of truth
 * - Static files are compile-time fallbacks (used while DB loads or on error)
 * - useTaxonomyWithFallback() merges both: DB first, static fallback
 */

// ============= DYNAMIC TAXONOMY HOOKS (preferred) =============
// Primary interface for fetching taxonomy data from DB
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
// Uses DB with static fallback — best for gradual migration
export {
  useTaxonomyWithFallback,
  getTaxonomyLabel,
  getTaxonomyIcon,
  getTaxonomyLabels,
  getSelectOptions,
  getChipOptions,
} from './useTaxonomyWithFallback';

// ============= TAXONOMY TYPE CONSTANTS =============
export { TAXONOMY_TYPES, type TaxonomyType } from './taxonomyTypes';

// ============= MASTER TAXONOMY v1.0 (canonical SSOT) =============
// JTBD clusters (A..J), 25 personas P01..P25, deal types, ClearView grades.
// See docs/canonical/00-master-taxonomy.md and src/lib/taxonomies/master.ts
// IMPORTANT: JtbdClusterId (functional) ≠ ClusterId (navigation surface).
export {
  JTBD_CLUSTER_CODES,
  JTBD_CLUSTERS,
  PERSONA_CODES as MASTER_PERSONA_CODES,
  PERSONAS,
  DEAL_TYPES,
  CLEARVIEW_GRADES,
  getJtbdCluster,
  getPersona,
  getPersonasByJtbd,
  getJtbdBySurface,
  type JtbdClusterId,
  type JtbdCluster,
  type PersonaCode as MasterPersonaCode,
  type PersonaDefinition,
  type DealType,
  type ClearViewGrade,
} from './master';

// ============= STATIC NAMESPACE EXPORTS =============
// Use for backward compatibility and type definitions only
export * as PropertyTaxonomy from '../propertyTaxonomy';
export * as TransportTaxonomy from '../config/transportTaxonomy';
export * as HomeServicesTaxonomy from '../config/homeServicesTaxonomy';
export * as ExperiencesTaxonomy from './experiencesTaxonomy';
export * as BeautyTaxonomy from './beautyTaxonomy';
export * as RestaurantTaxonomy from './restaurantTaxonomy';
export * as MedicalTaxonomy from './medicalTaxonomy';
export * as EducationTaxonomy from './educationTaxonomy';

// ============= PROPERTY ATTRIBUTE REGISTRY (canonical IDs / normalization) =============
export {
  normalizeListingAmenityId,
  normalizeHighlightId,
  normalizeEquipmentId,
  normalizeProjectFacilityId,
  normalizeProjectFacilityIds,
  normalizeListingAmenities,
  normalizeHighlightIds,
  normalizeEquipmentIds,
  normalizePropertyTaxonomyArrays,
  getProjectFacilityLabel,
  isKnownListingAmenity,
  PROJECT_FACILITY_LABELS,
  LISTING_AMENITY_UI_GROUPS,
  ALL_LISTING_AMENITY_UI_ITEMS,
  HIGHLIGHT_UI_ITEMS,
} from '../propertyAttributeRegistry';

// ============= PROPERTY TAXONOMY =============
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
  POPULAR_DISTRICTS,
  DISTRICT_ZONES,
  // Helper functions
  getAmenityLabel,
  getAmenityIcon,
  getDistrictLabel,
  getPropertyTypeLabel,
  getHighlightLabel,
  getViewTypeLabel,
  getIncludedServiceLabel,
  getExtraServiceLabel,
  normalizeAmenityId,
  normalizeAmenities,
  normalizeDistrictId,
  normalizePropertyType,
  getAmenityById,
  getDistrictById,
  getDistrictsByZone,
  // Types
  type PropertyType,
  type DistrictId,
  type AmenityId,
  type IncludedServiceId,
  type ExtraServiceId,
  type HighlightId,
  type ViewTypeId,
  type FurnishingLevel,
  type KeyHandoverMethod,
  type DepositType,
  type CleaningFrequency,
  type PaymentModel,
} from '../propertyTaxonomy';

// ============= TRANSPORT TAXONOMY =============
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
  // Types
  type VehicleCategory,
  type TransmissionType as TransmissionTypeId,
  type FuelType as FuelTypeId,
} from '../config/transportTaxonomy';

// ============= HOME SERVICES TAXONOMY =============
export {
  SERVICE_DOMAINS,
  ALL_SERVICE_CATEGORIES,
  DOMAIN_MAP,
  CATEGORY_MAP as SERVICE_CATEGORY_MAP,
  PROVIDER_TYPE_OPTIONS,
  HOME_SERVICE_CATEGORY_IDS,
  LEGACY_CATEGORY_MAP,
  // Helper functions
  getCategoryById,
  getDomainByCategory,
  getCategoriesByDomain,
  normalizeCategory,
  // Types
  type ServiceDomain,
  type ProviderType,
  type ServiceCategory,
  type ServiceDomainConfig,
} from '../config/homeServicesTaxonomy';

// ============= CANONICAL SOURCES OF TRUTH =============
export { VERTICALS, type VerticalId, getVerticalById, getVerticalByTable, getAllVerticalIds, normalizeVerticalId } from '../verticals';
export { PRICING_MODELS, type PricingModelId, getPricingModelById, getAllPricingModelIds, formatPriceWithModel, getPricingModelsForVertical } from '../pricing';
export { CURRENCIES, type CurrencyCode, getCurrencySymbol, getCurrencyByCode, formatCurrencyAmount } from '../config/currencies';
