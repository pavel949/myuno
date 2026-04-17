import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FilterOption, FilterConfig } from '@/components/filters/UniversalFilter';
import {
  VIEW_TYPES,
  FURNISHING_LEVELS,
} from '@/lib/taxonomies';

const POOL_TYPE_OPTIONS: FilterOption[] = [
  { id: 'private', labelEn: 'Private pool', labelRu: 'Частный бассейн' },
  { id: 'infinity', labelEn: 'Infinity pool', labelRu: 'Инфинити-бассейн' },
  { id: 'plunge', labelEn: 'Plunge pool', labelRu: 'Плунж-бассейн' },
  { id: 'shared', labelEn: 'Shared pool', labelRu: 'Общий бассейн' },
  { id: 'none', labelEn: 'No pool', labelRu: 'Нет бассейна' },
];

const PARKING_TYPE_OPTIONS: FilterOption[] = [
  { id: 'garage', labelEn: 'Private garage', labelRu: 'Частный гараж' },
  { id: 'carport', labelEn: 'Carport', labelRu: 'Навес' },
  { id: 'open', labelEn: 'Open parking', labelRu: 'Открытая парковка' },
  { id: 'street', labelEn: 'Street parking', labelRu: 'Уличная парковка' },
  { id: 'none', labelEn: 'No parking', labelRu: 'Нет парковки' },
];

const OWNERSHIP_OPTIONS: FilterOption[] = [
  { id: 'freehold', labelEn: 'Freehold', labelRu: 'Фрихолд' },
  { id: 'leasehold', labelEn: 'Leasehold', labelRu: 'Лизхолд' },
  { id: 'company', labelEn: 'Thai company', labelRu: 'Тайская компания' },
  { id: 'foreign_company', labelEn: 'Foreign LLC', labelRu: 'Иностранная компания' },
];

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

      (data || []).forEach((item) => {
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
    { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
    { id: '1', labelEn: '1+', labelRu: '1+' },
    { id: '2', labelEn: '2+', labelRu: '2+' },
    { id: '3', labelEn: '3+', labelRu: '3+' },
    { id: '4', labelEn: '4+', labelRu: '4+' },
    { id: '5', labelEn: '5+', labelRu: '5+' },
    { id: '6', labelEn: '6+', labelRu: '6+' },
    { id: '8', labelEn: '8+', labelRu: '8+' },
    { id: '10', labelEn: '10+', labelRu: '10+' },
    { id: '12', labelEn: '12+', labelRu: '12+' },
  ], []);

  // Listing type options - static
  const listingTypeOptions: FilterOption[] = useMemo(() => [
    { id: 'rent', labelEn: 'For Rent', labelRu: 'Аренда' },
    { id: 'sale', labelEn: 'For Sale', labelRu: 'Продажа' },
  ], []);

  const viewTypeOptions: FilterOption[] = useMemo(
    () => VIEW_TYPES.map((v) => ({ id: v.id, labelEn: v.labelEn, labelRu: v.labelRu, icon: v.icon })),
    []
  );

  const furnishingOptions: FilterOption[] = useMemo(
    () => FURNISHING_LEVELS.map((f) => ({ id: f.id, labelEn: f.labelEn, labelRu: f.labelRu, icon: f.icon })),
    []
  );

  const guestThresholdOptions: FilterOption[] = useMemo(
    () => [
      { id: 'any', labelEn: 'Any', labelRu: 'Любое' },
      { id: '2', labelEn: '2+ guests', labelRu: 'От 2 гостей' },
      { id: '4', labelEn: '4+ guests', labelRu: 'От 4 гостей' },
      { id: '6', labelEn: '6+ guests', labelRu: 'От 6 гостей' },
      { id: '8', labelEn: '8+ guests', labelRu: 'От 8 гостей' },
    ],
    []
  );

  const areaThresholdOptions: FilterOption[] = useMemo(
    () => [
      { id: 'any', labelEn: 'Any size', labelRu: 'Любая площадь' },
      { id: '50', labelEn: 'From 50 m²', labelRu: 'От 50 м²' },
      { id: '80', labelEn: 'From 80 m²', labelRu: 'От 80 м²' },
      { id: '120', labelEn: 'From 120 m²', labelRu: 'От 120 м²' },
      { id: '200', labelEn: 'From 200 m²', labelRu: 'От 200 м²' },
    ],
    []
  );

  const instantBookingOptions: FilterOption[] = useMemo(
    () => [{ id: 'yes', labelEn: 'Instant book only', labelRu: 'Только мгновенное бронирование' }],
    []
  );

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
        id: 'guestsAtLeast',
        titleEn: 'Guests',
        titleRu: 'Гости',
        type: 'single',
        options: guestThresholdOptions,
      },
      {
        id: 'areaAtLeast',
        titleEn: 'Area',
        titleRu: 'Площадь',
        type: 'single',
        options: areaThresholdOptions,
      },
      {
        id: 'instantBooking',
        titleEn: 'Booking',
        titleRu: 'Бронирование',
        type: 'single',
        options: instantBookingOptions,
      },
      {
        id: 'viewType',
        titleEn: 'View',
        titleRu: 'Вид',
        type: 'multi',
        options: viewTypeOptions,
      },
      {
        id: 'furnishingLevel',
        titleEn: 'Furnishing',
        titleRu: 'Меблировка',
        type: 'multi',
        options: furnishingOptions,
      },
      {
        id: 'poolType',
        titleEn: 'Pool',
        titleRu: 'Бассейн',
        type: 'multi',
        options: POOL_TYPE_OPTIONS,
      },
      {
        id: 'parkingType',
        titleEn: 'Parking',
        titleRu: 'Парковка',
        type: 'multi',
        options: PARKING_TYPE_OPTIONS,
      },
      {
        id: 'ownershipForm',
        titleEn: 'Ownership',
        titleRu: 'Форма собственности',
        type: 'multi',
        options: OWNERSHIP_OPTIONS,
      },
      {
        id: 'amenities',
        titleEn: 'Amenities',
        titleRu: 'Удобства',
        type: 'multi',
        options: amenities,
      },
      {
        id: 'highlights',
        titleEn: 'Highlights',
        titleRu: 'Особенности',
        type: 'multi',
        options: highlights,
      },
    ],
  }), [
    propertyTypes,
    districts,
    amenities,
    highlights,
    bedroomOptions,
    listingTypeOptions,
    viewTypeOptions,
    furnishingOptions,
    guestThresholdOptions,
    areaThresholdOptions,
    instantBookingOptions,
  ]);

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