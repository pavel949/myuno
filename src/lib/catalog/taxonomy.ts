/**
 * @module catalog/taxonomy
 * @description **Single Source of Truth** for the public service catalog.
 *
 * Hierarchy:
 *
 *   Cluster (6)  →  Category (16)  →  Service / App (~80 active in code)
 *        │
 *        └────────►  LifeSituation[] (M:N via DB table `cluster_life_situations`)
 *
 * Cluster ids match `category_groups.slug` in the database.
 * Category ids match `categories.slug` in the database.
 *
 * Why this file:
 * Until 2026-04-24 the platform had 6 parallel catalogs (`verticalGroups`,
 * `clusterCatalog`, `appRegistry`, `category_groups`/`categories` in DB,
 * `life_situations`, plus the canonical doc `02-service-catalogue-v2.md`).
 * They drifted apart and produced inconsistent navigation:
 * footer ≠ home grid ≠ discover ≠ catalog page.
 *
 * **Rule:** any new public-facing service or category is added HERE first.
 * Older modules (`verticalGroups.ts`, `nav/clusterCatalog.ts`,
 * `appRegistry.ts`) are now thin adapters that re-derive their shape
 * from this SSOT.
 */
import {
  Plane, Home as HomeIcon, Heart, Scale, TrendingUp, Building2, HardHat, Baby,
  Smartphone, ArrowLeftRight, Car, Landmark, Zap,
  Utensils, Sparkles, Stethoscope, ClipboardList, ShoppingBag, Users,
  FileSearch, Calculator, Shield, AlertTriangle,
  Calendar, BarChart3, Wrench, PenTool, DollarSign,
  Building, Search, LineChart, Palette,
  Compass, Anchor, Dumbbell, CalendarDays, GraduationCap, PawPrint,
  Hammer, Wind, TreePine, Bug, KeyRound, Warehouse, Truck, Package, Route, Waves, Bandage,
  Briefcase, Globe, BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type ClusterId = 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';

export type CategoryId =
  // Arrive (3)
  | 'cat-emergency' | 'cat-transport' | 'cat-tourism'
  // Live (8)
  | 'cat-home-living' | 'cat-food-entertainment' | 'cat-health-wellness'
  | 'cat-family-kids' | 'cat-pet-services' | 'cat-sports' | 'cat-community'
  | 'cat-wedding-events'
  // Manage (0 public — workspace-only cluster, see /mc/* routes)
  // Invest (1)
  | 'cat-real-estate'
  // Legal (3)
  | 'cat-business-legal' | 'cat-finance' | 'cat-halal-faith'
  // Build (1)
  | 'cat-partner-portal';

export type ServiceStatus = 'available' | 'soon' | 'pro';

export type Audience = 'public' | 'workspace';

export interface ServiceEntry {
  /** Stable id (used as react key, analytics tag) */
  id: string;
  /** Internal route — must come from APP_ROUTES whenever possible */
  path: string;
  /** Bilingual labels */
  labelRu: string;
  labelEn: string;
  labelTh?: string;
  /** Display icon */
  icon: LucideIcon;
  /** Availability gating */
  status: ServiceStatus;
  /** Optional vertical id (links to VERTICALS for bookings/orders) */
  verticalId?: string;
  /** Personas that should see this in personalized feeds (P01..P25 codes) */
  personaTags?: string[];
  /** JTBD cluster codes (A..J) from Master Taxonomy v1.0 */
  jtbdClusters?: string[];
}

export interface CategoryEntry {
  id: CategoryId;
  /** Owning cluster id */
  clusterId: ClusterId;
  labelRu: string;
  labelEn: string;
  labelTh?: string;
  /** Brief value-prop line */
  valueRu: string;
  valueEn: string;
  icon: LucideIcon;
  /** Hex accent color (matches DB `categories.color`) */
  color: string;
  services: ServiceEntry[];
}

export interface ClusterEntry {
  id: ClusterId;
  labelRu: string;
  labelEn: string;
  labelTh?: string;
  valueRu: string;
  valueEn: string;
  icon: LucideIcon;
  /** Hex accent color (matches DS cluster palette) */
  color: string;
  /** Display order in nav */
  sortOrder: number;
  /**
   * `public` (default) — visible to everyone.
   * `workspace` — gated by persona/role (operators only).
   */
  audience: Audience;
  /** Persona tags that grant access for `workspace` clusters */
  personas?: string[];
  /** Role keys that grant access for `workspace` clusters */
  roles?: string[];
  /**
   * Canonical landing route for the cluster card on Home (`ClusterGrid`).
   * Different from per-service paths — this is the umbrella entry-point.
   */
  homeRoute: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Clusters (6)
// ─────────────────────────────────────────────────────────────────────────

export const CLUSTERS: ClusterEntry[] = [
  {
    id: 'arrive',
    labelRu: 'Прибытие',
    labelEn: 'Arrival',
    labelTh: 'การเดินทาง',
    valueRu: 'Туристы и новые резиденты: дорога из аэропорта, связь, деньги, мобильность.',
    valueEn: 'Tourists & new residents: airport, connectivity, money, getting around.',
    icon: Plane,
    color: '#00D68F',
    sortOrder: 1,
    audience: 'public',
    homeRoute: '/life/arrival',
  },
  {
    id: 'live',
    labelRu: 'Жизнь',
    labelEn: 'Live',
    labelTh: 'ใช้ชีวิต',
    valueRu: 'Дом, здоровье, еда, семья, питомцы — повседневность без хаоса.',
    valueEn: 'Home, health, food, family, pets — everyday life sorted.',
    icon: HomeIcon,
    color: '#4E7BFF',
    sortOrder: 2,
    audience: 'public',
    homeRoute: '/discover',
  },
  {
    id: 'manage',
    labelRu: 'Управление',
    labelEn: 'Manage',
    labelTh: 'การจัดการ',
    valueRu: 'Собственники и управляющие: брони, финансы, операции, события — один кабинет.',
    valueEn: 'Hosts & managers: bookings, money, operations, events — one workspace.',
    icon: Building2,
    color: '#06B6D4',
    sortOrder: 3,
    audience: 'workspace',
    personas: ['property_owner', 'local_services_provider'],
    roles: ['owner', 'admin', 'team', 'vendor'],
    homeRoute: '/mc',
  },
  {
    id: 'invest',
    labelRu: 'Инвестиции',
    labelEn: 'Invest',
    labelTh: 'การลงทุน',
    valueRu: 'Недвижимость: каталог, новостройки, вторичка, ROI, due diligence.',
    valueEn: 'Real estate: search, off-plan, resale, ROI, due diligence.',
    icon: TrendingUp,
    color: '#A855F7',
    sortOrder: 4,
    audience: 'public',
    homeRoute: '/invest',
  },
  {
    id: 'legal',
    labelRu: 'Право и визы',
    labelEn: 'Legal & Visa',
    labelTh: 'กฎหมายและวีซ่า',
    valueRu: 'Визы, налоги, договоры, страховки, банк, образование, релокация.',
    valueEn: 'Visa, taxes, contracts, insurance, banking, education, relocation.',
    icon: Scale,
    color: '#F59E0B',
    sortOrder: 5,
    audience: 'public',
    homeRoute: '/life/relocation',
  },
  {
    id: 'build',
    labelRu: 'Застройщикам',
    labelEn: 'Build',
    labelTh: 'ผู้พัฒนา',
    valueRu: 'B2B: портал застройщика, лиды, витрина проектов, консультации.',
    valueEn: 'B2B: developer portal, leads, project showcase, advisory.',
    icon: HardHat,
    color: '#F43F5E',
    sortOrder: 6,
    audience: 'public',
    homeRoute: '/property/offplan',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Categories with Services (16 categories, ~80 active services)
// ─────────────────────────────────────────────────────────────────────────

const SERVICES_URL = APP_ROUTES.SERVICES;
const EXPERIENCES_URL = APP_ROUTES.EXPERIENCES;

export const CATEGORIES: CategoryEntry[] = [
  // ============== ARRIVE ==============
  {
    id: 'cat-emergency',
    clusterId: 'arrive',
    labelRu: 'Экстренные случаи',
    labelEn: 'Emergency',
    valueRu: 'SOS-кнопка и протоколы для нестандартных ситуаций.',
    valueEn: 'SOS button and protocols when something goes wrong.',
    icon: AlertTriangle,
    color: '#EF4444',
    services: [
      { id: 'sos',           path: APP_ROUTES.SOS,           labelRu: 'SOS',           labelEn: 'SOS',           icon: AlertTriangle, status: 'available' },
      { id: 'vip-concierge', path: APP_ROUTES.VIP_CONCIERGE, labelRu: 'VIP-консьерж',   labelEn: 'VIP Concierge', icon: Sparkles,      status: 'available' },
      { id: 'support',       path: APP_ROUTES.SUPPORT,       labelRu: 'Поддержка',      labelEn: 'Support',       icon: ClipboardList, status: 'available' },
    ],
  },
  {
    id: 'cat-transport',
    clusterId: 'arrive',
    labelRu: 'Транспорт',
    labelEn: 'Transport',
    valueRu: 'Трансферы, аренда авто и байков, fast-track в аэропорту.',
    valueEn: 'Transfers, car & bike rental, airport fast-track.',
    icon: Car,
    color: '#3B82F6',
    services: [
      { id: 'transfer',   path: APP_ROUTES.AIRPORT_TRANSFER, labelRu: 'Трансферы',  labelEn: 'Transfers',  icon: Car,         status: 'available', verticalId: 'transfer', personaTags: ['tourist'] },
      { id: 'fast-track', path: APP_ROUTES.FAST_TRACK,        labelRu: 'Fast Track',  labelEn: 'Fast Track', icon: Zap,         status: 'available', personaTags: ['tourist'] },
      { id: 'vehicle',    path: APP_ROUTES.TRANSPORT,         labelRu: 'Авто и байки',labelEn: 'Car & bike', icon: Car,         status: 'available', verticalId: 'vehicle' },
      { id: 'sim',        path: APP_ROUTES.SIM_START,         labelRu: 'SIM-карты',   labelEn: 'SIM cards',  icon: Smartphone,  status: 'available' },
      { id: 'exchange',   path: APP_ROUTES.EXCHANGE,          labelRu: 'Курсы валют', labelEn: 'Exchange',   icon: ArrowLeftRight, status: 'available' },
    ],
  },
  {
    id: 'cat-tourism',
    clusterId: 'arrive',
    labelRu: 'Туризм и активности',
    labelEn: 'Tourism & Activities',
    valueRu: 'Впечатления, туры, яхты, события, водный спорт.',
    valueEn: 'Experiences, tours, yachts, events, water sports.',
    icon: Compass,
    color: '#06B6D4',
    services: [
      { id: 'experience', path: EXPERIENCES_URL,                          labelRu: 'Впечатления',  labelEn: 'Experiences',   icon: Compass,      status: 'available', verticalId: 'experience' },
      { id: 'tours',      path: `${EXPERIENCES_URL}?type=tour`,           labelRu: 'Туры',          labelEn: 'Tours',         icon: Route,        status: 'available' },
      { id: 'water',      path: `${EXPERIENCES_URL}?type=activity`,       labelRu: 'Вода и активности', labelEn: 'Water & activities', icon: Waves, status: 'available', verticalId: 'water_activity' },
      { id: 'yacht',      path: APP_ROUTES.YACHTS,                        labelRu: 'Яхты',          labelEn: 'Yachts',        icon: Anchor,       status: 'available', verticalId: 'yacht' },
      { id: 'event',      path: APP_ROUTES.EVENTS,                        labelRu: 'События',       labelEn: 'Events',        icon: CalendarDays, status: 'available', verticalId: 'event' },
    ],
  },

  // ============== LIVE ==============
  {
    id: 'cat-home-living',
    clusterId: 'live',
    labelRu: 'Дом и быт',
    labelEn: 'Home & Living',
    valueRu: 'Уборка, прачечная, мастер на час, сад, кондиционеры.',
    valueEn: 'Cleaning, laundry, handyman, gardening, AC repair.',
    icon: HomeIcon,
    color: '#10B981',
    services: [
      { id: 'cleaning',         path: APP_ROUTES.CLEANING,                          labelRu: 'Уборка',         labelEn: 'Cleaning',       icon: Sparkles,    status: 'available', verticalId: 'cleaning' },
      { id: 'services',         path: SERVICES_URL,                                  labelRu: 'Все услуги',     labelEn: 'Services hub',   icon: Wrench,      status: 'available' },
      { id: 'laundry',          path: `${SERVICES_URL}?category=laundry`,            labelRu: 'Прачечная',      labelEn: 'Laundry',        icon: Package,     status: 'available' },
      { id: 'handyman',         path: `${SERVICES_URL}?category=handyman`,           labelRu: 'Мастер на час',  labelEn: 'Handyman',       icon: Hammer,      status: 'available' },
      { id: 'plumbing',         path: `${SERVICES_URL}?category=plumbing`,           labelRu: 'Сантехника',     labelEn: 'Plumbing',       icon: Wrench,      status: 'available' },
      { id: 'electrical',       path: `${SERVICES_URL}?category=electrical`,         labelRu: 'Электрика',      labelEn: 'Electrical',     icon: Zap,         status: 'available' },
      { id: 'ac-repair',        path: `${SERVICES_URL}?category=ac-repair`,          labelRu: 'Кондиционеры',   labelEn: 'AC repair',      icon: Wind,        status: 'available' },
      { id: 'gardening',        path: `${SERVICES_URL}?category=gardening`,          labelRu: 'Сад',            labelEn: 'Gardening',      icon: TreePine,    status: 'available' },
      { id: 'pest-control',     path: `${SERVICES_URL}?category=pest-control`,       labelRu: 'Дезинсекция',    labelEn: 'Pest control',   icon: Bug,         status: 'available' },
      { id: 'locksmith',        path: `${SERVICES_URL}?category=locksmith`,          labelRu: 'Замки',          labelEn: 'Locksmith',      icon: KeyRound,    status: 'available' },
      { id: 'storage',          path: `${SERVICES_URL}?category=storage`,            labelRu: 'Хранение',       labelEn: 'Storage',        icon: Warehouse,   status: 'available' },
      { id: 'flowers',          path: APP_ROUTES.FLOWERS,                            labelRu: 'Цветы',          labelEn: 'Flowers',        icon: Sparkles,    status: 'available', verticalId: 'flower' },
    ],
  },
  {
    id: 'cat-food-entertainment',
    clusterId: 'live',
    labelRu: 'Еда и развлечения',
    labelEn: 'Food & Entertainment',
    valueRu: 'Рестораны, доставка, маркет, шопинг.',
    valueEn: 'Restaurants, delivery, market, shopping.',
    icon: Utensils,
    color: '#F59E0B',
    services: [
      { id: 'restaurant',  path: APP_ROUTES.RESTAURANTS, labelRu: 'Рестораны',     labelEn: 'Restaurants', icon: Utensils,    status: 'available', verticalId: 'restaurant' },
      { id: 'market',      path: APP_ROUTES.MARKET,      labelRu: 'Маркет',         labelEn: 'Market',      icon: ShoppingBag, status: 'available' },
      { id: 'delivery',    path: APP_ROUTES.DELIVERY,    labelRu: 'Доставка',       labelEn: 'Delivery',    icon: Truck,       status: 'available' },
    ],
  },
  {
    id: 'cat-health-wellness',
    clusterId: 'live',
    labelRu: 'Здоровье и велнес',
    labelEn: 'Health & Wellness',
    valueRu: 'Медицина, аптеки, красота, страховки.',
    valueEn: 'Medical, pharmacy, beauty & spa, insurance.',
    icon: Stethoscope,
    color: '#EC4899',
    services: [
      { id: 'medical',   path: APP_ROUTES.MEDICAL,   labelRu: 'Медицина',  labelEn: 'Medical',   icon: Stethoscope, status: 'available', verticalId: 'medical' },
      { id: 'pharmacy',  path: APP_ROUTES.PHARMACY,  labelRu: 'Аптеки',    labelEn: 'Pharmacy',  icon: Bandage,     status: 'available', verticalId: 'pharmacy' },
      { id: 'beauty',    path: APP_ROUTES.BEAUTY,    labelRu: 'Красота',   labelEn: 'Beauty',    icon: Palette,     status: 'available', verticalId: 'beauty' },
      { id: 'insurance', path: APP_ROUTES.INSURANCE, labelRu: 'Страховка', labelEn: 'Insurance', icon: Shield,      status: 'available', verticalId: 'insurance' },
    ],
  },
  {
    id: 'cat-family-kids',
    clusterId: 'live',
    labelRu: 'Семья и дети',
    labelEn: 'Family & Kids',
    valueRu: 'Школы, няни, образование, детская активность.',
    valueEn: 'Schools, babysitters, education, kids activities.',
    icon: Baby,
    color: '#F472B6',
    services: [
      { id: 'babysitter',     path: APP_ROUTES.BABYSITTER,     labelRu: 'Няни',         labelEn: 'Babysitters',  icon: Baby,          status: 'available', verticalId: 'babysitter' },
      { id: 'school-finder',  path: APP_ROUTES.SCHOOL_FINDER,  labelRu: 'Школы',        labelEn: 'School finder',icon: Search,        status: 'available' },
      { id: 'education',      path: APP_ROUTES.EDUCATION,      labelRu: 'Образование',  labelEn: 'Education',    icon: GraduationCap, status: 'available', verticalId: 'education' },
      { id: 'kids',           path: '/kids',                   labelRu: 'Дети',         labelEn: 'Kids',         icon: Baby,          status: 'available' },
    ],
  },
  {
    id: 'cat-pet-services',
    clusterId: 'live',
    labelRu: 'Сервисы для питомцев',
    labelEn: 'Pet Services',
    valueRu: 'Уход, ветеринары, груминг, ввоз/вывоз питомца.',
    valueEn: 'Pet care, veterinary, grooming, import/export.',
    icon: PawPrint,
    color: '#A78BFA',
    services: [
      { id: 'pets',       path: APP_ROUTES.PETS,       labelRu: 'Питомцы',    labelEn: 'Pets',        icon: PawPrint, status: 'available', verticalId: 'pet_service', personaTags: ['pet_owner'] },
      { id: 'veterinary', path: APP_ROUTES.VETERINARY, labelRu: 'Ветеринары', labelEn: 'Veterinary',  icon: Bandage,  status: 'available', personaTags: ['pet_owner'] },
    ],
  },
  {
    id: 'cat-sports',
    clusterId: 'live',
    labelRu: 'Спорт и тренировки',
    labelEn: 'Sports & Athletic',
    valueRu: 'Фитнес, бойцовские школы, дайвинг, серфинг.',
    valueEn: 'Fitness, martial arts, diving, surfing.',
    icon: Dumbbell,
    color: '#22C55E',
    services: [
      { id: 'fitness', path: APP_ROUTES.FITNESS, labelRu: 'Фитнес', labelEn: 'Fitness', icon: Dumbbell, status: 'available', verticalId: 'fitness' },
    ],
  },
  {
    id: 'cat-community',
    clusterId: 'live',
    labelRu: 'Сообщество',
    labelEn: 'Community',
    valueRu: 'Клубы, события, знакомства, нетворкинг.',
    valueEn: 'Clubs, meetups, community events, networking.',
    icon: Users,
    color: '#0EA5E9',
    services: [
      { id: 'community', path: APP_ROUTES.HOME, labelRu: 'Скоро', labelEn: 'Coming soon', icon: Users, status: 'soon' },
    ],
  },

  // ─── Wedding & Events sits in LIVE (lifestyle / family celebration),
  //     not MANAGE. The MANAGE cluster is workspace-only (PMS, finance,
  //     team, bookings) and is exposed via /mc/* routes, not the public
  //     services catalog. Persona system (detectPersona.ts) and the
  //     legacy appRegistry adapter mirror this 'live' assignment.
  {
    id: 'cat-wedding-events',
    clusterId: 'live',
    labelRu: 'Свадьбы и события',
    labelEn: 'Wedding & Events',
    valueRu: 'Destination-свадьбы, корпоративы, MICE — координация поставщиков.',
    valueEn: 'Destination weddings, corporate events, MICE coordination.',
    icon: CalendarDays,
    color: '#F43F5E',
    services: [
      { id: 'wedding', path: '/wedding', labelRu: 'Свадьбы', labelEn: 'Weddings', icon: CalendarDays, status: 'available' },
    ],
  },

  // ============== MANAGE (workspace-only, no public categories) ==============
  // Real management modules live under /mc/* and /owner/* workspace routes
  // and are not exposed as public services in this catalog.

  // ============== INVEST ==============
  {
    id: 'cat-real-estate',
    clusterId: 'invest',
    labelRu: 'Недвижимость',
    labelEn: 'Real Estate',
    valueRu: 'Поиск, новостройки, вторичка, застройщики, ROI.',
    valueEn: 'Search, off-plan, resale, developers, ROI.',
    icon: Building2,
    color: '#8B5CF6',
    services: [
      { id: 'property',     path: APP_ROUTES.PROPERTY,    labelRu: 'Поиск',          labelEn: 'Property',     icon: Search,    status: 'available', verticalId: 'property' },
      { id: 'rent-short',   path: '/property/rent/short-term', labelRu: 'Краткосрочная аренда', labelEn: 'Short rent', icon: KeyRound, status: 'available' },
      { id: 'rent-long',    path: '/property/rent/long-term',  labelRu: 'Долгосрочная аренда',  labelEn: 'Long rent',  icon: HomeIcon, status: 'available' },
      { id: 'offplan',      path: APP_ROUTES.OFFPLAN,     labelRu: 'Новостройки',    labelEn: 'Off-plan',     icon: Building2, status: 'available' },
      { id: 'resale',       path: APP_ROUTES.RESALE,      labelRu: 'Вторичка',       labelEn: 'Resale',       icon: Building2, status: 'available' },
      { id: 'developers',   path: APP_ROUTES.DEVELOPERS,  labelRu: 'Застройщики',    labelEn: 'Developers',   icon: Users,     status: 'available' },
      { id: 'roi-hub',      path: APP_ROUTES.INVEST,      labelRu: 'ROI Hub',        labelEn: 'ROI Hub',      icon: BarChart3, status: 'available' },
      { id: 'due-diligence',path: APP_ROUTES.INVEST,      labelRu: 'Due Diligence',  labelEn: 'Due Diligence',icon: Shield,    status: 'soon' },
    ],
  },

  // ============== LEGAL ==============
  {
    id: 'cat-business-legal',
    clusterId: 'legal',
    labelRu: 'Бизнес и право',
    labelEn: 'Business & Legal',
    valueRu: 'Визы, договоры, регистрация компаний, ContractAI.',
    valueEn: 'Visas, contracts, company setup, ContractAI.',
    icon: Scale,
    color: '#6366F1',
    services: [
      { id: 'visa',        path: APP_ROUTES.VISA_IMMIGRATION,  labelRu: 'Визы',        labelEn: 'Visas',       icon: Globe,      status: 'available' },
      { id: 'legal',       path: APP_ROUTES.LEGAL,             labelRu: 'Юристы',      labelEn: 'Legal',       icon: Scale,      status: 'available', verticalId: 'legal' },
      { id: 'contract-ai', path: APP_ROUTES.CONTRACT_ANALYSIS, labelRu: 'ContractAI',   labelEn: 'ContractAI',  icon: FileSearch, status: 'available' },
      { id: 'relocate',    path: APP_ROUTES.RELOCATE,          labelRu: 'Релокация',   labelEn: 'Relocation',  icon: Briefcase,  status: 'available' },
      { id: 'knowledge',   path: APP_ROUTES.KNOWLEDGE,         labelRu: 'База знаний', labelEn: 'Knowledge',   icon: BookOpen,   status: 'available' },
    ],
  },
  {
    id: 'cat-finance',
    clusterId: 'legal',
    labelRu: 'Финансы',
    labelEn: 'Finance',
    valueRu: 'Банки, налоги, переводы, финансовое планирование.',
    valueEn: 'Banking, taxes, transfers, financial planning.',
    icon: DollarSign,
    color: '#14B8A6',
    services: [
      { id: 'banking', path: APP_ROUTES.BANKING, labelRu: 'Банк',     labelEn: 'Banking', icon: Landmark,   status: 'available', verticalId: 'bank' },
      { id: 'tax',     path: APP_ROUTES.TAX_NAV, labelRu: 'Налоги',   labelEn: 'Taxes',   icon: Calculator, status: 'available' },
    ],
  },
  {
    id: 'cat-halal-faith',
    clusterId: 'legal',
    labelRu: 'Халяль и вероисповедание',
    labelEn: 'Halal & Faith',
    valueRu: 'Халяль-инфраструктура, мечети, церкви, ритуальные услуги.',
    valueEn: 'Halal infrastructure, mosques, churches, ritual services.',
    icon: Heart,
    color: '#84CC16',
    services: [
      { id: 'faith', path: APP_ROUTES.HOME, labelRu: 'Скоро', labelEn: 'Coming soon', icon: Heart, status: 'soon' },
    ],
  },

  // ============== BUILD ==============
  {
    id: 'cat-partner-portal',
    clusterId: 'build',
    labelRu: 'Партнёры и B2B',
    labelEn: 'Partner Portal',
    valueRu: 'Портал застройщика, программа, витрина, консультации.',
    valueEn: 'Developer portal, program, showcase, advisory.',
    icon: Building,
    color: '#F97316',
    services: [
      { id: 'developer-portal', path: APP_ROUTES.DEVELOPER_PORTAL,           labelRu: 'Портал',       labelEn: 'Portal',    icon: Building,  status: 'available' },
      { id: 'program',          path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, labelRu: 'Программа',    labelEn: 'Program',   icon: LineChart, status: 'available' },
      { id: 'newbuilds',        path: APP_ROUTES.NEWBUILDS,                  labelRu: 'Витрина',      labelEn: 'Showcase',  icon: Building2, status: 'available' },
      { id: 'advisory',         path: APP_ROUTES.PROPERTY_CONSULTATION,      labelRu: 'Консультация', labelEn: 'Advisory',  icon: PenTool,   status: 'available' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Derived helpers (memoizable, pure)
// ─────────────────────────────────────────────────────────────────────────

export interface FlatService extends ServiceEntry {
  categoryId: CategoryId;
  categoryColor: string;
  categoryLabelRu: string;
  categoryLabelEn: string;
  clusterId: ClusterId;
}

export const FLAT_SERVICES: FlatService[] = CATEGORIES.flatMap((cat) =>
  cat.services.map((svc) => ({
    ...svc,
    categoryId: cat.id,
    categoryColor: cat.color,
    categoryLabelRu: cat.labelRu,
    categoryLabelEn: cat.labelEn,
    clusterId: cat.clusterId,
  }))
);

export const AVAILABLE_SERVICES: FlatService[] =
  FLAT_SERVICES.filter((s) => s.status !== 'soon');

export const SOON_SERVICES: FlatService[] =
  FLAT_SERVICES.filter((s) => s.status === 'soon');

export const TOTAL_AVAILABLE_SERVICES = AVAILABLE_SERVICES.length;

export function getClusterById(id: ClusterId): ClusterEntry | undefined {
  return CLUSTERS.find((c) => c.id === id);
}

export function getCategoryById(id: CategoryId): CategoryEntry | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesByCluster(clusterId: ClusterId): CategoryEntry[] {
  return CATEGORIES.filter((c) => c.clusterId === clusterId);
}

export function getServicesByCluster(clusterId: ClusterId): FlatService[] {
  return FLAT_SERVICES.filter((s) => s.clusterId === clusterId);
}

export function getServicesByCategory(categoryId: CategoryId): ServiceEntry[] {
  return getCategoryById(categoryId)?.services ?? [];
}

/** Count available services per cluster (used in nav badges). */
export function countAvailableServicesByCluster(clusterId: ClusterId): number {
  return AVAILABLE_SERVICES.filter((s) => s.clusterId === clusterId).length;
}

// ─────────────────────────────────────────────────────────────────────────
// Audience filtering
// ─────────────────────────────────────────────────────────────────────────

export interface AudienceContext {
  personas?: string[];
  role?: string | null;
}

/**
 * `public` clusters always visible. `workspace` clusters require a matching
 * persona OR role. Empty context hides workspace clusters (safer default —
 * a guest doesn't accidentally see operator surfaces).
 */
export function isClusterVisibleToUser(
  cluster: ClusterEntry,
  ctx: AudienceContext
): boolean {
  if (cluster.audience !== 'workspace') return true;
  const { personas = [], role } = ctx;
  const personaMatch = (cluster.personas ?? []).some((p) => personas.includes(p));
  const roleMatch = !!role && (cluster.roles ?? []).includes(role);
  return personaMatch || roleMatch;
}

export function visibleClustersForUser(ctx: AudienceContext): ClusterEntry[] {
  return CLUSTERS.filter((c) => isClusterVisibleToUser(c, ctx));
}
