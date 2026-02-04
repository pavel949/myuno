import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FilterOption, FilterConfig } from '@/components/filters/UniversalFilter';
import { TAXONOMY_TYPES } from '@/lib/taxonomies';

interface LookupValue {
  id: string;
  value_key: string;
  value_en: string;
  value_ru: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

/**
 * Hook to fetch property filter options from lookup_values table
 * This makes all filter options editable from the admin panel
 */
export function usePropertyFilterOptions() {
  const [propertyTypes, setPropertyTypes] = useState<FilterOption[]>([]);
  const [districts, setDistricts] = useState<FilterOption[]>([]);
  const [amenities, setAmenities] = useState<FilterOption[]>([]);
  const [highlights, setHighlights] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('lookup_values')
        .select('id, lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order')
        .in('lookup_type', ['property_type', 'district', 'amenity', 'property_highlight'])
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching filter options:', error);
        setIsLoading(false);
        return;
      }

      const toFilterOption = (item: LookupValue): FilterOption => ({
        id: item.value_key,
        labelEn: item.value_en,
        labelRu: item.value_ru || item.value_en,
        icon: item.icon || undefined,
      });

      const types: FilterOption[] = [];
      const dists: FilterOption[] = [];
      const amens: FilterOption[] = [];
      const highs: FilterOption[] = [];

      (data || []).forEach((item: any) => {
        const option = toFilterOption(item as LookupValue);
        switch (item.lookup_type) {
          case 'property_type':
            types.push(option);
            break;
          case 'district':
            dists.push(option);
            break;
          case 'amenity':
            amens.push(option);
            break;
          case 'property_highlight':
            highs.push(option);
            break;
        }
      });

      setPropertyTypes(types);
      setDistricts(dists);
      setAmenities(amens);
      setHighlights(highs);
      setIsLoading(false);
    };

    fetchOptions();
  }, []);

  // Bedroom options - static as they're numeric
  const bedroomOptions: FilterOption[] = useMemo(() => [
    { id: 'studio', labelEn: 'Studio', labelRu: 'Студия', icon: '🛏️' },
    { id: '1', labelEn: '1 Bedroom', labelRu: '1 спальня', icon: '1️⃣' },
    { id: '2', labelEn: '2 Bedrooms', labelRu: '2 спальни', icon: '2️⃣' },
    { id: '3', labelEn: '3 Bedrooms', labelRu: '3 спальни', icon: '3️⃣' },
    { id: '4+', labelEn: '4+ Bedrooms', labelRu: '4+ спальни', icon: '4️⃣' },
  ], []);

  // Listing type options - static
  const listingTypeOptions: FilterOption[] = useMemo(() => [
    { id: 'rent', labelEn: 'For Rent', labelRu: 'Аренда', icon: '🔑' },
    { id: 'sale', labelEn: 'For Sale', labelRu: 'Продажа', icon: '🏷️' },
  ], []);

  // Build dynamic filter config
  const filterConfig: FilterConfig = useMemo(() => ({
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
        options: listingTypeOptions,
      },
      {
        id: 'propertyType',
        titleEn: 'Property Type',
        titleRu: 'Тип недвижимости',
        type: 'multi',
        options: propertyTypes,
      },
      {
        id: 'bedrooms',
        titleEn: 'Bedrooms',
        titleRu: 'Спальни',
        type: 'multi',
        options: bedroomOptions,
      },
      {
        id: 'district',
        titleEn: 'District',
        titleRu: 'Район',
        type: 'multi',
        options: districts,
      },
      {
        id: 'amenities',
        titleEn: 'Amenities',
        titleRu: 'Удобства',
        type: 'multi',
        options: amenities,
      },
    ],
  }), [propertyTypes, districts, amenities, bedroomOptions, listingTypeOptions]);

  return {
    filterConfig,
    propertyTypes,
    districts,
    amenities,
    highlights,
    bedroomOptions,
    listingTypeOptions,
    isLoading,
  };
}