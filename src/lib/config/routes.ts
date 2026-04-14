/**
 * Centralized Route Registry
 * Single source of truth for all application routes
 * 
 * P3 — synchronized with AnimatedRoutes.tsx
 */

export const APP_ROUTES = {
  // ── Core ──
  HOME: '/',
  AUTH: '/auth',
  AUTH_ACCOUNT_TYPE: '/auth/account-type',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // ── Discovery & Navigation ──
  DISCOVER: '/discover',
  MAP: '/map',
  SEARCH: '/search',
  
  // ── User ──
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_SETTINGS: '/profile/settings',
  ACCOUNT: '/account',
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
  FAVORITES: '/favorites',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_SETTINGS: '/profile/notifications',
  MESSAGES: '/messages',
  TRIP_DETAIL: (id: string) => `/trip/${id}`,
  VIEW_HISTORY: '/history',
  CART: '/cart',
  WALLET: '/wallet',
  WALLET_HISTORY: '/wallet/history',
  WALLET_CARDS: '/wallet/cards',
  SOS: '/sos',
  VIP_CONCIERGE: '/vip-concierge',
  SUPPORT: '/support',
  SUPPORT_NEW_TICKET: '/support/new-ticket',
  SUPPORT_TICKETS: '/support/tickets',
  SUPPORT_TICKET_DETAIL: (ticketId: string) => `/support/tickets/${ticketId}`,
  ORDER_TRACKING: (id: string) => `/orders/${id}/tracking`,
  BOOKING_ADVANCE_REQUESTED: '/booking/advance-requested',
  INSTALL: '/install',

  // ── LifeOS ──
  LIFE_FLOW: (code: string) => `/life-flow/${code}`,
  TRIP_PLANNER: '/trip-planner',

  // ── List With Us ──
  LIST_WITH_US: '/list-with-us',
  BECOME_PARTNER: '/become-partner',

  // ── Beauty & Spa ──
  BEAUTY: '/beauty',
  BEAUTY_SALON: (id: string) => `/beauty/salon/${id}`,
  BEAUTY_BOOKING: (id: string) => `/beauty/booking/${id}`,
  BEAUTY_SERVICES: '/beauty/services',
  BEAUTY_MAP: '/beauty/map',

  // ── Property Hub ──
  PROPERTY: '/property',
  PROPERTY_DETAIL: (id: string) => `/property/${id}`,
  PROPERTY_INQUIRY: (id: string) => `/property/${id}/inquiry`,
  PROPERTY_MAP: '/property/map',
  PROPERTY_CONSULTATION: '/property/consultation',
  PROPERTY_DEPOSIT_SUCCESS: '/property/deposit-success',
  PROJECT_DETAIL: (id: string) => `/property/project/${id}`,
  COMPLEXES: '/property/projects',
  MANAGEMENT_COMPANY: (slug: string) => `/company/${slug}`,

  // ── Offplan & Developers (under Property Hub) ──
  OFFPLAN: '/property/offplan',
  OFFPLAN_DETAIL: (id: string) => `/property/offplan/${id}`,
  DEVELOPERS: '/property/developers',
  DEVELOPER_DETAIL: (id: string) => `/property/developers/${id}`,

  // ── Newbuilds (Premium New Developments Section) ──
  NEWBUILDS: '/newbuilds',
  NEWBUILDS_PROJECTS: '/newbuilds/projects',
  NEWBUILDS_PROJECT: (slug: string) => `/newbuilds/projects/${slug}`,
  NEWBUILDS_DEVELOPERS: '/newbuilds/developers',
  NEWBUILDS_DEVELOPER: (slug: string) => `/newbuilds/developers/${slug}`,
  NEWBUILDS_MAP: '/newbuilds/map',
  NEWBUILDS_CALCULATOR: '/newbuilds/calculator',
  NEWBUILDS_COMPARE: '/newbuilds/compare',
  NEWBUILDS_AREAS: '/newbuilds/areas',
  NEWBUILDS_AREA: (slug: string) => `/newbuilds/areas/${slug}`,
  NEWBUILDS_DUE_DILIGENCE: '/newbuilds/due-diligence',
  DEVELOPER_PORTAL: '/developer-portal',
  ADMIN_NEWBUILDS: '/admin/newbuilds',

  // ── Investment (under Property Hub) ──
  INVEST: '/property/invest',
  INVEST_DASHBOARD: '/property/invest/dashboard',
  INVEST_RAISE: '/property/invest/raise',
  INVEST_DETAIL: (id: string) => `/property/invest/${id}`,

  // ── STAYS (guest short-term search, Russian UI) ──
  STAYS_SEARCH: '/stays/search',

  // ── Resale / Secondary Market (under Property Hub) ──
  RESALE: '/property/resale',
  RESALE_DETAIL: (id: string) => `/property/resale/${id}`,

  // ── Restaurants ──
  RESTAURANTS: '/restaurants',
  RESTAURANT_DETAIL: (id: string) => `/restaurants/${id}`,
  RESTAURANT_RESERVE: (id: string) => `/restaurants/${id}/reserve`,
  RESTAURANT_DELIVERY: (id: string) => `/restaurants/${id}/delivery`,
  RESTAURANT_EXPERIENCE: (id: string, setId: string) => `/restaurants/${id}/experience/${setId}`,
  RESTAURANT_MAP: '/restaurants/map',

  // ── Transport ──
  TRANSPORT: '/transport',
  VEHICLE_DETAIL: (id: string) => `/transport/vehicle/${id}`,
  TRANSPORT_BOOKING: (id: string) => `/transport/booking/${id}`,
  AIRPORT_TRANSFER: '/transport/airport-transfer',
  TRANSFER_SUCCESS: '/transport/transfer-success',
  FAST_TRACK: '/transport/fast-track',
  TAXI: '/transport/taxi',

  // ── Fitness ──
  FITNESS: '/fitness',
  FITNESS_GYM: (id: string) => `/fitness/gym/${id}`,
  FITNESS_BOOKING: (id: string) => `/fitness/booking/${id}`,

  // ── Medical ──
  MEDICAL: '/medical',
  MEDICAL_CLINIC: (id: string) => `/medical/clinic/${id}`,
  MEDICAL_APPOINTMENT: (id: string) => `/medical/appointment/${id}`,

  // ── Wellness (shared) ──
  WELLNESS_ORDER_SUCCESS: '/wellness/order/success',

  // ── Events ──
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id}`,
  EVENT_BOOKING: (id: string) => `/events/booking/${id}`,
  VENUE_DETAIL: (id: string) => `/venues/${id}`,

  // ── Education ──
  EDUCATION: '/education',
  COURSE_DETAIL: (id: string) => `/education/course/${id}`,
  TUTOR_DETAIL: (id: string) => `/education/tutor/${id}`,
  EDUCATION_BOOKING: (id: string) => `/education/booking/${id}`,

  // ── Flowers ──
  FLOWERS: '/flowers',
  FLOWER_SHOP: (id: string) => `/flowers/shop/${id}`,
  FLOWERS_ORDER: (id: string) => `/flowers/order/${id}`,
  BOUQUET_DETAIL: (id: string) => `/flowers/bouquet/${id}`,
  FLOWERS_SUCCESS: '/flowers/success',

  // ── Home Services ──
  SERVICES: '/services',
  SERVICE_PROVIDER: (id: string) => `/services/provider/${id}`,
  SERVICE_BOOKING: (providerId: string) => `/services/booking/${providerId}`,
  SERVICES_MAP: '/services/map',
  SERVICE_FUNCTION_ORDER: (functionId: string) => `/services/order/${functionId}`,
  SERVICE_ORDER_SUCCESS: '/services/order/success',

  // ── Legal ──
  LEGAL: '/legal',
  LEGAL_PROVIDER: (id: string) => `/legal/provider/${id}`,
  LEGAL_BOOKING: (id: string) => `/legal/booking/${id}`,
  VISA_SERVICE: (id: string) => `/legal/visa/${id}`,
  VISA_IMMIGRATION: '/visa',

  // ── Insurance ──
  INSURANCE: '/insurance',
  INSURANCE_DETAIL: (id: string) => `/insurance/${id}`,
  INSURANCE_QUOTE: (id: string) => `/insurance/${id}/quote`,
  INSURANCE_PLAN: (id: string) => `/insurance/plan/${id}`,
  INSURANCE_TRAVEL: '/insurance/travel',

  // ── Expat Services ──
  BANKING: '/banking',
  VETERINARY: '/veterinary',

  // ── ARRIVE Cluster ──
  ARRIVE_CLUSTER: '/arrive',
  SIM_START: '/sim',
  EXCHANGE: '/exchange',

  // ── Utility Micro-apps ──
  VISA_QUIZ: '/visa/quiz',
  SCHOOL_FINDER: '/school-finder',
  COST_OF_LIVING: '/cost-of-living',

  // ── LEGAL Cluster ──
  LEGAL_CLUSTER: '/stay-legal',
  TAX_NAV: '/tax',
  CONTRACT_ANALYSIS: '/legal/contract-analysis',

  // ── INVEST Cluster ──
  INVEST_CLUSTER: '/invest-hub',

  // ── Experiences (tours + activities) ──
  EXPERIENCES: '/experiences',
  EXPERIENCE_DETAIL: (id: string) => `/experiences/${id}`,
  EXPERIENCE_BOOKING: (id: string) => `/experiences/${id}/book`,

  // ── Pharmacy ──
  PHARMACY: '/pharmacy',
  PHARMACY_DETAIL: (id: string) => `/pharmacy/${id}`,

  // ── Pets ──
  PETS: '/pets',
  PET_SERVICE: (id: string) => `/pets/${id}`,
  PET_BOOKING: (id: string) => `/pets/${id}/booking`,
  PET_TRANSPORT: '/pets/transport',

  // ── Yachts ──
  YACHTS: '/yachts',
  YACHT_DETAIL: (id: string) => `/yachts/${id}`,
  YACHT_BOOKING: (id: string) => `/yachts/${id}/booking`,

  // ── Cleaning ──
  CLEANING: '/cleaning',
  CLEANING_DETAIL: (id: string) => `/cleaning/${id}`,
  CLEANING_BOOKING: (id: string) => `/cleaning/${id}/book`,

  // ── Babysitter ──
  BABYSITTER: '/babysitter',
  BABYSITTER_DETAIL: (id: string) => `/babysitter/${id}`,
  BABYSITTER_BOOKING: (id: string) => `/babysitter/${id}/book`,

  // ── Delivery ──
  DELIVERY: '/delivery',

  // ── Market ──
  MARKET: '/market',
  MARKET_CATEGORIES: '/market/categories',
  MARKET_CATEGORY: (categoryId: string) => `/market/category/${categoryId}`,
  MARKET_PRODUCT: (productId: string) => `/market/product/${productId}`,
  MARKET_VENDOR: (slug: string) => `/market/vendor/${slug}`,
  MARKET_WISHLIST: '/market/wishlist',
  MARKET_STORE: (id: string) => `/market/store/${id}`,
  MARKET_CHECKOUT: '/market/checkout',
  SELL: '/sell',

  // ── Knowledge ──
  KNOWLEDGE: '/knowledge',
  KNOWLEDGE_SECTION: (section: string) => `/knowledge/${section}`,
  KNOWLEDGE_ARTICLE: (section: string, slug: string) => `/knowledge/${section}/${slug}`,

  // ── Landing Pages ──
  LANDING_AIRPORT_TRANSFER: '/transfer',
  LANDING_FLOWER_DELIVERY: '/flower-delivery',
  LANDING_RENTAL: '/rent-phuket',
  LANDING_NEW_DEVELOPMENTS: '/new-developments',
  RELOCATE: '/relocate',
  WEDDING: '/wedding',
  KIDS: '/kids',
  NOMAD_GUIDE: '/nomad-guide',

  // ── Info Pages ──
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  FAQ: '/faq',
  PARTNERS: '/partners',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
  REFUND_POLICY: '/refund-policy',
  CONTACT: '/contact',
  G_TRUST: '/g-trust',
  IP_POLICY: '/ip-policy',
  PARTNER_AGREEMENT: '/partner-agreement',
  DISPUTE_RESOLUTION: '/dispute-resolution',

  // ── Vendor Portal ──
  VENDOR: '/vendor',
  VENDOR_ONBOARDING: '/vendor/onboarding',
  VENDOR_BOOKINGS: '/vendor/bookings',
  VENDOR_SERVICES: '/vendor/services',
  VENDOR_SETTINGS: '/vendor/settings',

  // ── Management Company (MC) Workspace ──
  MC: '/mc',
  MC_PROPERTIES: '/mc/properties',
  MC_PROPERTY_DETAIL: (id: string) => `/mc/properties/${id}`,
  MC_PROPERTY_EDIT: (id: string) => `/mc/properties/${id}/editor`,
  MC_PROPERTY_MANAGE: (id: string) => `/mc/properties/${id}/manage`,
  MC_PROPERTY_SETUP: (id: string) => `/mc/properties/${id}/setup`,
  MC_PROPERTY_GUIDEBOOK: (id: string) => `/mc/properties/${id}/guidebook`,
  MC_PROPERTY_PORTAL: (id: string) => `/mc/properties/${id}/portal-settings`,
  MC_PROPERTY_NEW: '/mc/properties/new',
  MC_COMPLEXES: '/mc/complexes',
  MC_PROJECTS: '/mc/projects',
  MC_PROPERTY_IMPORT: '/mc/properties/import',
  MC_CALENDAR: '/mc/calendar',
  MC_CONTACTS: '/mc/contacts',
  MC_CONTACT_DETAIL: (id: string) => `/mc/contacts/${id}`,
  MC_CONTACTS_IMPORT: '/mc/contacts/import',
  MC_CONTACTS_IMPORT_ODOO: '/mc/contacts/import-odoo',
  MC_CONTACTS_DUPLICATES: '/mc/duplicates',
  MC_SALES: '/mc/sales',
  MC_SALES_NEW: '/mc/sales/new',
  MC_SALES_DEAL: (id: string) => `/mc/sales/${id}`,
  MC_TASKS: '/mc/tasks',
  MC_FINANCE: '/mc/finance',
  MC_FINANCIALS: '/mc/financials',
  MC_STAFF: '/mc/staff',
  MC_REPORTS: '/mc/reports',
  MC_BUDGET: '/mc/budget',
  MC_INVOICES: '/mc/invoices',
  MC_OWNERS: '/mc/owners',
  MC_CRM_DASHBOARD: '/mc/crm-dashboard',
  MC_CHANNELS: '/mc/channels',
  MC_INVENTORY: '/mc/inventory',
  MC_VENDORS: '/mc/vendors',
  MC_MARKETING: '/mc/marketing',
  MC_MESSAGES: '/mc/messages',
  MC_SUBSCRIPTION: '/mc/subscription',
  MC_RATES: '/mc/rates',
  MC_INSURANCE: '/mc/insurance',
  MC_DOCUMENTS: '/mc/documents',
  MC_SEQUENCES: '/mc/sequences',
  MC_QUOTES: '/mc/quotes',
  MC_REVIEWS: '/mc/reviews-management',
  MC_HELP: '/mc/help',
  MC_SETTINGS: '/mc/settings',
  MC_MANAGEMENT_TERMS: '/mc/management-terms',
  MC_VENDOR_ACQUISITION: '/mc/vendor-acquisition',
  MC_SUPPORT_CHAT: '/mc/support-chat',
  MC_BOOKINGS: '/mc/bookings',

  // ── MC Performance & Settings ──
  MC_BOOKINGS_LIST: '/mc/bookings-list',
  MC_PERFORMANCE: '/mc/performance',
  MC_TRENDS: '/mc/trends',
  MC_ACCOUNT_SETTINGS: '/mc/account-settings',
  MC_SUPERHOST: '/mc/superhost',

  // ── Owner Portal (individual owners) ──
  OWNER: '/owner',
  OWNER_LANDING: '/owner',
  OWNER_GUIDE: '/owner/guide',

  // ── Provider Onboarding ──
  PROVIDER_ONBOARDING: '/provider/onboarding',

  // ── Guest ──
  MY_STAY: '/my-stay',
  GUEST_CHECK_IN: (bookingId: string) => `/guest/check-in/${bookingId}`,
  GUEST_GUIDEBOOK: (propertyId: string) => `/guest/guidebook/${propertyId}`,

  // ── Manager ──
  MANAGER: '/manager',
  MANAGER_PROPERTIES: '/manager/properties',

  // ── Team ──
  TEAM: '/team',

  // ── Admin ──
  ADMIN: '/admin',
  ADMIN_CATALOG: '/admin/catalog',
  ADMIN_FINANCE: '/admin/finance',
  ADMIN_OPERATIONS: '/admin/operations',
  ADMIN_PROVIDERS: '/admin/providers',
  ADMIN_PROVIDER_DETAIL: (id: string) => `/admin/providers/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_SERVICES: '/admin/services',
  ADMIN_PROPERTIES: '/admin/properties',
  ADMIN_LEADS: '/admin/leads',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_AI_AGENTS: '/admin/ai-agents',
  ADMIN_INTAKE_CONFIGS: '/admin/intake-configs',
  ADMIN_LEAD_CONFIGS: '/admin/lead-configs',
  ADMIN_CONSULTATIONS: '/admin/consultations',
  ADMIN_CITIES: '/admin/cities',
  ADMIN_TRANSFERS: '/admin/transfers',
  ADMIN_CRM: '/admin/crm',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_MODERATION: '/admin/operations',
  VENDOR_PAYOUTS: '/vendor/payouts',
  TEAM_CONTENT: '/team/content',
} as const;

