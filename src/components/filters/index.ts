// Export filter UI components
export { UniversalFilter, QuickFilterBar, ActiveFilters } from './UniversalFilter';
export type { FilterConfig, FilterOption, FilterValues, FilterSection, UniversalFilterProps } from './UniversalFilter';

// Nearby/Geolocation filter
export { NearbyFilter, DistanceBadge } from './NearbyFilter';

// All filter configs and options — consolidated in a single registry
export {
  // Dynamic hooks
  usePropertyFilterOptions,
  useTransportFilterOptions,
  useHomeServiceFilterOptions,

  // Restaurant
  restaurantFilterConfig, deliveryFilterConfig, reservationFilterConfig,
  cuisineOptions, featureOptions, occasionOptions, dietaryOptions, deliveryOptions, sortOptions,

  // Beauty
  beautyFilterConfig, beautyServiceOptions, beautyFeatureOptions, beautyAvailabilityOptions,

  // Yacht
  yachtFilterConfig, yachtTypeOptions, yachtCapacityOptions, yachtDurationOptions, yachtAmenityOptions, yachtDestinationOptions,

  // Flowers
  flowerFilterConfig, flowerOccasionOptions, flowerTypeOptions, flowerColorOptions, flowerFeatureOptions, flowerDeliveryOptions,

  // Tours
  tourFilterConfig, tourTypeOptions, tourDurationOptions, tourGroupOptions, tourFeatureOptions, tourDifficultyOptions,

  // Experiences
  experienceFilterConfig, experienceTypeOptions, experienceCategoryOptions, experienceDurationOptions,
  experienceDifficultyOptions, experienceFeatureOptions, experienceGroupOptions,

  // Events
  eventsFilterConfig, eventCategoryOptions, eventFeatureOptions, eventDateOptions, eventAgePolicyOptions,

  // Fitness
  fitnessFilterConfig, fitnessTypeOptions, fitnessAmenityOptions, membershipOptions, scheduleOptions,

  // Water
  waterFilterConfig, waterActivityTypeOptions, waterDifficultyOptions, waterDurationOptions, waterFeatureOptions,

  // Medical
  medicalFilterConfig, medicalSpecialtyOptions, clinicFeatureOptions, clinicTypeOptions, medicalAvailabilityOptions,

  // Market
  marketFilterConfig, storeCategoryOptions, marketDeliveryOptions, storeFeatureOptions,

  // Cleaning
  cleaningFilterConfig, cleaningTypeOptions, cleaningFeatureOptions, cleaningFrequencyOptions,

  // Legal
  legalFilterConfig, legalCategoryOptions, legalLanguageOptions, legalFeatureOptions,

  // Pets
  petsFilterConfig, petServiceTypeOptions, petServiceFeatureOptions, petTypeOptions,

  // Pharmacy
  pharmacyFilterConfig, pharmacyCategoryOptions, pharmacyFeatureOptions, pharmacyDistanceOptions,

  // Education
  educationFilterConfig, educationCategoryOptions, educationAgeOptions, educationTypeOptions, educationFeatureOptions,

  // Babysitter
  babysitterFilterConfig, babysitterAgeGroupOptions, babysitterLanguageOptions, babysitterCertOptions, babysitterFeatureOptions,

  // Services (static options only — use useHomeServiceFilterOptions hook for full config)
  serviceFeatureOptions, bookingTypeOptions,

  // Transport (static options only — use useTransportFilterOptions hook for full config)
  transferTypeOptions, vehicleFeatureOptions, passengerOptions,
} from '@/lib/filterRegistry';
