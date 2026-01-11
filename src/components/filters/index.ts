// Export all filter components
export { UniversalFilter, QuickFilterBar, ActiveFilters } from './UniversalFilter';
export type { FilterConfig, FilterOption, FilterValues, FilterSection, UniversalFilterProps } from './UniversalFilter';

// Restaurant filters
export { 
  restaurantFilterConfig, 
  deliveryFilterConfig, 
  reservationFilterConfig,
  cuisineOptions,
  featureOptions,
  occasionOptions,
  dietaryOptions,
  deliveryOptions,
  sortOptions,
} from './RestaurantFilters';

// Flower filters
export {
  flowerFilterConfig,
  flowerOccasionOptions,
  flowerTypeOptions,
  flowerColorOptions,
  flowerFeatureOptions,
  flowerDeliveryOptions,
} from './FlowersFilters';

// Tour filters
export {
  tourFilterConfig,
  tourTypeOptions,
  tourDurationOptions,
  tourGroupOptions,
  tourFeatureOptions,
  tourDifficultyOptions,
} from './ToursFilters';

// Beauty & Spa filters
export {
  beautyFilterConfig,
  beautyServiceOptions,
  beautyFeatureOptions,
  beautyAvailabilityOptions,
} from './BeautyFilters';

// Property filters
export {
  propertyFilterConfig,
  propertyTypeOptions,
  bedroomOptions,
  propertyAmenityOptions,
  phuketDistrictOptions,
  listingTypeOptions,
} from './PropertyFilters';

// Transport filters
export {
  transportFilterConfig,
  vehicleTypeOptions,
  transferTypeOptions,
  vehicleFeatureOptions,
  passengerOptions,
} from './TransportFilters';

// Yacht filters
export {
  yachtFilterConfig,
  yachtTypeOptions,
  yachtCapacityOptions,
  yachtDurationOptions,
  yachtAmenityOptions,
  yachtDestinationOptions,
} from './YachtsFilters';

// Medical filters
export {
  medicalFilterConfig,
  medicalSpecialtyOptions,
  clinicFeatureOptions,
  clinicTypeOptions,
  medicalAvailabilityOptions,
} from './MedicalFilters';

// Fitness filters
export {
  fitnessFilterConfig,
  fitnessTypeOptions,
  fitnessAmenityOptions,
  membershipOptions,
  scheduleOptions,
} from './FitnessFilters';

// Events filters
export {
  eventsFilterConfig,
  eventCategoryOptions,
  eventFeatureOptions,
  eventDateOptions,
  eventTimeOptions,
} from './EventsFilters';

// Services filters
export {
  servicesFilterConfig,
  serviceCategoryOptions,
  serviceFeatureOptions,
  bookingTypeOptions,
} from './ServicesFilters';

// Market filters
export {
  marketFilterConfig,
  storeCategoryOptions,
  marketDeliveryOptions,
  storeFeatureOptions,
} from './MarketFilters';
