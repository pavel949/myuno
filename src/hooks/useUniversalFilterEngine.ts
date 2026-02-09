/**
 * UniversalFilterEngine — P1.2
 * 
 * Replaces ALL vertical-specific filter configs with ONE taxonomy-driven system.
 * Filters are generated from lookup_values table, not static TS constants.
 * 
 * Verticals configure which taxonomy keys to show, not what values exist.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import type { FilterConfig, FilterSection, FilterOption } from '@/components/filters/UniversalFilter';

// ────────────────────────────────────
// TYPES
// ────────────────────────────────────

export interface FilterEngineConfig {
  /** Which taxonomy keys to show as filter sections */
  taxonomyKeys: string[];
  /** Override section titles per key */
  sectionOverrides?: Record<string, { titleEn: string; titleRu: string }>;
  /** Override section types per key */
  typeOverrides?: Record<string, 'single' | 'multi' | 'price-level'>;
  /** Additional static sections (e.g. price level, bedrooms) */
  staticSections?: FilterSection[];
  /** Pre-applied filters from life situation context */
  preApplied?: Record<string, string | string[]>;
}

interface LookupValue {
  id: string;
  lookup_type: string;
  value_key: string;
  value_en: string;
  value_ru: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean;
}

// ────────────────────────────────────
// HOOK: Fetch taxonomy data for filter generation
// ────────────────────────────────────

function useTaxonomyValues(taxonomyKeys: string[]) {
  return useQuery({
    queryKey: ['taxonomy-filter-values', taxonomyKeys],
    queryFn: async () => {
      if (!taxonomyKeys.length) return [];
      
      const { data, error } = await supabase
        .from('lookup_values')
        .select('*')
        .in('lookup_type', taxonomyKeys)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as LookupValue[];
    },
    staleTime: 10 * 60 * 1000, // 10 min cache
    enabled: taxonomyKeys.length > 0,
  });
}

// ────────────────────────────────────
// HOOK: Generate FilterConfig from taxonomy
// ────────────────────────────────────

export function useUniversalFilterEngine(config: FilterEngineConfig): {
  filterConfig: FilterConfig;
  isLoading: boolean;
} {
  const { language } = useLanguage();
  const { data: lookupValues, isLoading } = useTaxonomyValues(config.taxonomyKeys);

  const filterConfig = useMemo<FilterConfig>(() => {
    if (!lookupValues?.length) {
      return { sections: config.staticSections || [] };
    }

    // Group by lookup_type
    const grouped: Record<string, LookupValue[]> = {};
    lookupValues.forEach(lv => {
      if (!grouped[lv.lookup_type]) grouped[lv.lookup_type] = [];
      grouped[lv.lookup_type].push(lv);
    });

    // Generate sections from taxonomy keys in order
    const dynamicSections: FilterSection[] = config.taxonomyKeys
      .filter(key => grouped[key]?.length)
      .map(key => {
        const values = grouped[key];
        const override = config.sectionOverrides?.[key];
        const type = config.typeOverrides?.[key] || 'multi';

        // Generate human-readable title from key
        const autoTitle = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        const options: FilterOption[] = values.map(v => ({
          id: v.value_key,
          labelEn: v.value_en || v.value_key,
          labelRu: v.value_ru || v.value_key,
          icon: v.icon || undefined,
        }));

        return {
          id: key,
          titleEn: override?.titleEn || autoTitle,
          titleRu: override?.titleRu || autoTitle,
          type,
          options,
        };
      });

    // Merge with static sections
    const allSections = [...dynamicSections, ...(config.staticSections || [])];

    return { sections: allSections };
  }, [lookupValues, config.taxonomyKeys, config.sectionOverrides, config.typeOverrides, config.staticSections]);

  return { filterConfig, isLoading };
}

// ────────────────────────────────────
// VERTICAL PRESETS
// Per P1.2: verticals only declare which taxonomy keys to show
// ────────────────────────────────────

