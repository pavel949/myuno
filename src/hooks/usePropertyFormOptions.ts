import { useMemo } from 'react';
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
} from '@/lib/propertyTaxonomy';

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
}

/**
 * Centralized hook for property form options
 * Single source of truth for all dropdowns, checkboxes, filters
 */
export function usePropertyFormOptions(): PropertyFormOptions {
  return useMemo(() => {
    // Property Types
    const propertyTypes: FormOption[] = PROPERTY_TYPES.map(t => ({
      id: t.id,
      value: t.id,
      labelEn: t.labelEn,
      labelRu: t.labelRu,
      icon: t.icon,
    }));

    // Districts with zones
    const districts: DistrictOption[] = PHUKET_DISTRICTS.map(d => ({
      id: d.id,
      value: d.id,
      labelEn: d.labelEn,
      labelRu: d.labelRu,
      icon: d.icon,
      zone: d.zone,
      popular: d.popular,
    }));

    // Districts grouped by zone
    const districtsByZone: Record<string, DistrictOption[]> = {};
    Object.keys(DISTRICT_ZONES).forEach(zone => {
      districtsByZone[zone] = districts.filter(d => d.zone === zone);
    });

    // Amenities with categories
    const amenities: AmenityOption[] = [];
    const amenitiesByCategory: Record<string, AmenityOption[]> = {};

    Object.entries(PROPERTY_AMENITIES).forEach(([category, items]) => {
      amenitiesByCategory[category] = items.map(a => ({
        id: a.id,
        value: a.id,
        labelEn: a.labelEn,
        labelRu: a.labelRu,
        icon: a.icon,
        category,
      }));
      amenities.push(...amenitiesByCategory[category]);
    });

    // Listing Types
    const listingTypes: FormOption[] = LISTING_TYPES.map(l => ({
      id: l.id,
      value: l.id,
      labelEn: l.labelEn,
      labelRu: l.labelRu,
      icon: l.icon,
    }));

    // Bedroom Options
    const bedroomOptions: FormOption[] = BEDROOM_OPTIONS.map(b => ({
      id: b.id,
      value: b.id,
      labelEn: b.labelEn,
      labelRu: b.labelRu,
      icon: b.icon,
    }));

    // View Types
    const viewTypes: FormOption[] = VIEW_TYPES.map(v => ({
      id: v.id,
      value: v.id,
      labelEn: v.labelEn,
      labelRu: v.labelRu,
      icon: v.icon,
    }));

    // Furnishing Levels
    const furnishingLevels: FormOption[] = FURNISHING_LEVELS.map(f => ({
      id: f.id,
      value: f.id,
      labelEn: f.labelEn,
      labelRu: f.labelRu,
      icon: f.icon,
    }));

    // Key Handover Methods
    const keyHandoverMethods: FormOption[] = KEY_HANDOVER_METHODS.map(k => ({
      id: k.id,
      value: k.id,
      labelEn: k.labelEn,
      labelRu: k.labelRu,
      icon: k.icon,
    }));

    // Deposit Types
    const depositTypes: FormOption[] = DEPOSIT_TYPES.map(d => ({
      id: d.id,
      value: d.id,
      labelEn: d.labelEn,
      labelRu: d.labelRu,
      icon: d.icon,
    }));

    // Cleaning Frequencies
    const cleaningFrequencies: FormOption[] = CLEANING_FREQUENCIES.map(c => ({
      id: c.id,
      value: c.id,
      labelEn: c.labelEn,
      labelRu: c.labelRu,
      icon: c.icon,
    }));

    // Payment Models
    const paymentModels: FormOption[] = PAYMENT_MODELS.map(p => ({
      id: p.id,
      value: p.id,
      labelEn: p.labelEn,
      labelRu: p.labelRu,
      icon: p.icon,
    }));

    // Included Services
    const includedServices: FormOption[] = INCLUDED_SERVICES.map(s => ({
      id: s.id,
      value: s.id,
      labelEn: s.labelEn,
      labelRu: s.labelRu,
      icon: s.icon,
    }));

    // Extra Services
    const extraServices: FormOption[] = EXTRA_SERVICES.map(s => ({
      id: s.id,
      value: s.id,
      labelEn: s.labelEn,
      labelRu: s.labelRu,
      icon: s.icon,
    }));

    // House Rules Presets
    const houseRulesPresets: FormOption[] = HOUSE_RULES_PRESETS.map(r => ({
      id: r.id,
      value: r.id,
      labelEn: r.labelEn,
      labelRu: r.labelRu,
      icon: r.icon,
    }));

    // Highlights
    const highlights: FormOption[] = PROPERTY_HIGHLIGHTS.map(h => ({
      id: h.id,
      value: h.id,
      labelEn: h.labelEn,
      labelRu: h.labelRu,
      icon: h.icon,
    }));

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
    };
  }, []);
}

// Re-export normalization functions for convenience
export { 
  normalizeAmenityId, 
  normalizeDistrictId, 
  normalizePropertyType,
  normalizeAmenities,
};
