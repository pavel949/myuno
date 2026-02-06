/**
 * Dynamic Filter Options Hook
 * Replaces hardcoded filterConfigs with database-driven options
 * Uses useTaxonomy() as the single source of truth
 */

import { useMemo } from 'react';
import { useTaxonomy, useTaxonomyHierarchy, TaxonomyOption } from './useTaxonomy';
import { FilterOption, FilterConfig } from '@/components/filters/UniversalFilter';

// ============= TRANSFORM HELPERS =============

function toFilterOption(opt: TaxonomyOption): FilterOption {
  return {
    id: opt.value,
    labelEn: opt.labelEn,
    labelRu: opt.labelRu,
    icon: opt.icon,
  };
}

function toFilterOptions(options: TaxonomyOption[]): FilterOption[] {
  return options.map(toFilterOption);
}

// ============= PROPERTY FILTERS =============

export function usePropertyFilterOptions() {
  const { options: propertyTypes, isLoading: loadingTypes } = useTaxonomy('property_type');
  const { options: districts, isLoading: loadingDistricts } = useTaxonomy('district');
  const { options: amenities, isLoading: loadingAmenities } = useTaxonomy('amenity');
  const { options: bedrooms, isLoading: loadingBedrooms } = useTaxonomy('bedroom_option');
  const { options: listingTypes, isLoading: loadingListingTypes } = useTaxonomy('listing_type');

  const isLoading = loadingTypes || loadingDistricts || loadingAmenities || loadingBedrooms || loadingListingTypes;

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
        options: toFilterOptions(listingTypes),
      },
      {
        id: 'propertyType',
        titleEn: 'Property Type',
        titleRu: 'Тип недвижимости',
        type: 'multi',
        options: toFilterOptions(propertyTypes),
      },
      {
        id: 'bedrooms',
        titleEn: 'Bedrooms',
        titleRu: 'Спальни',
        type: 'multi',
        options: toFilterOptions(bedrooms),
      },
      {
        id: 'district',
        titleEn: 'District',
        titleRu: 'Район',
        type: 'multi',
        options: toFilterOptions(districts),
      },
      {
        id: 'amenities',
        titleEn: 'Amenities',
        titleRu: 'Удобства',
        type: 'multi',
        options: toFilterOptions(amenities),
      },
    ],
  }), [propertyTypes, districts, amenities, bedrooms, listingTypes]);

  return {
    filterConfig,
    propertyTypes: toFilterOptions(propertyTypes),
    districts: toFilterOptions(districts),
    amenities: toFilterOptions(amenities),
    bedroomOptions: toFilterOptions(bedrooms),
    listingTypeOptions: toFilterOptions(listingTypes),
    isLoading,
  };
}

// ============= TRANSPORT FILTERS =============

export function useTransportFilterOptions() {
  const { options: vehicleTypes, isLoading: loadingTypes } = useTaxonomy('vehicle_type');
  const { options: transmissions, isLoading: loadingTransmission } = useTaxonomy('transmission_type');
  const { options: fuelTypes, isLoading: loadingFuel } = useTaxonomy('fuel_type');
  const { options: features, isLoading: loadingFeatures } = useTaxonomy('vehicle_feature');

  const isLoading = loadingTypes || loadingTransmission || loadingFuel || loadingFeatures;

  // Static options that don't need DB
  const passengerOptions: FilterOption[] = [
    { id: '1-2', labelEn: '1-2 Passengers', labelRu: '1-2 пассажира', icon: '👤' },
    { id: '3-4', labelEn: '3-4 Passengers', labelRu: '3-4 пассажира', icon: '👥' },
    { id: '5-7', labelEn: '5-7 Passengers', labelRu: '5-7 пассажиров', icon: '👨‍👩‍👧' },
    { id: '8+', labelEn: '8+ Passengers', labelRu: '8+ пассажиров', icon: '👨‍👩‍👧‍👦' },
  ];

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
        id: 'vehicleType',
        titleEn: 'Vehicle Type',
        titleRu: 'Тип транспорта',
        type: 'multi',
        options: toFilterOptions(vehicleTypes),
      },
      {
        id: 'transmission',
        titleEn: 'Transmission',
        titleRu: 'Трансмиссия',
        type: 'single',
        options: toFilterOptions(transmissions),
      },
      {
        id: 'fuelType',
        titleEn: 'Fuel Type',
        titleRu: 'Тип топлива',
        type: 'multi',
        options: toFilterOptions(fuelTypes),
      },
      {
        id: 'passengers',
        titleEn: 'Passengers',
        titleRu: 'Пассажиры',
        type: 'single',
        options: passengerOptions,
      },
      {
        id: 'features',
        titleEn: 'Features',
        titleRu: 'Особенности',
        type: 'multi',
        options: toFilterOptions(features),
      },
    ],
  }), [vehicleTypes, transmissions, fuelTypes, features]);

  // Category ribbon for transport
  const categoryRibbon = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
    ...toFilterOptions(vehicleTypes),
  ], [vehicleTypes]);

  return {
    filterConfig,
    vehicleTypes: toFilterOptions(vehicleTypes),
    transmissions: toFilterOptions(transmissions),
    fuelTypes: toFilterOptions(fuelTypes),
    features: toFilterOptions(features),
    passengerOptions,
    categoryRibbon,
    isLoading,
  };
}

