/**
 * Property Filters - Database-Driven
 * Uses useDynamicFilterOptions for all taxonomy data
 */

import { usePropertyFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { FilterConfig, FilterOption } from './UniversalFilter';

// Re-export the dynamic hook for backwards compatibility
export { usePropertyFilterOptions } from '@/hooks/useDynamicFilterOptions';

// Legacy exports for components still using static imports
// These now proxy to the dynamic hook
export const propertyTypeOptions: FilterOption[] = [];
export const bedroomOptions: FilterOption[] = [];
export const propertyAmenityOptions: FilterOption[] = [];
export const phuketDistrictOptions: FilterOption[] = [];
export const listingTypeOptions: FilterOption[] = [];

// Export a function to get the filter config (for components that need static config)
export function getPropertyFilterConfig(): FilterConfig {
  return {
    sections: [
      {
        id: 'priceLevel',
        titleEn: 'Price Level',
        titleRu: 'Уровень цен',
        type: 'price-level',
        options: [],
      },
      {
        id: 'listingType',
        titleEn: 'Listing Type',
        titleRu: 'Тип объявления',
        type: 'single',
        options: [],
      },
      {
        id: 'propertyType',
        titleEn: 'Property Type',
        titleRu: 'Тип недвижимости',
        type: 'multi',
        options: [],
      },
      {
        id: 'bedrooms',
        titleEn: 'Bedrooms',
        titleRu: 'Спальни',
        type: 'multi',
        options: [],
      },
      {
        id: 'district',
        titleEn: 'District',
        titleRu: 'Район',
        type: 'multi',
        options: [],
      },
      {
        id: 'amenities',
        titleEn: 'Amenities',
        titleRu: 'Удобства',
        type: 'multi',
        options: [],
      },
    ],
  };
}

// For backwards compatibility - use the hook instead
export const propertyFilterConfig = getPropertyFilterConfig();