/**
 * Legacy route redirects
 * Maps old paths to new paths for backward compatibility
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/provider/onboarding': APP_ROUTES.VENDOR_ONBOARDING,
  '/provider/dashboard': APP_ROUTES.VENDOR,
  '/become-provider': APP_ROUTES.BECOME_PARTNER,
  '/tours': `${APP_ROUTES.EXPERIENCES}?type=tour`,
  '/water': `${APP_ROUTES.EXPERIENCES}?type=activity`,
  '/transfers': '/transfer',
  '/life': APP_ROUTES.EXPERIENCES,
  '/info/about': APP_ROUTES.ABOUT,
  '/info/faq': APP_ROUTES.FAQ,
  '/info/contact': APP_ROUTES.CONTACT,
  '/info/partners': '/partners',
  '/info/become-partner': APP_ROUTES.BECOME_PARTNER,
  '/info/g-trust': APP_ROUTES.G_TRUST,
  '/orders': APP_ROUTES.BOOKINGS,
  '/salons': '/beauty',
  '/spa': '/beauty',
  '/categories': '/discover',
  '/food': '/restaurants',
  '/view-history': '/history',
  '/demo': '/',
  // Property Hub legacy redirects
  '/offplan': '/property/offplan',
  '/developers': '/property/developers',
  '/complexes': '/property/projects',
  '/invest': '/property/invest',
  '/invest/dashboard': '/property/invest/dashboard',
  '/invest/raise': '/property/invest/raise',
  '/new-developments': '/newbuilds',
} as const;

/**
 * Route ownership classification
 */