export const VERTICAL_FILTER_PRESETS: Record<string, FilterEngineConfig> = {
  beauty: {
    taxonomyKeys: ['service_category', 'salon_feature', 'language'],
    sectionOverrides: {
      service_category: { titleEn: 'Category', titleRu: 'Категория' },
      salon_feature: { titleEn: 'Features', titleRu: 'Особенности' },
      language: { titleEn: 'Languages', titleRu: 'Языки' },
    },
  },
  property: {
    taxonomyKeys: ['property_type', 'district', 'property_feature'],
    sectionOverrides: {
      property_type: { titleEn: 'Property Type', titleRu: 'Тип жилья' },
      district: { titleEn: 'District', titleRu: 'Район' },
      property_feature: { titleEn: 'Amenities', titleRu: 'Удобства' },
    },
    staticSections: [
      {
        id: 'bedrooms',
        titleEn: 'Bedrooms',
        titleRu: 'Спальни',
        type: 'multi',
        options: [
          { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
          { id: '1', labelEn: '1', labelRu: '1' },
          { id: '2', labelEn: '2', labelRu: '2' },
          { id: '3', labelEn: '3', labelRu: '3' },
          { id: '4+', labelEn: '4+', labelRu: '4+' },
        ],
      },
      {
        id: 'price_level',
        titleEn: 'Price Range',
        titleRu: 'Ценовая категория',
        type: 'price-level',
        options: [],
      },
    ],
  },
  restaurants: {
    taxonomyKeys: ['cuisine', 'restaurant_feature', 'price_range'],
    sectionOverrides: {
      cuisine: { titleEn: 'Cuisine', titleRu: 'Кухня' },
      restaurant_feature: { titleEn: 'Features', titleRu: 'Особенности' },
      price_range: { titleEn: 'Price Level', titleRu: 'Ценовой уровень' },
    },
    typeOverrides: {
      price_range: 'price-level',
    },
  },
  transport: {
    taxonomyKeys: ['vehicle_type', 'transmission', 'fuel_type', 'vehicle_feature'],
    sectionOverrides: {
      vehicle_type: { titleEn: 'Vehicle Type', titleRu: 'Тип ТС' },
      transmission: { titleEn: 'Transmission', titleRu: 'КПП' },
      fuel_type: { titleEn: 'Fuel', titleRu: 'Топливо' },
      vehicle_feature: { titleEn: 'Features', titleRu: 'Опции' },
    },
  },
  yachts: {
    taxonomyKeys: ['vessel_type', 'yacht_feature'],
    sectionOverrides: {
      vessel_type: { titleEn: 'Vessel Type', titleRu: 'Тип судна' },
      yacht_feature: { titleEn: 'Features', titleRu: 'Оборудование' },
    },
  },
  medical: {
    taxonomyKeys: ['medical_specialty', 'clinic_type', 'clinic_feature', 'language'],
    sectionOverrides: {
      medical_specialty: { titleEn: 'Specialty', titleRu: 'Специализация' },
      clinic_type: { titleEn: 'Type', titleRu: 'Тип' },
      clinic_feature: { titleEn: 'Features', titleRu: 'Особенности' },
      language: { titleEn: 'Languages', titleRu: 'Языки' },
    },
  },
  fitness: {
    taxonomyKeys: ['gym_type', 'fitness_feature'],
    sectionOverrides: {
      gym_type: { titleEn: 'Type', titleRu: 'Тип' },
      fitness_feature: { titleEn: 'Features', titleRu: 'Удобства' },
    },
  },
  experiences: {
    taxonomyKeys: ['experience_category', 'difficulty_level', 'language'],
    sectionOverrides: {
      experience_category: { titleEn: 'Category', titleRu: 'Категория' },
      difficulty_level: { titleEn: 'Difficulty', titleRu: 'Сложность' },
      language: { titleEn: 'Languages', titleRu: 'Языки' },
    },
  },
  flowers: {
    taxonomyKeys: ['flower_category', 'occasion', 'flower_color'],
    sectionOverrides: {
      flower_category: { titleEn: 'Category', titleRu: 'Категория' },
      occasion: { titleEn: 'Occasion', titleRu: 'Повод' },
      flower_color: { titleEn: 'Color', titleRu: 'Цвет' },
    },
  },
  services: {
    taxonomyKeys: ['service_category', 'language'],
    sectionOverrides: {
      service_category: { titleEn: 'Category', titleRu: 'Категория' },
      language: { titleEn: 'Languages', titleRu: 'Языки' },
    },
  },
  legal: {
    taxonomyKeys: ['legal_category', 'language'],
    sectionOverrides: {
      legal_category: { titleEn: 'Category', titleRu: 'Категория' },
      language: { titleEn: 'Languages', titleRu: 'Языки' },
    },
  },
  education: {
    taxonomyKeys: ['education_type', 'age_group', 'language'],
    sectionOverrides: {
      education_type: { titleEn: 'Type', titleRu: 'Тип' },
      age_group: { titleEn: 'Age Group', titleRu: 'Возраст' },
      language: { titleEn: 'Language', titleRu: 'Язык' },
    },
  },
  pets: {
    taxonomyKeys: ['pet_service_type', 'pet_type'],
    sectionOverrides: {
      pet_service_type: { titleEn: 'Service', titleRu: 'Услуга' },
      pet_type: { titleEn: 'Pet Type', titleRu: 'Тип питомца' },
    },
  },
  cleaning: {
    taxonomyKeys: ['cleaning_type', 'cleaning_feature'],
    sectionOverrides: {
      cleaning_type: { titleEn: 'Type', titleRu: 'Тип' },
      cleaning_feature: { titleEn: 'Includes', titleRu: 'Включает' },
    },
  },
  events: {
    taxonomyKeys: ['event_category', 'event_format'],
    sectionOverrides: {
      event_category: { titleEn: 'Category', titleRu: 'Категория' },
      event_format: { titleEn: 'Format', titleRu: 'Формат' },
    },
  },
  insurance: {
    taxonomyKeys: ['insurance_type', 'coverage_level'],
    sectionOverrides: {
      insurance_type: { titleEn: 'Type', titleRu: 'Тип' },
      coverage_level: { titleEn: 'Coverage', titleRu: 'Покрытие' },
    },
  },
  market: {
    taxonomyKeys: ['product_category'],
    sectionOverrides: {
      product_category: { titleEn: 'Category', titleRu: 'Категория' },
    },
  },
  pharmacy: {
    taxonomyKeys: ['pharmacy_category'],
    sectionOverrides: {
      pharmacy_category: { titleEn: 'Category', titleRu: 'Категория' },
    },
  },
};

/**
 * Convenience hook: get filter config for a specific vertical
 */
export function useVerticalFilters(vertical: string) {
  const preset = VERTICAL_FILTER_PRESETS[vertical];
  return useUniversalFilterEngine(preset || { taxonomyKeys: [] });
}
