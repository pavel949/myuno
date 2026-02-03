/**
 * @module TaxonomyTypes
 * @description Taxonomy type constants - extracted to prevent circular dependencies
 * 
 * Use these keys when querying the lookup_values table
 */

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
