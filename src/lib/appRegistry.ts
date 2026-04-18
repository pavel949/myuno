/**
 * @module AppRegistry
 * @description Unified registry of all myUNO micro-apps / service entry points.
 *
 * This is the SINGLE canonical inventory. Other layers (VERTICAL_GROUPS,
 * Navigator CLUSTERS, quickActionsCatalog, AllAppsDrawer) derive their data
 * from here instead of maintaining independent lists.
 *
 * Convention:
 *   - `id` is unique across the entire registry.
 *   - `verticalId` links to VERTICALS[x].id when the service maps to a DB vertical.
 *   - `groupId` maps to VERTICAL_GROUPS (Discover "All Services").
 *   - `clusterIds` maps to Navigator journey clusters.
 *   - `status` controls visibility: 'active' is live, 'soon' is greyed-out.
 */

import { APP_ROUTES } from '@/lib/config/routes';

export type AppGroupId =
  // Journey-based groups (current canonical)
  | 'arrive'
  | 'live'
  | 'enjoy'
  | 'health'
  | 'settle'
  | 'invest'
  | 'maintain'
  | 'help'
  // Legacy / internal groups (kept for backward compat)
  | 'home'
  | 'transport'
  | 'leisure'
  | 'wellness'
  | 'admin_docs'
  | 'maintenance'
  | 'manage'
  | 'build'
  | 'lifestyle'
  | 'b2b'
  | 'internal';

export type NavigatorClusterId =
  | 'arrive'
  | 'live'
  | 'legal'
  | 'invest'
  | 'manage'
  | 'build'
  | 'enjoy'
  | 'family';

export type AppStatus = 'active' | 'soon' | 'pro';

export interface AppEntry {
  id: string;
  route: string;
  verticalId?: string;
  groupId: AppGroupId;
  clusterIds: NavigatorClusterId[];
  labelEn: string;
  labelRu: string;
  icon: string;
  status: AppStatus;
  /** User personas that should see this in quick actions (empty = none) */
  personaTags: string[];
  bookable: boolean;
}

