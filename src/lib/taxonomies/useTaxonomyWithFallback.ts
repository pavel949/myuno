/**
 * @module useTaxonomyWithFallback
 * @description Hybrid hook that uses dynamic DB values with static fallbacks
 * Enables gradual migration from hardcoded taxonomies to database-driven ones
 */

import { useMemo } from 'react';
import { useTaxonomy, TaxonomyOption } from '@/hooks/useTaxonomy';
import { TAXONOMY_TYPES } from './index';

// Import static fallbacks
import { 
  PROPERTY_TYPES, 
  PHUKET_DISTRICTS, 
  BEDROOM_OPTIONS,
  ALL_AMENITIES,
  VIEW_TYPES,
  FURNISHING_LEVELS,
} from '../propertyTaxonomy';
import { 
  VEHICLE_CATEGORIES, 
  TRANSMISSION_TYPES, 
  FUEL_TYPES, 
  VEHICLE_FEATURES 
} from '../config/transportTaxonomy';
import { ALL_SERVICE_CATEGORIES } from '../config/homeServicesTaxonomy';

// Type for static taxonomy items
interface StaticTaxonomyItem {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
  [key: string]: unknown;
}

// Map taxonomy types to their static fallbacks
const STATIC_FALLBACKS: Record<string, readonly StaticTaxonomyItem[]> = {
  [TAXONOMY_TYPES.PROPERTY_TYPE]: PROPERTY_TYPES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.DISTRICT]: PHUKET_DISTRICTS as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.BEDROOM]: BEDROOM_OPTIONS as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.AMENITY]: ALL_AMENITIES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.VIEW_TYPE]: VIEW_TYPES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.FURNISHING]: FURNISHING_LEVELS as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.VEHICLE_CATEGORY]: VEHICLE_CATEGORIES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.TRANSMISSION]: TRANSMISSION_TYPES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.FUEL_TYPE]: FUEL_TYPES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.VEHICLE_FEATURE]: VEHICLE_FEATURES as unknown as StaticTaxonomyItem[],
  [TAXONOMY_TYPES.SERVICE_CATEGORY]: ALL_SERVICE_CATEGORIES as unknown as StaticTaxonomyItem[],
};

/**
 * Transform static taxonomy item to TaxonomyOption format
 */
function staticToOption(item: StaticTaxonomyItem): TaxonomyOption {
  return {
    id: item.id,
    value: item.id,
    labelEn: item.labelEn,
    labelRu: item.labelRu,
    icon: item.icon,
    metadata: item,
  };
}

/**
 * Hook that fetches from DB but falls back to static data if empty/error
 * Perfect for gradual migration to fully dynamic taxonomies
 */
export function useTaxonomyWithFallback(
  lookupType: string,
  options?: {
    includeInactive?: boolean;
    parentId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const { 
    options: dbOptions, 
    isLoading, 
    isError,
    ...rest 
  } = useTaxonomy(lookupType, options);

  const staticFallback = useMemo(() => {
    const fallback = STATIC_FALLBACKS[lookupType];
    if (!fallback) return [];
    return fallback.map(staticToOption);
  }, [lookupType]);

  // Use DB data if available, otherwise fall back to static
  const finalOptions = useMemo(() => {
    if (isLoading) return staticFallback; // Show static while loading
    if (isError || dbOptions.length === 0) return staticFallback;
    return dbOptions;
  }, [dbOptions, isLoading, isError, staticFallback]);

  return {
    options: finalOptions,
    isLoading,
    isError,
    isUsingFallback: isError || dbOptions.length === 0,
    staticFallback,
    ...rest,
  };
}

/**
 * Get a label for a specific value, checking DB first then static
 */
export function getTaxonomyLabel(
  lookupType: string,
  valueKey: string,
  language: 'en' | 'ru' = 'en'
): string {
  const fallback = STATIC_FALLBACKS[lookupType];
  if (!fallback) return valueKey;
  
  const item = fallback.find(i => i.id === valueKey);
  if (!item) return valueKey;
  
  return language === 'ru' ? item.labelRu : item.labelEn;
}

/**
 * Get icon for a specific value from static fallbacks
 */
export function getTaxonomyIcon(lookupType: string, valueKey: string): string | undefined {
  const fallback = STATIC_FALLBACKS[lookupType];
  if (!fallback) return undefined;
  
  const item = fallback.find(i => i.id === valueKey);
  return item?.icon;
}

/**
 * Batch get labels for multiple values
 */
export function getTaxonomyLabels(
  lookupType: string,
  valueKeys: string[],
  language: 'en' | 'ru' = 'en'
): string[] {
  return valueKeys.map(key => getTaxonomyLabel(lookupType, key, language));
}

/**
 * Format options for Select component (static version, no hook)
 */
export function getSelectOptions(
  lookupType: string,
  language: 'en' | 'ru' = 'en'
): Array<{ value: string; label: string }> {
  const fallback = STATIC_FALLBACKS[lookupType];
  if (!fallback) return [];
  
  return fallback.map(item => ({
    value: item.id,
    label: language === 'ru' ? item.labelRu : item.labelEn,
  }));
}

/**
 * Format options for filter chips (static version, no hook)
 */
export function getChipOptions(
  lookupType: string,
  language: 'en' | 'ru' = 'en'
): Array<{ id: string; label: string; icon?: string }> {
  const fallback = STATIC_FALLBACKS[lookupType];
  if (!fallback) return [];
  
  return fallback.map(item => ({
    id: item.id,
    label: language === 'ru' ? item.labelRu : item.labelEn,
    icon: item.icon,
  }));
}
