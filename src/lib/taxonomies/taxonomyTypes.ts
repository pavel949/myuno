/**
 * @module TaxonomyTypes
 * @description Taxonomy type constants - extracted to prevent circular dependencies
 * 
 * Use these keys when querying the lookup_values table
 */

export const TAXONOMY_TYPES = {
  // Property - Core
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
  
  // Property - Characteristics
  PARKING_TYPE: 'parking_type',
  POOL_TYPE: 'pool_type',
  GARDEN_TYPE: 'garden_type',
  CANCELLATION_POLICY: 'cancellation_policy',
  OWNERSHIP_FORM: 'ownership_form',
  MANAGEMENT_TYPE: 'management_type',
  EQUIPMENT: 'equipment',
  
  // Transport
  VEHICLE_CATEGORY: 'vehicle_category',
  TRANSMISSION: 'transmission',
  FUEL_TYPE: 'fuel_type',
  VEHICLE_FEATURE: 'vehicle_feature',
  
  // Flowers
  FLOWER_CATEGORY: 'flower_category',
  FLOWER_OCCASION: 'flower_occasion',
  FLOWER_COLOR: 'flower_color',
  
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

// ============= CROSS-REFERENCES TO CANONICAL SOURCES =============
// These SoT files should be used for their respective domains:
// - Verticals: src/lib/verticals.ts
// - Pricing Models: src/lib/pricing.ts
// - Currencies: src/lib/config/currencies.ts
// - Auth Roles: src/types/auth.ts
// - Order Statuses: src/types/orders.ts
