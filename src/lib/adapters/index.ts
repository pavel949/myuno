// Centralized Content Adapters
export {
  // Product adapters
  mapProductToCardProps,
  mapProductFormToCardProps,
  // Service adapters  
  mapServiceToCardProps,
  mapServiceFormToCardProps,
  // Home service provider adapters
  mapHomeServiceProviderToCardProps,
  // Property adapters
  mapPropertyToCardProps,
  mapPropertyFormToCardProps,
  // Helpers
  canShowPreview,
  getPreviewPlaceholder,
  // Types
  type UnifiedProductCardProps,
  type UnifiedServiceCardProps,
  type HomeServiceProviderCardProps,
  type UnifiedPropertyCardProps,
} from './contentAdapters';

// Vehicle adapters
export {
  mapVehicleToCardProps,
  mapVehicleToBookingContext,
  getVehicleSpecs,
  type VehicleCardProps,
} from './vehicleAdapters';

// Yacht adapters
export {
  mapYachtToCardProps,
  mapYachtToBookingContext,
  type YachtCardProps,
} from './yachtAdapters';

// Project adapter — canonical mapping for property_projects rows
export {
  toProjectUI,
  toProjectUIList,
  type PropertyProjectRow,
  type PropertyProjectUI,
} from './projectAdapter';

// Developer adapter — canonical mapping for developers rows
export { toDeveloperUI, type DeveloperRow, type DeveloperUI } from './developerAdapter';

// Catalog Card adapters (unified grid cards)
export {
  mapYachtToCatalogCard,
  mapExperienceToCatalogCard,
  mapBouquetToCatalogCard,
  mapPetServiceToCatalogCard,
  mapRestaurantToCatalogCard,
  mapSalonToCatalogCard,
  mapGymToCatalogCard,
  mapEducationToCatalogCard,
  mapCleaningToCatalogCard,
  mapEventToCatalogCard,
  mapClinicToCatalogCard,
} from './catalogCardAdapters';
