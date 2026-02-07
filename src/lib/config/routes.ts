/**
 * Centralized Route Registry
 * Single source of truth for all application routes
 */

export const APP_ROUTES = {
  // Home
  HOME: '/',
  
  // Auth
  AUTH: '/auth',
  
  // Services Hub
  SERVICES: '/services',
  DISCOVER: '/discover',
  SERVICE_PROVIDER: (id: string) => `/services/provider/${id}`,
  SERVICE_BOOKING: (providerId: string) => `/services/booking/${providerId}`,
  
  // Cleaning
  CLEANING: '/cleaning',
  CLEANING_DETAIL: (id: string) => `/cleaning/${id}`,
  
  // Experiences (unified hub for tours + water activities)
  EXPERIENCES: '/experiences',
  EXPERIENCE_DETAIL: (id: string) => `/experiences/${id}`,
  
  // Transport
  TRANSPORT: '/transport',
  
  // Delivery
  DELIVERY: '/delivery',
  
  // Property
  PROPERTY: '/property',
  PROPERTY_DETAIL: (id: string) => `/property/${id}`,
  COMPLEXES: '/complexes',
  
  // Marketplace
  MARKET: '/market',
  MARKET_CATEGORY: (slug: string) => `/market/category/${slug}`,
  MARKET_PRODUCT: (id: string) => `/market/product/${id}`,
  
  // Vendor/Provider Portal
  VENDOR: '/vendor',
  VENDOR_ONBOARDING: '/vendor/onboarding',
  VENDOR_DASHBOARD: '/vendor',
  VENDOR_BOOKINGS: '/vendor/bookings',
  VENDOR_SETTINGS: '/vendor/settings',
  
  // Owner Portal
  OWNER: '/owner',
  OWNER_ONBOARDING: '/owner/onboarding',
  
  // Partner/Become Provider
  BECOME_PARTNER: '/become-partner',
  PARTNERS: '/info/partners',
  
  // Trust & Verification
  G_TRUST: '/g-trust',
  
  // Info Pages
  ABOUT: '/about',
  FAQ: '/faq',
  CONTACT: '/contact',
  
  // User
  PROFILE: '/profile',
  BOOKINGS: '/bookings',
  FAVORITES: '/favorites',
  WALLET: '/wallet',
  
  // Yachts
  YACHTS: '/yachts',
  YACHT_DETAIL: (id: string) => `/yachts/${id}`,
  YACHT_BOOKING: (id: string) => `/yachts/${id}/booking`,

  // Cart
  CART: '/cart',
} as const;

/**
 * Legacy route redirects
 * Maps old paths to new paths for backward compatibility
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  // Provider → Vendor migration
  '/provider/onboarding': APP_ROUTES.VENDOR_ONBOARDING,
  '/provider/dashboard': APP_ROUTES.VENDOR_DASHBOARD,
  '/become-provider': APP_ROUTES.BECOME_PARTNER,
  
  // Tours/Water → Experiences
  '/tours': `${APP_ROUTES.EXPERIENCES}?type=tour`,
  '/water': `${APP_ROUTES.EXPERIENCES}?type=activity`,
  
  // Transfers → Transfer landing
  '/transfers': '/transfer',
  
  // Life → Experiences (contextual discovery)
  '/life': APP_ROUTES.EXPERIENCES,
  
  // Legacy /info/* → root-level info pages
  '/info/about': APP_ROUTES.ABOUT,
  '/info/faq': APP_ROUTES.FAQ,
  '/info/contact': APP_ROUTES.CONTACT,
  '/info/partners': '/partners',
  '/info/become-partner': APP_ROUTES.BECOME_PARTNER,
  '/info/g-trust': APP_ROUTES.G_TRUST,
  
  // Legacy /orders → /bookings
  '/orders': APP_ROUTES.BOOKINGS,
} as const;

/**
 * Route validation helper for development mode
 */
export function isValidRoute(path: string): boolean {
  const staticRoutes = Object.values(APP_ROUTES).filter(r => typeof r === 'string') as string[];
  
  // Check static routes
  if (staticRoutes.includes(path)) return true;
  
  // Check dynamic route patterns
  const dynamicPatterns = [
    /^\/services\/provider\/[^/]+$/,
    /^\/services\/booking\/[^/]+$/,
    /^\/cleaning\/[^/]+$/,
    /^\/experiences\/[^/]+$/,
    /^\/property\/[^/]+$/,
    /^\/market\/category\/[^/]+$/,
    /^\/market\/product\/[^/]+$/,
    /^\/yachts\/[^/]+$/,
    /^\/yachts\/[^/]+\/booking$/,
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(path));
}

/**
 * Get redirect path for legacy routes
 */
export function getLegacyRedirect(path: string): string | null {
  return LEGACY_REDIRECTS[path] || null;
}
