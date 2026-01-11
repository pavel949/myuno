// Export all filter components
export { UniversalFilter, QuickFilterBar, ActiveFilters } from './UniversalFilter';
export type { FilterConfig, FilterOption, FilterValues, FilterSection, UniversalFilterProps } from './UniversalFilter';

// Category-specific filter configs
export { 
  restaurantFilterConfig, 
  deliveryFilterConfig, 
  reservationFilterConfig,
  cuisineOptions,
  featureOptions,
  occasionOptions,
  dietaryOptions,
  deliveryOptions,
  sortOptions,
} from './RestaurantFilters';