export const APP_REGISTRY: Record<string, AppEntry> = {
  // ──────── Home & Living ────────
  property: {
    id: 'property',
    route: APP_ROUTES.PROPERTY,
    verticalId: 'property',
    groupId: 'home',
    clusterIds: ['invest'],
    labelEn: 'Real Estate',
    labelRu: 'Недвижимость',
    icon: '🏠',
    status: 'active',
    personaTags: ['tourist', 'resident', 'relocation', 'family', 'couple', 'nomad', 'business'],
    bookable: true,
  },
  cleaning: {
    id: 'cleaning',
    route: APP_ROUTES.CLEANING,
    verticalId: 'cleaning',
    groupId: 'home',
    clusterIds: ['live'],
    labelEn: 'Home Cleaning',
    labelRu: 'Клининг',
    icon: '🧹',
    status: 'active',
    personaTags: ['property_owner'],
    bookable: true,
  },
  babysitter: {
    id: 'babysitter',
    route: APP_ROUTES.BABYSITTER,
    verticalId: 'babysitter',
    groupId: 'home',
    clusterIds: ['family'],
    labelEn: 'Childcare',
    labelRu: 'Присмотр за детьми',
    icon: '👶',
    status: 'active',
    personaTags: ['family'],
    bookable: true,
  },
  pets: {
    id: 'pets',
    route: APP_ROUTES.PETS,
    verticalId: 'pet_service',
    groupId: 'home',
    clusterIds: ['family'],
    labelEn: 'Pet Care',
    labelRu: 'Уход за питомцами',
    icon: '🐾',
    status: 'active',
    personaTags: ['pet_owner'],
    bookable: true,
  },
  flowers: {
    id: 'flowers',
    route: APP_ROUTES.FLOWERS,
    verticalId: 'flower',
    groupId: 'home',
    clusterIds: ['live'],
    labelEn: 'Flower Delivery',
    labelRu: 'Доставка цветов',
    icon: '💐',
    status: 'active',
    personaTags: ['tourist', 'couple'],
    bookable: true,
  },

  // ──────── Transport ────────
  transfer: {
    id: 'transfer',
    route: APP_ROUTES.AIRPORT_TRANSFER,
    verticalId: 'transfer',
    groupId: 'transport',
    clusterIds: ['arrive'],
    labelEn: 'Airport & City Transfers',
    labelRu: 'Трансферы',
    icon: '🚕',
    status: 'active',
    personaTags: ['tourist'],
    bookable: true,
  },
  vehicle: {
    id: 'vehicle',
    route: APP_ROUTES.TRANSPORT,
    verticalId: 'vehicle',
    groupId: 'transport',
    clusterIds: ['arrive'],
    labelEn: 'Car & Bike Rental',
    labelRu: 'Аренда авто и мото',
    icon: '🚗',
    status: 'active',
    personaTags: ['tourist', 'nightlife', 'active'],
    bookable: true,
  },
  'fast-track': {
    id: 'fast-track',
    route: APP_ROUTES.FAST_TRACK,
    groupId: 'transport',
    clusterIds: ['arrive'],
    labelEn: 'Fast Track',
    labelRu: 'Фаст-трек',
    icon: '✈️',
    status: 'active',
    personaTags: ['tourist'],
    bookable: true,
  },

  // ──────── Leisure & Activities ────────
  restaurant: {
    id: 'restaurant',
    route: APP_ROUTES.RESTAURANTS,
    verticalId: 'restaurant',
    groupId: 'leisure',
    clusterIds: ['live', 'enjoy'],
    labelEn: 'Restaurants',
    labelRu: 'Рестораны',
    icon: '🍽️',
    status: 'active',
    personaTags: ['tourist', 'family', 'couple', 'nightlife', 'nomad'],
    bookable: true,
  },
  experience: {
    id: 'experience',
    route: APP_ROUTES.EXPERIENCES,
    verticalId: 'experience',
    groupId: 'leisure',
    clusterIds: ['enjoy'],
    labelEn: 'Experiences',
    labelRu: 'Впечатления',
    icon: '✨',
    status: 'active',
    personaTags: ['tourist', 'family', 'couple', 'nightlife', 'active'],
    bookable: true,
  },
  yacht: {
    id: 'yacht',
    route: APP_ROUTES.YACHTS,
    verticalId: 'yacht',
    groupId: 'leisure',
    clusterIds: ['enjoy'],
    labelEn: 'Yacht Charter',
    labelRu: 'Яхт-чартер',
    icon: '🚤',
    status: 'active',
    personaTags: ['tourist', 'couple', 'nightlife'],
    bookable: true,
  },
  'water-activity': {
    id: 'water-activity',
    route: `${APP_ROUTES.EXPERIENCES}?type=activity`,
    verticalId: 'water_activity',
    groupId: 'leisure',
    clusterIds: ['enjoy'],
    labelEn: 'Water Sports',
    labelRu: 'Водный спорт',
    icon: '🏄',
    status: 'active',
    personaTags: ['active'],
    bookable: true,
  },
  event: {
    id: 'event',
    route: APP_ROUTES.EVENTS,
    verticalId: 'event',
    groupId: 'leisure',
    clusterIds: ['enjoy'],
    labelEn: 'Events',
    labelRu: 'События',
    icon: '🎉',
    status: 'active',
    personaTags: ['tourist', 'active', 'couple', 'nightlife'],
    bookable: true,
  },
  fitness: {
    id: 'fitness',
    route: APP_ROUTES.FITNESS,
    verticalId: 'fitness',
    groupId: 'leisure',
    clusterIds: ['enjoy'],
    labelEn: 'Fitness & Gyms',
    labelRu: 'Фитнес и залы',
    icon: '🏋️',
    status: 'active',
    personaTags: ['active', 'nomad'],
    bookable: true,
  },

  // ──────── Health & Wellness ────────
  beauty: {
    id: 'beauty',
    route: APP_ROUTES.BEAUTY,
    verticalId: 'beauty',
    groupId: 'wellness',
    clusterIds: ['live'],
    labelEn: 'Beauty & Wellness',
    labelRu: 'Красота и велнес',
    icon: '💇',
    status: 'active',
    personaTags: ['couple', 'nightlife'],
    bookable: true,
  },
  medical: {
    id: 'medical',
    route: APP_ROUTES.MEDICAL,
    verticalId: 'medical',
    groupId: 'wellness',
    clusterIds: ['live'],
    labelEn: 'Medical',
    labelRu: 'Медицина',
    icon: '🏥',
    status: 'active',
    personaTags: ['resident', 'relocation', 'family', 'active'],
    bookable: true,
  },
  pharmacy: {
    id: 'pharmacy',
    route: APP_ROUTES.PHARMACY,
    verticalId: 'pharmacy',
    groupId: 'wellness',
    clusterIds: ['live'],
    labelEn: 'Pharmacy',
    labelRu: 'Аптеки',
    icon: '💊',
    status: 'active',
    personaTags: ['resident', 'family'],
    bookable: false,
  },
  veterinary: {
    id: 'veterinary',
    route: APP_ROUTES.VETERINARY,
    groupId: 'wellness',
    clusterIds: ['family'],
    labelEn: 'Veterinary',
    labelRu: 'Ветеринары',
    icon: '🐕‍🦺',
    status: 'active',
    personaTags: ['pet_owner'],
    bookable: false,
  },
  insurance: {
    id: 'insurance',
    route: APP_ROUTES.INSURANCE,
    verticalId: 'insurance',
    groupId: 'wellness',
    clusterIds: ['legal'],
    labelEn: 'Insurance',
    labelRu: 'Страхование',
    icon: '🛡️',
    status: 'active',
    personaTags: ['resident', 'relocation', 'investor', 'family', 'business', 'pet_owner'],
    bookable: false,
  },

  // ──────── Documents & Finance ────────
  legal: {
    id: 'legal',
    route: APP_ROUTES.LEGAL,
    verticalId: 'legal',
    groupId: 'admin_docs',
    clusterIds: ['legal'],
    labelEn: 'Legal Services',
    labelRu: 'Юридические услуги',
    icon: '⚖️',
    status: 'active',
    personaTags: ['resident', 'relocation', 'investor', 'business'],
    bookable: true,
  },
  education: {
    id: 'education',
    route: APP_ROUTES.EDUCATION,
    verticalId: 'education',
    groupId: 'admin_docs',
    clusterIds: ['family'],
    labelEn: 'Education & Courses',
    labelRu: 'Образование',
    icon: '📚',
    status: 'active',
    personaTags: ['resident', 'relocation', 'family'],
    bookable: true,
  },
  banking: {
    id: 'banking',
    route: APP_ROUTES.BANKING,
    verticalId: 'bank',
    groupId: 'admin_docs',
    clusterIds: ['arrive'],
    labelEn: 'Banking & Finance',
    labelRu: 'Банки и финансы',
    icon: '🏦',
    status: 'active',
    personaTags: ['resident', 'relocation', 'investor', 'nomad', 'business'],
    bookable: false,
  },
  visa: {
    id: 'visa',
    route: APP_ROUTES.VISA_IMMIGRATION,
    groupId: 'admin_docs',
    clusterIds: ['legal'],
    labelEn: 'Visa & Immigration',
    labelRu: 'Визы и иммиграция',
    icon: '🌍',
    status: 'active',
    personaTags: ['resident', 'relocation', 'business', 'nomad'],
    bookable: false,
  },
  relocate: {
    id: 'relocate',
    route: APP_ROUTES.RELOCATE,
    groupId: 'admin_docs',
    clusterIds: ['arrive', 'legal'],
    labelEn: 'Relocation',
    labelRu: 'Переезд',
    icon: '🧳',
    status: 'active',
    personaTags: ['relocation'],
    bookable: false,
  },
  tax: {
    id: 'tax',
    route: APP_ROUTES.TAX_NAV,
    groupId: 'admin_docs',
    clusterIds: ['legal'],
    labelEn: 'Taxes',
    labelRu: 'Налоги',
    icon: '🧾',
    status: 'active',
    personaTags: ['resident', 'investor', 'business'],
    bookable: false,
  },
  'contract-ai': {
    id: 'contract-ai',
    route: APP_ROUTES.CONTRACT_ANALYSIS,
    groupId: 'admin_docs',
    clusterIds: ['legal'],
    labelEn: 'ContractAI',
    labelRu: 'ContractAI',
    icon: '🔍',
    status: 'active',
    personaTags: ['resident', 'investor', 'business'],
    bookable: false,
  },
  knowledge: {
    id: 'knowledge',
    route: APP_ROUTES.KNOWLEDGE,
    groupId: 'admin_docs',
    clusterIds: ['arrive', 'live'],
    labelEn: 'Knowledge Hub',
    labelRu: 'База знаний',
    icon: '📖',
    status: 'active',
    personaTags: ['relocation', 'nomad'],
    bookable: false,
  },

  // ──────── Home Maintenance (sub-categories of Services) ────────
  services: {
    id: 'services',
    route: APP_ROUTES.SERVICES,
    groupId: 'maintenance',
    clusterIds: ['live'],
    labelEn: 'Home Services',
    labelRu: 'Услуги для дома',
    icon: '🔧',
    status: 'active',
    personaTags: ['property_owner', 'business'],
    bookable: true,
  },
  'services-laundry': {
    id: 'services-laundry',
    route: `${APP_ROUTES.SERVICES}?category=laundry`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Laundry',
    labelRu: 'Прачечная',
    icon: '👕',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-plumbing': {
    id: 'services-plumbing',
    route: `${APP_ROUTES.SERVICES}?category=plumbing`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Plumbing',
    labelRu: 'Сантехника',
    icon: '🔧',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-electrical': {
    id: 'services-electrical',
    route: `${APP_ROUTES.SERVICES}?category=electrical`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Electrical',
    labelRu: 'Электрика',
    icon: '⚡',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-ac': {
    id: 'services-ac',
    route: `${APP_ROUTES.SERVICES}?category=ac-repair`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'AC Repair',
    labelRu: 'Кондиционеры',
    icon: '❄️',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-gardening': {
    id: 'services-gardening',
    route: `${APP_ROUTES.SERVICES}?category=gardening`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Gardening',
    labelRu: 'Сад и озеленение',
    icon: '🌿',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-pest': {
    id: 'services-pest',
    route: `${APP_ROUTES.SERVICES}?category=pest-control`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Pest Control',
    labelRu: 'Дезинсекция',
    icon: '🐜',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-handyman': {
    id: 'services-handyman',
    route: `${APP_ROUTES.SERVICES}?category=handyman`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Handyman',
    labelRu: 'Мастер на час',
    icon: '🛠️',
    status: 'active',
    personaTags: [],
    bookable: true,
  },
  'services-locksmith': {
    id: 'services-locksmith',
    route: `${APP_ROUTES.SERVICES}?category=locksmith`,
    groupId: 'maintenance',
    clusterIds: [],
    labelEn: 'Locksmith',
    labelRu: 'Замки и ключи',
    icon: '🔑',
    status: 'active',
    personaTags: [],
    bookable: true,
  },

  // ──────── Help ────────
  'vip-concierge': {
    id: 'vip-concierge',
    route: APP_ROUTES.VIP_CONCIERGE,
    groupId: 'help',
    clusterIds: ['enjoy', 'live'],
    labelEn: 'Concierge',
    labelRu: 'Консьерж',
    icon: '🎩',
    status: 'active',
    personaTags: ['tourist', 'resident'],
    bookable: false,
  },
  sos: {
    id: 'sos',
    route: APP_ROUTES.SOS,
    groupId: 'help',
    clusterIds: ['arrive', 'live'],
    labelEn: 'Emergency Help',
    labelRu: 'Экстренная помощь',
    icon: '🆘',
    status: 'active',
    personaTags: ['tourist', 'resident'],
    bookable: false,
  },

  // ──────── Arrive cluster extras ────────
  sim: {
    id: 'sim',
    route: APP_ROUTES.SIM_START,
    groupId: 'transport',
    clusterIds: ['arrive'],
    labelEn: 'SIM Cards',
    labelRu: 'SIM-карты',
    icon: '📱',
    status: 'active',
    personaTags: ['nomad'],
    bookable: false,
  },
  exchange: {
    id: 'exchange',
    route: APP_ROUTES.EXCHANGE,
    groupId: 'admin_docs',
    clusterIds: ['arrive'],
    labelEn: 'Exchange Rates',
    labelRu: 'Курсы валют',
    icon: '💱',
    status: 'active',
    personaTags: ['tourist', 'resident'],
    bookable: false,
  },

  // ──────── Market & Delivery ────────
  market: {
    id: 'market',
    route: APP_ROUTES.MARKET,
    groupId: 'leisure',
    clusterIds: ['live'],
    labelEn: 'Market',
    labelRu: 'Маркет',
    icon: '🛍️',
    status: 'active',
    personaTags: ['tourist'],
    bookable: false,
  },

  // ──────── Invest cluster ────────
  offplan: {
    id: 'offplan',
    route: APP_ROUTES.OFFPLAN,
    groupId: 'invest',
    clusterIds: ['invest'],
    labelEn: 'New Developments',
    labelRu: 'Новостройки',
    icon: '🏗️',
    status: 'active',
    personaTags: ['investor'],
    bookable: false,
  },
  resale: {
    id: 'resale',
    route: APP_ROUTES.RESALE,
    groupId: 'invest',
    clusterIds: ['invest'],
    labelEn: 'Resale',
    labelRu: 'Вторичка',
    icon: '🏘️',
    status: 'active',
    personaTags: ['investor'],
    bookable: false,
  },
  developers: {
    id: 'developers',
    route: APP_ROUTES.DEVELOPERS,
    groupId: 'invest',
    clusterIds: ['invest'],
    labelEn: 'Developers',
    labelRu: 'Застройщики',
    icon: '🏗️',
    status: 'active',
    personaTags: ['real_estate_developer'],
    bookable: false,
  },
  'invest-hub': {
    id: 'invest-hub',
    route: APP_ROUTES.INVEST,
    groupId: 'invest',
    clusterIds: ['invest'],
    labelEn: 'ROI & invest hub',
    labelRu: 'ROI / инвестиции',
    icon: '📈',
    status: 'active',
    personaTags: ['investor'],
    bookable: false,
  },

  // ──────── Manage cluster ────────
  mc: {
    id: 'mc',
    route: APP_ROUTES.MC,
    groupId: 'manage',
    clusterIds: ['manage'],
    labelEn: 'MC Dashboard',
    labelRu: 'Кабинет MC',
    icon: '📅',
    status: 'active',
    personaTags: ['property_owner'],
    bookable: false,
  },
  'mc-calendar': {
    id: 'mc-calendar',
    route: APP_ROUTES.MC_CALENDAR,
    groupId: 'manage',
    clusterIds: ['manage'],
    labelEn: 'Calendar',
    labelRu: 'Календарь',
    icon: '📅',
    status: 'active',
    personaTags: ['property_owner'],
    bookable: false,
  },
  'mc-finance': {
    id: 'mc-finance',
    route: APP_ROUTES.MC_FINANCE,
    groupId: 'manage',
    clusterIds: ['manage'],
    labelEn: 'Finances',
    labelRu: 'Финансы',
    icon: '💰',
    status: 'active',
    personaTags: ['property_owner'],
    bookable: false,
  },
  'mc-reports': {
    id: 'mc-reports',
    route: APP_ROUTES.MC_REPORTS,
    groupId: 'manage',
    clusterIds: ['manage'],
    labelEn: 'Reports',
    labelRu: 'Отчёты',
    icon: '📊',
    status: 'pro',
    personaTags: [],
    bookable: false,
  },
  'mc-crm': {
    id: 'mc-crm',
    route: APP_ROUTES.MC_CRM_DASHBOARD,
    groupId: 'manage',
    clusterIds: ['manage'],
    labelEn: 'CRM',
    labelRu: 'CRM',
    icon: '👥',
    status: 'pro',
    personaTags: ['property_owner'],
    bookable: false,
  },

  // ──────── Build / For Developers ────────
  'developer-portal': {
    id: 'developer-portal',
    route: APP_ROUTES.DEVELOPER_PORTAL,
    groupId: 'build',
    clusterIds: ['build'],
    labelEn: 'Portal',
    labelRu: 'Портал',
    icon: '🏢',
    status: 'active',
    personaTags: ['real_estate_developer'],
    bookable: false,
  },
  'for-developers': {
    id: 'for-developers',
    route: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS,
    groupId: 'build',
    clusterIds: ['build'],
    labelEn: 'Developer program',
    labelRu: 'Застройщикам',
    icon: '📋',
    status: 'active',
    personaTags: ['real_estate_developer'],
    bookable: false,
  },
  newbuilds: {
    id: 'newbuilds',
    route: APP_ROUTES.NEWBUILDS,
    groupId: 'build',
    clusterIds: ['build'],
    labelEn: 'Newbuilds showcase',
    labelRu: 'Витрина новостроек',
    icon: '🏗️',
    status: 'active',
    personaTags: ['real_estate_developer', 'investor'],
    bookable: false,
  },
  consultation: {
    id: 'consultation',
    route: APP_ROUTES.PROPERTY_CONSULTATION,
    groupId: 'build',
    clusterIds: ['build'],
    labelEn: 'Advisory',
    labelRu: 'Консультация',
    icon: '📞',
    status: 'active',
    personaTags: ['real_estate_developer'],
    bookable: false,
  },

  // ──────── Lifestyle landings ────────
  'school-finder': {
    id: 'school-finder',
    route: APP_ROUTES.SCHOOL_FINDER,
    groupId: 'lifestyle',
    clusterIds: ['family'],
    labelEn: 'School Finder',
    labelRu: 'Поиск школы',
    icon: '🎓',
    status: 'active',
    personaTags: ['family'],
    bookable: false,
  },

  // ──────── Previously uncataloged — now in journey groups (deduped — primary defs above) ────────
  wedding: {
    id: 'wedding',
    route: APP_ROUTES.WEDDING,
    groupId: 'enjoy',
    clusterIds: ['enjoy'],
    labelEn: 'Weddings',
    labelRu: 'Свадьбы',
    icon: '💍',
    status: 'active',
    personaTags: ['couple'],
    bookable: false,
  },
  kids: {
    id: 'kids',
    route: APP_ROUTES.KIDS,
    groupId: 'enjoy',
    clusterIds: ['family', 'enjoy'],
    labelEn: 'Kids Activities',
    labelRu: 'Детям',
    icon: '🎈',
    status: 'active',
    personaTags: ['family'],
    bookable: false,
  },
} as const satisfies Record<string, AppEntry>;

// ── Derived helpers ──

export function getAppsForGroup(groupId: AppGroupId): AppEntry[] {
  return Object.values(APP_REGISTRY).filter((e) => e.groupId === groupId);
}

export function getAppsForCluster(clusterId: NavigatorClusterId): AppEntry[] {
  return Object.values(APP_REGISTRY).filter((e) => e.clusterIds.includes(clusterId));
}

export function getAppsForPersona(personaTag: string): AppEntry[] {
  return Object.values(APP_REGISTRY).filter((e) => e.personaTags.includes(personaTag));
}

export function getActiveApps(): AppEntry[] {
  return Object.values(APP_REGISTRY).filter((e) => e.status === 'active');
}
