/**
 * Property Form Options Hook - Database-Driven
 * 
 * This is a BRIDGE module that maintains backwards compatibility
 * while migrating to database-driven options via useTaxonomy()
 * 
 * MIGRATION STATUS:
 * - Primary: useDynamicFormOptions.usePropertyFormOptions() 
 * - Fallback: Legacy propertyTaxonomy.ts imports
 */

import { useMemo } from 'react';
import { useTaxonomy, TaxonomyOption } from './useTaxonomy';

// Legacy imports for fallback during migration
import { 
  PROPERTY_TYPES, 
  PHUKET_DISTRICTS, 
  PROPERTY_AMENITIES,
  ALL_AMENITIES,
  LISTING_TYPES,
  BEDROOM_OPTIONS,
  VIEW_TYPES,
  FURNISHING_LEVELS,
  KEY_HANDOVER_METHODS,
  DEPOSIT_TYPES,
  CLEANING_FREQUENCIES,
  PAYMENT_MODELS,
  INCLUDED_SERVICES,
  EXTRA_SERVICES,
  HOUSE_RULES_PRESETS,
  PROPERTY_HIGHLIGHTS,
  DISTRICT_ZONES,
  normalizeAmenityId,
  normalizeDistrictId,
  normalizePropertyType,
  normalizeAmenities,
} from '@/lib/taxonomies';

export interface FormOption {
  id: string;
  value: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
}

export interface DistrictOption extends FormOption {
  zone: string;
  popular: boolean;
}

export interface AmenityOption extends FormOption {
  category: string;
}

export interface PropertyFormOptions {
  propertyTypes: FormOption[];
  districts: DistrictOption[];
  districtsByZone: Record<string, DistrictOption[]>;
  amenities: AmenityOption[];
  amenitiesByCategory: Record<string, AmenityOption[]>;
  listingTypes: FormOption[];
  bedroomOptions: FormOption[];
  viewTypes: FormOption[];
  furnishingLevels: FormOption[];
  keyHandoverMethods: FormOption[];
  depositTypes: FormOption[];
  cleaningFrequencies: FormOption[];
  paymentModels: FormOption[];
  includedServices: FormOption[];
  extraServices: FormOption[];
  houseRulesPresets: FormOption[];
  highlights: FormOption[];
  isLoading?: boolean;
}

// Transform DB option to form option
function toFormOption(opt: TaxonomyOption): FormOption {
  return {
    id: opt.value,
    value: opt.value,
    labelEn: opt.labelEn,
    labelRu: opt.labelRu,
    icon: opt.icon,
  };
}

// Transform legacy item to form option
function legacyToFormOption(item: { id: string; labelEn: string; labelRu: string; icon?: string }): FormOption {
  return {
    id: item.id,
    value: item.id,
    labelEn: item.labelEn,
    labelRu: item.labelRu,
    icon: item.icon,
  };
}

/**
 * Centralized hook for property form options
 * Uses database-driven options with fallback to legacy constants
 */