export const ROUTE_OWNERSHIP = {
  PUBLIC: ['/', '/auth', '/discover', '/beauty', '/property', '/restaurants', '/transport',
    '/experiences', '/yachts', '/cleaning', '/babysitter', '/delivery', '/market',
    '/flowers', '/fitness', '/medical', '/events', '/education', '/legal', '/insurance',
    '/pets', '/pharmacy', '/banking', '/veterinary', '/sim', '/exchange', '/knowledge', '/about', '/faq',
    '/contact', '/become-partner', '/g-trust', '/install', '/transfer', '/flower-delivery',
    '/rent-phuket', '/new-developments', '/how-it-works', '/privacy', '/terms', '/cookies',
    '/refund-policy', '/ip-policy', '/partner-agreement', '/dispute-resolution',
    '/vendor/onboarding', '/provider/onboarding', '/owner/landing', '/owner/guide',
    '/list-with-us', '/property/invest', '/property/offplan', '/property/developers', '/property/projects',
    '/arrive', '/stay-legal', '/invest-hub', '/tax', '/legal/contract-analysis', '/visa',
    '/visa/quiz', '/school-finder', '/cost-of-living',
    '/newbuilds', '/relocate', '/wedding', '/kids', '/nomad-guide'],
  AUTH_REQUIRED: ['/profile', '/bookings', '/favorites', '/wallet', '/cart', '/notifications',
    '/messages', '/support', '/account', '/sell', '/my-stay', '/vip-concierge'],
  VENDOR: ['/vendor'],
  MC: ['/mc'],
  OWNER: ['/owner'],
  ADMIN: ['/admin'],
  TEAM: ['/team'],
  MANAGER: ['/manager'],
  GUEST: ['/my-stay', '/guest'],
} as const;