// ============= HOME SERVICES FILTERS =============

export function useHomeServiceFilterOptions() {
  const { hierarchy: domains, isLoading: loadingDomains } = useTaxonomyHierarchy('home_service_domain');
  const { options: providerTypes, isLoading: loadingProviderTypes } = useTaxonomy('provider_type');

  const isLoading = loadingDomains || loadingProviderTypes;

  // Flatten all categories from domains
  const allCategories = useMemo(() => {
    return domains.flatMap(d => d.children);
  }, [domains]);

  // Static service features
  const serviceFeatures: FilterOption[] = [
    { id: 'verified', labelEn: 'Verified', labelRu: 'Проверенные', icon: '✅' },
    { id: 'insured', labelEn: 'Insured', labelRu: 'Застрахованы', icon: '🛡️' },
    { id: 'guaranteed', labelEn: 'Guaranteed', labelRu: 'Гарантия работ', icon: '💯' },
    { id: 'fast-response', labelEn: 'Fast Response', labelRu: 'Быстрый отклик', icon: '⚡' },
    { id: 'english', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
    { id: 'russian', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
  ];

  const filterConfig: FilterConfig = useMemo(() => ({
    sections: [
      {
        id: 'providerType',
        titleEn: 'Provider Type',
        titleRu: 'Тип исполнителя',
        type: 'single',
        options: toFilterOptions(providerTypes.filter(p => p.value !== 'all')),
      },
      {
        id: 'priceLevel',
        titleEn: 'Price Level',
        titleRu: 'Уровень цен',
        type: 'price-level',
        options: [],
      },
      {
        id: 'category',
        titleEn: 'Service Type',
        titleRu: 'Тип услуги',
        type: 'multi',
        options: toFilterOptions(allCategories),
      },
      {
        id: 'features',
        titleEn: 'Features',
        titleRu: 'Особенности',
        type: 'multi',
        options: serviceFeatures,
      },
    ],
  }), [allCategories, providerTypes]);

  // Domain tabs for navigation
  const domainTabs = useMemo(() => 
    domains.map(d => toFilterOption(d.parent)),
  [domains]);

  return {
    filterConfig,
    domains: domainTabs,
    categories: toFilterOptions(allCategories),
    providerTypes: toFilterOptions(providerTypes),
    isLoading,
  };
}

// ============= YACHT FILTERS =============

export function useYachtFilterOptions() {
  const { options: yachtTypes, isLoading: loadingTypes } = useTaxonomy('yacht_type');
  const { options: experiences, isLoading: loadingExp } = useTaxonomy('yacht_experience');
  const { options: amenities, isLoading: loadingAmenities } = useTaxonomy('yacht_amenity');

  const isLoading = loadingTypes || loadingExp || loadingAmenities;

  // Static capacity options
  const capacityOptions: FilterOption[] = [
    { id: '2-6', labelEn: '2-6 guests', labelRu: '2-6 гостей', icon: '👥' },
    { id: '7-12', labelEn: '7-12 guests', labelRu: '7-12 гостей', icon: '👨‍👩‍👧‍👦' },
    { id: '13-20', labelEn: '13-20 guests', labelRu: '13-20 гостей', icon: '👨‍👩‍👧‍👦' },
    { id: '20+', labelEn: '20+ guests', labelRu: '20+ гостей', icon: '🎊' },
  ];

  // Duration options
  const durationOptions: FilterOption[] = [
    { id: 'half-day', labelEn: 'Half Day', labelRu: 'Полдня', icon: '⏱️' },
    { id: 'full-day', labelEn: 'Full Day', labelRu: 'Весь день', icon: '☀️' },
    { id: 'overnight', labelEn: 'Overnight', labelRu: 'С ночёвкой', icon: '🌙' },
  ];

  // Category ribbon
  const categoryRibbon = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
    ...toFilterOptions(yachtTypes),
  ], [yachtTypes]);

  return {
    yachtTypes: toFilterOptions(yachtTypes),
    experiences: toFilterOptions(experiences),
    amenities: toFilterOptions(amenities),
    capacityOptions,
    durationOptions,
    categoryRibbon,
    isLoading,
  };
}

