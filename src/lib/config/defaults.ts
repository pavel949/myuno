/**
 * Default fallback values for images, placeholders, and mock data indicators
 */

// Default images for different entity types
export const DEFAULT_IMAGES = {
  // User/Profile
  avatar: '/placeholder.svg',
  userPlaceholder: '/placeholder.svg',
  
  // Properties
  property: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  villa: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  apartment: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  
  // Services
  service: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
  
  // Products
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  
  // Experiences
  tour: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
  yacht: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  
  // Placeholder for any content
  placeholder: '/placeholder.svg',
} as const;

// Flag to indicate mock/demo data (for development)
export const IS_DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';

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