/**
 * Route validation helper
 */
export function isValidRoute(path: string): boolean {
  const staticRoutes = Object.values(APP_ROUTES).filter(r => typeof r === 'string') as string[];
  if (staticRoutes.includes(path)) return true;
  
  const dynamicPatterns = [
    /^\/services\/provider\/[^/]+$/,
    /^\/services\/booking\/[^/]+$/,
    /^\/cleaning\/[^/]+$/,
    /^\/experiences\/[^/]+$/,
    /^\/property\/[^/]+$/,
    /^\/property\/offplan\/[^/]+$/,
    /^\/property\/developers\/[^/]+$/,
    /^\/property\/invest\/[^/]+$/,
    /^\/market\/category\/[^/]+$/,
    /^\/market\/product\/[^/]+$/,
    /^\/yachts\/[^/]+$/,
    /^\/yachts\/[^/]+\/booking$/,
    /^\/beauty\/salon\/[^/]+$/,
    /^\/medical\/clinic\/[^/]+$/,
    /^\/fitness\/gym\/[^/]+$/,
    /^\/restaurants\/[^/]+$/,
    /^\/pets\/[^/]+$/,
    /^\/life-flow\/[^/]+$/,
    /^\/pharmacy\/[^/]+$/,
    /^\/flowers\/[^/]+$/,
    /^\/babysitter\/[^/]+$/,
    /^\/events\/[^/]+$/,
    /^\/education\/[^/]+$/,
    /^\/legal\/[^/]+$/,
    /^\/insurance\/[^/]+$/,
    /^\/knowledge\/[^/]+$/,
    /^\/transport\/vehicle\/[^/]+$/,
    /^\/newbuilds\/projects\/[^/]+$/,
    /^\/newbuilds\/developers\/[^/]+$/,
    /^\/transport\/booking\/[^/]+$/,
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(path));
}

/**
 * Get redirect path for legacy routes
 */
export function getLegacyRedirect(path: string): string | null {
  return LEGACY_REDIRECTS[path] || null;
}

/** Full URL for password reset redirect. Use in resetPasswordForEmail. Allowlist in Supabase: Authentication → URL Configuration → Redirect URLs. */
export function getPasswordResetRedirectUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${APP_ROUTES.AUTH_RESET_PASSWORD}`;
}
