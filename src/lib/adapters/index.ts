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
  // Helpers
  canShowPreview,
  getPreviewPlaceholder,
  // Types
  type UnifiedProductCardProps,
  type UnifiedServiceCardProps,
  type HomeServiceProviderCardProps,
} from './contentAdapters';

// Vehicle adapters
export {
  mapVehicleToCardProps,
  mapVehicleToBookingContext,
  getVehicleSpecs,
  type VehicleCardProps,
} from './vehicleAdapters';
