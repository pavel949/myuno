/**
 * @module TaxonomyTypes
 * @description Taxonomy type constants — synced with lookup_values.lookup_type in DB
 * 
 * Use these keys when querying the lookup_values table.
 * Last synced: 2026-03-07 (51 types)
 */

export const TAXONOMY_TYPES = {
  // ============= Property =============
  PROPERTY_TYPE: 'property_type',
  DISTRICT: 'district',
  BEDROOM: 'bedroom_option',
  LISTING_TYPE: 'listing_type',
  AMENITY: 'amenity',
  VIEW_TYPE: 'view_type',
  FURNISHING: 'furnishing_level',
  HOUSE_RULE: 'house_rule',
  INCLUDED_SERVICE: 'included_service',
  EXTRA_SERVICE: 'extra_service',
  PROPERTY_HIGHLIGHT: 'property_highlight',
  PARKING_TYPE: 'parking_type',
  POOL_TYPE: 'pool_type',
  GARDEN_TYPE: 'garden_type',
  CANCELLATION_POLICY: 'cancellation_policy',
  OWNERSHIP_FORM: 'ownership_form',
  MANAGEMENT_TYPE: 'management_type',
  EQUIPMENT: 'equipment',
  KEY_HANDOVER_METHOD: 'key_handover_method',
  CLEANING_FREQUENCY: 'cleaning_frequency',
  DEPOSIT_TYPE: 'deposit_type',
  PAYMENT_MODEL: 'payment_model',

  // ============= Transport =============
  VEHICLE_CATEGORY: 'vehicle_category',
  VEHICLE_TYPE: 'vehicle_type',
  TRANSMISSION: 'transmission_type',
  FUEL_TYPE: 'fuel_type',
  VEHICLE_FEATURE: 'vehicle_feature',
  TRANSFER_TYPE: 'transfer_type',
  TRANSFER_VEHICLE: 'transfer_vehicle',
  TRANSFER_FEATURE: 'transfer_feature',

  // ============= Flowers =============
  FLOWER_CATEGORY: 'flower_category',
  FLOWER_OCCASION: 'flower_occasion',
  FLOWER_COLOR: 'flower_color',

  // ============= Home Services =============
  HOME_SERVICE_DOMAIN: 'home_service_domain',
  HOME_SERVICE_CATEGORY: 'home_service_category',
  PROVIDER_TYPE: 'provider_type',

  // ============= Yachts =============
  YACHT_TYPE: 'yacht_type',
  YACHT_AMENITY: 'yacht_amenity',
  YACHT_ADDON: 'yacht_addon',
  YACHT_EXPERIENCE: 'yacht_experience',
  CHARTER_DURATION: 'charter_duration',

  // ============= Food & Restaurants =============
  CUISINE: 'cuisine',
  DIETARY_OPTION: 'dietary_option',
  RESTAURANT_FEATURE: 'restaurant_feature',

  // ============= Experiences & Tours =============
  EXPERIENCE_CATEGORY: 'experience_category',
  TOUR_TYPE: 'tour_type',
  EVENT_CATEGORY: 'event_category',
  WATER_ACTIVITY_CATEGORY: 'water_activity_category',

  // ============= Health & Wellness =============
  PET_TYPE: 'pet_type',
  INVESTMENT_CATEGORY: 'investment_category',

  // ============= System =============
  VERTICAL: 'vertical',
} as const;

export type TaxonomyType = typeof TAXONOMY_TYPES[keyof typeof TAXONOMY_TYPES];

// ============= CROSS-REFERENCES TO CANONICAL SOURCES =============
// These SoT files should be used for their respective domains:
// - Verticals: src/lib/verticals.ts
// - Pricing Models: src/lib/pricing.ts
// - Currencies: src/lib/config/currencies.ts
// - Auth Roles: src/types/auth.ts
// - Order Statuses: src/types/orders.ts
