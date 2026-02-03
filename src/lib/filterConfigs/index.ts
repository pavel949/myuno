/**
 * Unified Filter Configurations Index
 * Export all vertical-specific Klook filter configs
 * 
 * MIGRATION: Now includes dynamic hooks alongside static configs
 */

// Static configs (for backwards compatibility)
export { RESTAURANT_KLOOK_CONFIG, RESTAURANT_CATEGORIES } from './restaurantFiltersKlook';
export { YACHT_KLOOK_CONFIG, YACHT_CATEGORIES } from './yachtFiltersKlook';
export { TRANSPORT_KLOOK_CONFIG, TRANSPORT_CATEGORIES } from './transportFiltersKlook';

// Dynamic hooks (preferred - fetch from database)
export { useRestaurantFilterOptions } from './restaurantFiltersKlook';
export { useYachtFilterOptions } from './yachtFiltersKlook';
export { useTransportFilterOptions } from './transportFiltersKlook';
