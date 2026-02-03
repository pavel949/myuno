/**
 * Dynamic Form Options Hook
 * Replaces hardcoded propertyTaxonomy imports with database-driven options
 * Uses useTaxonomy() as the single source of truth
 */

import { useMemo } from 'react';
import { useTaxonomy, TaxonomyOption } from './useTaxonomy';

export interface FormOption {
  id: string;
  value: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
}

export interface DistrictOption extends FormOption {
  zone?: string;
  popular?: boolean;
}

export interface AmenityOption extends FormOption {
  category?: string;
}

// Transform helper
function toFormOption(opt: TaxonomyOption): FormOption {
  return {
    id: opt.value,
    value: opt.value,
    labelEn: opt.labelEn,
    labelRu: opt.labelRu,
    icon: opt.icon,
  };
}

function toFormOptions(options: TaxonomyOption[]): FormOption[] {
  return options.map(toFormOption);
}

// ============= PROPERTY FORM OPTIONS =============

export function usePropertyFormOptions() {
  // Core property options
  const { options: propertyTypes, isLoading: l1 } = useTaxonomy('property_type');
  const { options: districts, isLoading: l2 } = useTaxonomy('district');
  const { options: listingTypes, isLoading: l3 } = useTaxonomy('listing_type');
  const { options: bedroomOptions, isLoading: l4 } = useTaxonomy('bedroom_option');
  
  // Amenities (grouped)
  const { options: amenities, isLoading: l5 } = useTaxonomy('amenity');
  
  // Views and furnishing
  const { options: viewTypes, isLoading: l6 } = useTaxonomy('view_type');
  const { options: furnishingLevels, isLoading: l7 } = useTaxonomy('furnishing_level');
  
  // Booking & services
  const { options: keyHandoverMethods, isLoading: l8 } = useTaxonomy('key_handover_method');
  const { options: depositTypes, isLoading: l9 } = useTaxonomy('deposit_type');
  const { options: cleaningFrequencies, isLoading: l10 } = useTaxonomy('cleaning_frequency');
  const { options: paymentModels, isLoading: l11 } = useTaxonomy('payment_model');
  const { options: includedServices, isLoading: l12 } = useTaxonomy('included_service');
  const { options: extraServices, isLoading: l13 } = useTaxonomy('extra_service');
  const { options: houseRulesPresets, isLoading: l14 } = useTaxonomy('house_rule');
  const { options: highlights, isLoading: l15 } = useTaxonomy('property_highlight');

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15;

  // Group districts by zone (from metadata)
  const districtsByZone = useMemo(() => {
    const grouped: Record<string, DistrictOption[]> = {};
    districts.forEach(d => {
      const zone = (d.metadata?.zone as string) || 'other';
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push({
        ...toFormOption(d),
        zone,
        popular: d.metadata?.popular as boolean || false,
      });
    });
    return grouped;
  }, [districts]);

  // Group amenities by category (from metadata)
  const amenitiesByCategory = useMemo(() => {
    const grouped: Record<string, AmenityOption[]> = {};
    amenities.forEach(a => {
      const category = (a.metadata?.category as string) || 'other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({
        ...toFormOption(a),
        category,
      });
    });
    return grouped;
  }, [amenities]);

  return {
    propertyTypes: toFormOptions(propertyTypes),
    districts: districts.map(d => ({
      ...toFormOption(d),
      zone: (d.metadata?.zone as string) || 'other',
      popular: d.metadata?.popular as boolean || false,
    })) as DistrictOption[],
    districtsByZone,
    amenities: amenities.map(a => ({
      ...toFormOption(a),
      category: (a.metadata?.category as string) || 'other',
    })) as AmenityOption[],
    amenitiesByCategory,
    listingTypes: toFormOptions(listingTypes),
    bedroomOptions: toFormOptions(bedroomOptions),
    viewTypes: toFormOptions(viewTypes),
    furnishingLevels: toFormOptions(furnishingLevels),
    keyHandoverMethods: toFormOptions(keyHandoverMethods),
    depositTypes: toFormOptions(depositTypes),
    cleaningFrequencies: toFormOptions(cleaningFrequencies),
    paymentModels: toFormOptions(paymentModels),
    includedServices: toFormOptions(includedServices),
    extraServices: toFormOptions(extraServices),
    houseRulesPresets: toFormOptions(houseRulesPresets),
    highlights: toFormOptions(highlights),
    isLoading,
  };
}

// ============= TRANSPORT FORM OPTIONS =============

export function useTransportFormOptions() {
  const { options: vehicleTypes, isLoading: l1 } = useTaxonomy('vehicle_type');
  const { options: transmissions, isLoading: l2 } = useTaxonomy('transmission_type');
  const { options: fuelTypes, isLoading: l3 } = useTaxonomy('fuel_type');
  const { options: features, isLoading: l4 } = useTaxonomy('vehicle_feature');

  const isLoading = l1 || l2 || l3 || l4;

  return {
    vehicleTypes: toFormOptions(vehicleTypes),
    transmissions: toFormOptions(transmissions),
    fuelTypes: toFormOptions(fuelTypes),
    features: toFormOptions(features),
    isLoading,
  };
}

// ============= HOME SERVICES FORM OPTIONS =============

export function useHomeServiceFormOptions() {
  const { options: domains, isLoading: l1 } = useTaxonomy('home_service_domain');
  const { options: categories, isLoading: l2 } = useTaxonomy('home_service_category');
  const { options: providerTypes, isLoading: l3 } = useTaxonomy('provider_type');

  const isLoading = l1 || l2 || l3;

  // Group categories by domain (from parent_id or metadata)
  const categoriesByDomain = useMemo(() => {
    const grouped: Record<string, FormOption[]> = {};
    categories.forEach(c => {
      const domain = c.parentId || (c.metadata?.domain as string) || 'other';
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(toFormOption(c));
    });
    return grouped;
  }, [categories]);

  return {
    domains: toFormOptions(domains),
    categories: toFormOptions(categories),
    categoriesByDomain,
    providerTypes: toFormOptions(providerTypes),
    isLoading,
  };
}

// ============= HELPER FUNCTIONS =============

/**
 * Get label for a value from options array
 */
export function getLabelFromOptions(
  options: FormOption[],
  value: string | null | undefined,
  language: string = 'en'
): string {
  if (!value) return '';
  const option = options.find(o => o.id === value || o.value === value);
  if (!option) return value;
  return language === 'ru' ? option.labelRu : option.labelEn;
}

/**
 * Get multiple labels for an array of values
 */
export function getLabelsFromOptions(
  options: FormOption[],
  values: string[] | null | undefined,
  language: string = 'en'
): string[] {
  if (!values?.length) return [];
  return values.map(v => getLabelFromOptions(options, v, language));
}

/**
 * Get icon for a value from options array
 */
export function getIconFromOptions(
  options: FormOption[],
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;
  const option = options.find(o => o.id === value || o.value === value);
  return option?.icon;
}
