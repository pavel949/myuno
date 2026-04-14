/**
 * Centralized Query Configuration
 * 
 * This module provides standardized cache settings for TanStack Query
 * based on data volatility and access patterns.
 */

// Time constants (in milliseconds)
export const TIME = {
  SECONDS: (n: number) => n * 1000,
  MINUTES: (n: number) => n * 60 * 1000,
  HOURS: (n: number) => n * 60 * 60 * 1000,
} as const;

/**
 * Cache Profiles for different data types
 * 
 * - STATIC: Rarely changes (categories, cities, currencies)
 * - SEMI_STATIC: Changes occasionally (weather, recommendations)
 * - DYNAMIC: User-specific, changes frequently (orders, bookings)
 * - REALTIME: Needs fresh data always (notifications, chat)
 * - ADMIN: Admin dashboards with moderate refresh
 */
export const CACHE_PROFILES = {
  // Static reference data - 5 min stale, 30 min gc
  STATIC: {
    staleTime: TIME.MINUTES(5),
    gcTime: TIME.MINUTES(30),
    refetchOnWindowFocus: false,
  },
  
  // Semi-static data - 10 min stale, 30 min gc
  SEMI_STATIC: {
    staleTime: TIME.MINUTES(10),
    gcTime: TIME.MINUTES(30),
    refetchOnWindowFocus: false,
  },
  
  // Dynamic user data - 1 min stale, 5 min gc
  DYNAMIC: {
    staleTime: TIME.MINUTES(1),
    gcTime: TIME.MINUTES(5),
    refetchOnWindowFocus: true,
  },
  
  // Near real-time data - 30 sec stale, 2 min gc
  REALTIME: {
    staleTime: TIME.SECONDS(30),
    gcTime: TIME.MINUTES(2),
    refetchOnWindowFocus: true,
  },
  
  // Admin dashboard - 1 min stale, no window refetch
  ADMIN: {
    staleTime: TIME.MINUTES(1),
    gcTime: TIME.MINUTES(5),
    refetchOnWindowFocus: false,
  },
  
  // Weather-like data - 30 min stale
  WEATHER: {
    staleTime: TIME.MINUTES(30),
    gcTime: TIME.HOURS(1),
    refetchOnWindowFocus: false,
    retry: 2,
  },
} as const;

/**
 * Query key factories for consistent key generation
 */
export const queryKeys = {
  // User related
  user: {
    all: ['user'] as const,
    profile: (userId: string) => ['profile', userId] as const,
    roles: (userId: string) => ['user-roles', userId] as const,
    context: (userId: string) => ['user-active-context', userId] as const,
    wallet: (userId: string) => ['wallet', userId] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => ['notifications', userId] as const,
    preferences: (userId: string) => ['notification-preferences', userId] as const,
  },
  
  // Properties
  properties: {
    all: ['properties'] as const,
    list: (filters?: Record<string, unknown>) => ['properties', filters] as const,
    detail: (id: string) => ['property', id] as const,
    owner: (userId: string) => ['owner-properties', userId] as const,
  },
  
  // Bookings & Orders
  bookings: {
    all: ['bookings'] as const,
    list: (userId: string) => ['bookings', userId] as const,
    detail: (id: string) => ['booking', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (userId: string) => ['orders', userId] as const,
    detail: (id: string) => ['order', id] as const,
  },
  
  // Home page recommendations
  recommendations: {
    all: ['recommendations'] as const,
    user: (userId: string) => ['recommendations', userId] as const,
  },
  
  // Home page coordinated data
  home: {
    all: ['home'] as const,
    featuredTours: ['home', 'featured-tours'] as const,
    featuredProperties: ['home', 'featured-properties'] as const,
    featuredEvents: ['home', 'featured-events'] as const,
    featuredWaterActivities: ['home', 'featured-water-activities'] as const,
  },
  
  // View history for personalization
  viewHistory: {
    all: ['view-history'] as const,
    user: (userId: string) => ['view-history', userId] as const,
  },
  
  // Vehicles
  vehicles: {
    all: ['vehicles'] as const,
    list: (filters?: Record<string, unknown>) => ['vehicles', filters] as const,
    detail: (id: string) => ['vehicle', id] as const,
  },
  
  // Categories & Reference Data
  categories: {
    all: ['categories'] as const,
    groups: ['category-groups'] as const,
    bySlug: (slug: string) => ['category', slug] as const,
  },
  
  // Entities
  restaurants: {
    all: ['restaurants'] as const,
    list: (filters?: Record<string, unknown>) => ['restaurants', filters] as const,
    detail: (id: string) => ['restaurant', id] as const,
  },
  tours: {
    all: ['tours'] as const,
    list: (filters?: Record<string, unknown>) => ['tours', filters] as const,
    detail: (id: string) => ['tour', id] as const,
  },
  salons: {
    all: ['salons'] as const,
    list: (filters?: Record<string, unknown>) => ['salons', filters] as const,
    detail: (id: string) => ['salon', id] as const,
  },
  flowerShops: {
    all: ['flower-shops'] as const,
    list: (filters?: Record<string, unknown>) => ['flower-shops', filters] as const,
    detail: (id: string) => ['flower-shop', id] as const,
  },
  
  // Admin
  admin: {
    stats: ['admin-stats'] as const,
    auditLogs: ['admin-audit-logs'] as const,
    consultations: ['admin-consultations'] as const,
  },
} as const;

/**
 * Popular routes for prefetching
 * These routes are prefetched during idle time
 */
export const PREFETCH_ROUTES = [
  '/property',
  '/restaurants', 
  '/experiences',
  '/beauty',
  '/flowers',
] as const;

/**
 * Default QueryClient options
 */
export const defaultQueryClientOptions = {
  queries: {
    staleTime: TIME.MINUTES(1),
    gcTime: TIME.MINUTES(5),
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 1,
  },
} as const;
