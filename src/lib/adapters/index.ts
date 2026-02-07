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
