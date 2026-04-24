/**
 * Default fallback values for images, placeholders, and mock data indicators
 */

// Default images — re-exported from centralized placeholders for backward compat
import { PLACEHOLDER_IMAGES } from './placeholders';

export const DEFAULT_IMAGES = {
  // User/Profile
  avatar: '/placeholder.svg',
  userPlaceholder: '/placeholder.svg',
  
  // Re-use centralized placeholders
  property: PLACEHOLDER_IMAGES.property,
  villa: PLACEHOLDER_IMAGES.villa,
  apartment: PLACEHOLDER_IMAGES.apartment,
  service: PLACEHOLDER_IMAGES.service,
  restaurant: PLACEHOLDER_IMAGES.restaurant,
  salon: PLACEHOLDER_IMAGES.salon,
  product: PLACEHOLDER_IMAGES.product,
  tour: PLACEHOLDER_IMAGES.tour,
  yacht: PLACEHOLDER_IMAGES.yacht,
  
  // Placeholder for any content
  placeholder: '/placeholder.svg',
} as const;

// Default pagination settings
export const PAGINATION_DEFAULTS = {
  pageSize: 10,
  maxPageSize: 100,
  initialPage: 1,
} as const;

// Default map settings
export const MAP_DEFAULTS = {
  zoom: 12,
  pitch: 0,
  style: 'streets' as const,
  enableGeolocation: true,
  enableNavigation: true,
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  static: 5 * 60 * 1000,      // 5 minutes - rarely changing data
  dynamic: 30 * 1000,          // 30 seconds - frequently changing data
  realtime: 0,                 // No cache - real-time data
  userContent: 2 * 60 * 1000,  // 2 minutes - user-generated content
} as const;