// ============= RESTAURANT FILTERS =============

export function useRestaurantFilterOptions() {
  const { options: cuisines, isLoading: loadingCuisines } = useTaxonomy('cuisine');
  const { options: dietaryOptions, isLoading: loadingDietary } = useTaxonomy('dietary_option');
  const { options: restaurantFeatures, isLoading: loadingFeatures } = useTaxonomy('restaurant_feature');

  const isLoading = loadingCuisines || loadingDietary || loadingFeatures;

  // Category ribbon
  const categoryRibbon = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
    ...toFilterOptions(cuisines),
  ], [cuisines]);

  return {
    cuisines: toFilterOptions(cuisines),
    dietaryOptions: toFilterOptions(dietaryOptions),
    restaurantFeatures: toFilterOptions(restaurantFeatures),
    categoryRibbon,
    isLoading,
  };
}

// ============= FLOWER FILTERS =============

export function useFlowerFilterOptions() {
  const { options: categories, isLoading: loadingCategories } = useTaxonomy('flower_category');
  const { options: occasions, isLoading: loadingOccasions } = useTaxonomy('flower_occasion');
  const { options: colors, isLoading: loadingColors } = useTaxonomy('flower_color');

  const isLoading = loadingCategories || loadingOccasions || loadingColors;

  // Size options (static - not taxonomy)
  const sizeOptions: FilterOption[] = [
    { id: 'small', labelEn: 'Small', labelRu: 'Маленький', icon: '🌱' },
    { id: 'medium', labelEn: 'Medium', labelRu: 'Средний', icon: '🌿' },
    { id: 'large', labelEn: 'Large', labelRu: 'Большой', icon: '🌳' },
    { id: 'xl', labelEn: 'Extra Large', labelRu: 'Очень большой', icon: '🌴' },
  ];

  // Delivery options (static)
  const deliveryOptions: FilterOption[] = [
    { id: 'express-2h', labelEn: 'Express 2h', labelRu: 'Экспресс 2ч', icon: '⚡' },
    { id: 'same-day', labelEn: 'Same Day', labelRu: 'В тот же день', icon: '📅' },
    { id: 'scheduled', labelEn: 'Scheduled', labelRu: 'По расписанию', icon: '🗓️' },
    { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🆓' },
  ];

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
        id: 'occasion',
        titleEn: 'Occasion',
        titleRu: 'Повод',
        type: 'multi',
        options: toFilterOptions(occasions),
      },
      {
        id: 'flowerType',
        titleEn: 'Flower Type',
        titleRu: 'Тип цветов',
        type: 'multi',
        options: toFilterOptions(categories),
      },
      {
        id: 'color',
        titleEn: 'Color',
        titleRu: 'Цвет',
        type: 'multi',
        options: toFilterOptions(colors),
      },
      {
        id: 'size',
        titleEn: 'Size',
        titleRu: 'Размер',
        type: 'single',
        options: sizeOptions,
      },
      {
        id: 'delivery',
        titleEn: 'Delivery',
        titleRu: 'Доставка',
        type: 'multi',
        options: deliveryOptions,
      },
    ],
  }), [categories, occasions, colors]);

  // Category ribbon for flowers
  const categoryRibbon = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
    ...toFilterOptions(categories),
  ], [categories]);

  return {
    filterConfig,
    categories: toFilterOptions(categories),
    occasions: toFilterOptions(occasions),
    colors: toFilterOptions(colors),
    sizeOptions,
    deliveryOptions,
    categoryRibbon,
    isLoading,
  };
}