export function usePropertyFormOptions(): PropertyFormOptions {
  // Try to fetch from database
  const { options: dbPropertyTypes, isLoading: l1 } = useTaxonomy('property_type');
  const { options: dbDistricts, isLoading: l2 } = useTaxonomy('district');
  const { options: dbAmenities, isLoading: l3 } = useTaxonomy('amenity');
  const { options: dbBedrooms, isLoading: l4 } = useTaxonomy('bedroom_option');
  const { options: dbListingTypes, isLoading: l5 } = useTaxonomy('listing_type');
  const { options: dbViewTypes, isLoading: l6 } = useTaxonomy('view_type');
  const { options: dbFurnishing, isLoading: l7 } = useTaxonomy('furnishing_level');
  const { options: dbKeyHandover, isLoading: l8 } = useTaxonomy('key_handover_method');
  const { options: dbDeposit, isLoading: l9 } = useTaxonomy('deposit_type');
  const { options: dbCleaning, isLoading: l10 } = useTaxonomy('cleaning_frequency');
  const { options: dbPayment, isLoading: l11 } = useTaxonomy('payment_model');
  const { options: dbIncluded, isLoading: l12 } = useTaxonomy('included_service');
  const { options: dbExtra, isLoading: l13 } = useTaxonomy('extra_service');
  const { options: dbRules, isLoading: l14 } = useTaxonomy('house_rule');
  const { options: dbHighlights, isLoading: l15 } = useTaxonomy('property_highlight');

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15;

  return useMemo(() => {
    // Use DB data if available, otherwise fallback to legacy
    const propertyTypes: FormOption[] = dbPropertyTypes.length > 0
      ? dbPropertyTypes.map(toFormOption)
      : PROPERTY_TYPES.map(legacyToFormOption);

    const districts: DistrictOption[] = dbDistricts.length > 0
      ? dbDistricts.map(d => ({
          ...toFormOption(d),
          zone: (d.metadata?.zone as string) || 'other',
          popular: (d.metadata?.popular as boolean) || false,
        }))
      : PHUKET_DISTRICTS.map(d => ({
          ...legacyToFormOption(d),
          zone: d.zone,
          popular: d.popular,
        }));

    // Districts grouped by zone
    const districtsByZone: Record<string, DistrictOption[]> = {};
    Object.keys(DISTRICT_ZONES).forEach(zone => {
      districtsByZone[zone] = districts.filter(d => d.zone === zone);
    });

    // Amenities with categories
    const amenities: AmenityOption[] = dbAmenities.length > 0
      ? dbAmenities.map(a => ({
          ...toFormOption(a),
          category: (a.metadata?.category as string) || 'other',
        }))
      : ALL_AMENITIES.map(a => ({
          ...legacyToFormOption(a),
          category: 'other',
        }));

    const amenitiesByCategory: Record<string, AmenityOption[]> = {};
    if (dbAmenities.length > 0) {
      amenities.forEach(a => {
        if (!amenitiesByCategory[a.category]) amenitiesByCategory[a.category] = [];
        amenitiesByCategory[a.category].push(a);
      });
    } else {
      Object.entries(PROPERTY_AMENITIES).forEach(([category, items]) => {
        amenitiesByCategory[category] = items.map(a => ({
          ...legacyToFormOption(a),
          category,
        }));
      });
    }

    // Other options with fallbacks
    const listingTypes: FormOption[] = dbListingTypes.length > 0
      ? dbListingTypes.map(toFormOption)
      : LISTING_TYPES.map(legacyToFormOption);

    const bedroomOptions: FormOption[] = dbBedrooms.length > 0
      ? dbBedrooms.map(toFormOption)
      : BEDROOM_OPTIONS.map(legacyToFormOption);

    const viewTypes: FormOption[] = dbViewTypes.length > 0
      ? dbViewTypes.map(toFormOption)
      : VIEW_TYPES.map(legacyToFormOption);

    const furnishingLevels: FormOption[] = dbFurnishing.length > 0
      ? dbFurnishing.map(toFormOption)
      : FURNISHING_LEVELS.map(legacyToFormOption);

    const keyHandoverMethods: FormOption[] = dbKeyHandover.length > 0
      ? dbKeyHandover.map(toFormOption)
      : KEY_HANDOVER_METHODS.map(legacyToFormOption);

    const depositTypes: FormOption[] = dbDeposit.length > 0
      ? dbDeposit.map(toFormOption)
      : DEPOSIT_TYPES.map(legacyToFormOption);

    const cleaningFrequencies: FormOption[] = dbCleaning.length > 0
      ? dbCleaning.map(toFormOption)
      : CLEANING_FREQUENCIES.map(legacyToFormOption);

    const paymentModels: FormOption[] = dbPayment.length > 0
      ? dbPayment.map(toFormOption)
      : PAYMENT_MODELS.map(legacyToFormOption);

    const includedServices: FormOption[] = dbIncluded.length > 0
      ? dbIncluded.map(toFormOption)
      : INCLUDED_SERVICES.map(legacyToFormOption);

    const extraServices: FormOption[] = dbExtra.length > 0
      ? dbExtra.map(toFormOption)
      : EXTRA_SERVICES.map(legacyToFormOption);

    const houseRulesPresets: FormOption[] = dbRules.length > 0
      ? dbRules.map(toFormOption)
      : HOUSE_RULES_PRESETS.map(legacyToFormOption);

    const highlights: FormOption[] = dbHighlights.length > 0
      ? dbHighlights.map(toFormOption)
      : PROPERTY_HIGHLIGHTS.map(legacyToFormOption);

    return {
      propertyTypes,
      districts,
      districtsByZone,
      amenities,
      amenitiesByCategory,
      listingTypes,
      bedroomOptions,
      viewTypes,
      furnishingLevels,
      keyHandoverMethods,
      depositTypes,
      cleaningFrequencies,
      paymentModels,
      includedServices,
      extraServices,
      houseRulesPresets,
      highlights,
      isLoading,
    };
  }, [
    dbPropertyTypes, dbDistricts, dbAmenities, dbBedrooms, dbListingTypes,
    dbViewTypes, dbFurnishing, dbKeyHandover, dbDeposit, dbCleaning,
    dbPayment, dbIncluded, dbExtra, dbRules, dbHighlights, isLoading
  ]);
}

// Re-export normalization functions for convenience
export { 
  normalizeAmenityId, 
  normalizeDistrictId, 
  normalizePropertyType,
  normalizeAmenities,
};
