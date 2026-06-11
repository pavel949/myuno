/**
 * @module catalog/taxonomy
 * @description **Single Source of Truth** for the public service catalog.
 *
 * Hierarchy:
 *
 *   Cluster (6)  →  Category (18)  →  Service / App (~68 active in code)
 *   Per cluster: arrive=3 · live=10 · manage=0 (workspace) · invest=1 · legal=3 · build=1
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
 *
 * **Drift note (2026-05-21):** the live `category_groups` / `categories`
 * tables on the production Supabase project diverge from this static SSOT.
 * Drawer currently shows `Arrive=14 · Live=27 · Invest=7 · Legal=7 · Build=4`
 * (DB) vs `12 / 30 / 9 / 11 / 4` here. DB reconciliation deferred until a
 * live-data audit can run (writing a blind UPSERT migration risks
 * overwriting curated DB rows). Sports & Athletic Training (spec §15,
 * 14 services) is fully absent in both — see canonical doc §15 for the
 * tracked gap. Hardcoded paths for `kids`, `wedding`, `halal-persona`,
 * `halal-stay` were migrated to `APP_ROUTES` constants in the same pass.
 */
import {
  Plane, PlaneLanding, Home as HomeIcon, Heart, Scale, TrendingUp, Building2, HardHat, Baby,
  Smartphone, ArrowLeftRight, Car, Landmark, Zap, Plug,
  Utensils, Sparkles, Stethoscope, ClipboardList, ShoppingBag, Users,
  FileSearch, Calculator, Shield, ShieldCheck, AlertTriangle, LifeBuoy,
  Calendar, BarChart3, Wrench, PenTool, DollarSign, LayoutGrid,
  Building, Search, LineChart, Palette, Scissors, Crown, Bike, Shirt,
  Compass, Anchor, Dumbbell, CalendarDays, GraduationCap, PawPrint,
  Hammer, Wind, TreePine, Bug, KeyRound, Warehouse, Truck, Package, Route, Waves, Bandage, Pill, Flower2,
  Briefcase, Globe, BookOpen, Heart as HeartIcon,
  Stethoscope as VetIcon,
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
  // Live (10) — повседневная жизнь, разбитая на узкие подгруппы вместо «свалки»
  | 'cat-home-cleaning'      // Уборка и быт
  | 'cat-home-repair'        // Ремонт и техника
  | 'cat-home-outdoor'       // Двор, сад, цветы
  | 'cat-home-logistics'     // Логистика и хранение
  | 'cat-food-delivery'      // Еда и доставка
  | 'cat-health-wellness'    // Здоровье и велнес
  | 'cat-family-kids'        // Семья и дети
  | 'cat-pet-services'       // Питомцы
  | 'cat-leisure'            // Досуг, события, спорт, сообщество
  | 'cat-wedding-events'     // Свадьбы и премиум-события
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
  /** Display order within cluster (from DB `categories.sort_order`). Omitted on static SSOT. */
  sortOrder?: number;
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
  /**
   * CSS color for inline `style` use. Resolves to `hsl(var(--cluster-X))`
   * tokens defined in `src/styles/tokens.css` §11 so theme switching
   * follows DS 2.1 (no DS 2.0 mint/blue/cyan rainbow).
   */
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
  /**
   * Life situations mapped to this cluster (M:N via DB table `cluster_life_situations`).
   * Populated by `useCatalogFromDB` — empty on the static SSOT.
   */
  lifeSituations?: LifeSituationEntry[];
}

/**
 * One canonical "life situation" — a high-level user state (arrival, family,
 * investing, etc.) used by AI routing, navigator filters, and hero counters.
 *
 * Mirrors `public.life_situations` row shape; codes match the migration seed
 * `supabase/migrations/20260424012840_…sql` so static fallback ≡ live DB.
 */
export interface LifeSituationEntry {
  /** Stable code (matches `life_situations.code` in DB) */
  code: string;
  titleRu: string;
  titleEn: string;
  descriptionRu?: string;
  descriptionEn?: string;
  /** Lucide icon name as a string (mirrors `life_situations.icon` text column) */
  icon: string;
  /** Hex accent — mirrors `life_situations.color` */
  color: string;
  /** Higher = surfaced earlier in nav (mirrors `life_situations.priority`) */
  priority: number;
  isActive: boolean;
}

/**
 * Cluster ↔ life-situation bridge entry. Mirrors the seeded rows of
 * `public.cluster_life_situations` (migration 20260424012840 §6).
 */
export interface ClusterLifeSituationLink {
  clusterId: ClusterId;
  situationCode: string;
  weight: number;
  isPrimary: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Clusters (6)
// ─────────────────────────────────────────────────────────────────────────

export const CLUSTERS: ClusterEntry[] = [
  {
    id: 'arrive',
    labelRu: 'Планирование и прибытие',
    labelEn: 'Planning & arrival',
    labelTh: 'การเดินทาง',
    valueRu: 'Дорога из аэропорта, связь, деньги и первые шаги — до того, как жизнь уляжется в быт.',
    valueEn: 'Airport logistics, connectivity, money, and first steps before everyday life settles in.',
    icon: Plane,
    color: 'hsl(var(--cluster-arrive))',
    sortOrder: 1,
    audience: 'public',
    homeRoute: APP_ROUTES.ARRIVE_CLUSTER,
  },
  {
    id: 'live',
    labelRu: 'Жизнь',
    labelEn: 'Live',
    labelTh: 'ใช้ชีวิต',
    valueRu: 'Дом, здоровье, еда, семья, питомцы — повседневность без хаоса.',
    valueEn: 'Home, health, food, family, pets — everyday life sorted.',
    icon: HomeIcon,
    color: 'hsl(var(--cluster-live))',
    sortOrder: 2,
    audience: 'public',
    homeRoute: APP_ROUTES.DISCOVER,
  },
  {
    id: 'manage',
    labelRu: 'Управление',
    labelEn: 'Manage',
    labelTh: 'การจัดการ',
    valueRu: 'Собственники и управляющие: брони, финансы, операции, события — один кабинет.',
    valueEn: 'Hosts & managers: bookings, money, operations, events — one workspace.',
    icon: Building2,
    color: 'hsl(var(--cluster-manage))',
    sortOrder: 3,
    audience: 'workspace',
    personas: ['property_owner', 'local_services_provider'],
    roles: ['owner', 'admin', 'team', 'vendor'],
    homeRoute: APP_ROUTES.FOR_MANAGEMENT_COMPANIES,
  },
  {
    id: 'invest',
    labelRu: 'Инвестиции',
    labelEn: 'Invest',
    labelTh: 'การลงทุน',
    valueRu: 'Недвижимость и капитал: поиск, новостройки, бизнес-вложения, ROI, база знаний.',
    valueEn: 'Property and capital: search, off-plan, business deals, ROI, knowledge base.',
    icon: TrendingUp,
    color: 'hsl(var(--cluster-invest))',
    sortOrder: 4,
    audience: 'public',
    homeRoute: APP_ROUTES.INVEST,
  },
  {
    id: 'legal',
    labelRu: 'Право и визы',
    labelEn: 'Legal & Visa',
    labelTh: 'กฎหมายและวีซ่า',
    valueRu: 'Визы, налоги, договоры, страховки, банк, образование, релокация.',
    valueEn: 'Visa, taxes, contracts, insurance, banking, education, relocation.',
    icon: Scale,
    color: 'hsl(var(--cluster-legal))',
    sortOrder: 5,
    audience: 'public',
    homeRoute: APP_ROUTES.LEGAL_CLUSTER,
  },
  {
    id: 'build',
    labelRu: 'Застройщикам',
    labelEn: 'Build',
    labelTh: 'ผู้พัฒนา',
    valueRu: 'B2B: портал застройщика, лиды, витрина проектов, консультации.',
    valueEn: 'B2B: developer portal, leads, project showcase, advisory.',
    icon: HardHat,
    color: 'hsl(var(--cluster-build))',
    sortOrder: 6,
    audience: 'public',
    homeRoute: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Categories with Services (18 categories, ~80 active services)
// ─────────────────────────────────────────────────────────────────────────

const SERVICES_URL = APP_ROUTES.SERVICES;
const EXPERIENCES_URL = APP_ROUTES.EXPERIENCES;

export const CATEGORIES: CategoryEntry[] = [
  // ============== ARRIVE (planning & arrival flow: logistics first; emergency last) ==============
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
      { id: 'transfer',   path: APP_ROUTES.AIRPORT_TRANSFER, labelRu: 'Трансферы',  labelEn: 'Transfers',  icon: PlaneLanding, status: 'available', verticalId: 'transfer', personaTags: ['tourist'], jtbdClusters: ['A'] },
      { id: 'fast-track', path: APP_ROUTES.FAST_TRACK,        labelRu: 'Fast Track',  labelEn: 'Fast Track', icon: Zap,         status: 'available', personaTags: ['tourist'], jtbdClusters: ['A'] },
      { id: 'vehicle',    path: APP_ROUTES.TRANSPORT,         labelRu: 'Авто и байки',labelEn: 'Car & bike', icon: Car,         status: 'available', verticalId: 'vehicle', jtbdClusters: ['A'] },
      { id: 'sim',        path: APP_ROUTES.SIM_START,         labelRu: 'SIM-карты',   labelEn: 'SIM cards',  icon: Smartphone,  status: 'available', jtbdClusters: ['A'] },
      { id: 'exchange',   path: APP_ROUTES.EXCHANGE,          labelRu: 'Курсы валют', labelEn: 'Exchange',   icon: ArrowLeftRight, status: 'available', jtbdClusters: ['A'] },
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
      { id: 'experience', path: EXPERIENCES_URL,                          labelRu: 'Впечатления',  labelEn: 'Experiences',   icon: Compass,      status: 'available', verticalId: 'experience', jtbdClusters: ['A', 'I'] },
      { id: 'tours',      path: `${EXPERIENCES_URL}?type=tour`,           labelRu: 'Туры',          labelEn: 'Tours',         icon: Route,        status: 'available', jtbdClusters: ['A', 'I'] },
      { id: 'water',      path: `${EXPERIENCES_URL}?type=activity`,       labelRu: 'Вода и активности', labelEn: 'Water & activities', icon: Waves, status: 'available', verticalId: 'water_activity', jtbdClusters: ['A', 'I'] },
      { id: 'yacht',      path: APP_ROUTES.YACHTS,                        labelRu: 'Яхты',          labelEn: 'Yachts',        icon: Anchor,       status: 'available', verticalId: 'yacht', jtbdClusters: ['A', 'I'] },
      { id: 'event',      path: APP_ROUTES.EVENTS,                        labelRu: 'События',       labelEn: 'Events',        icon: CalendarDays, status: 'available', verticalId: 'event', jtbdClusters: ['A', 'I'] },
    ],
  },
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
      { id: 'sos',           path: APP_ROUTES.SOS,           labelRu: 'SOS',           labelEn: 'SOS',           icon: AlertTriangle, status: 'available', jtbdClusters: ['H', 'A'] },
      { id: 'vip-concierge', path: APP_ROUTES.VIP_CONCIERGE, labelRu: 'VIP-консьерж',   labelEn: 'VIP Concierge', icon: Sparkles,      status: 'available', jtbdClusters: ['H', 'A'] },
      { id: 'support',       path: APP_ROUTES.SUPPORT,       labelRu: 'Поддержка',      labelEn: 'Support',       icon: ClipboardList, status: 'available', jtbdClusters: ['H', 'A'] },
    ],
  },

  // ============== LIVE — повседневность, разбитая на узкие категории ==============
  // Дом и быт раньше был одной свалкой из 12 сервисов в одну ленту.
  // Теперь — 4 отдельные категории: Уборка / Ремонт / Двор / Логистика.
  {
    id: 'cat-home-cleaning',
    clusterId: 'live',
    labelRu: 'Уборка и быт',
    labelEn: 'Cleaning & Household',
    valueRu: 'Регулярная уборка, прачечная, дезинсекция.',
    valueEn: 'Regular cleaning, laundry, pest control.',
    icon: Sparkles,
    color: '#10B981',
    services: [
      { id: 'cleaning',     path: APP_ROUTES.CLEANING,                       labelRu: 'Уборка',      labelEn: 'Cleaning',     icon: Sparkles, status: 'available', verticalId: 'cleaning' },
      { id: 'laundry',      path: `${SERVICES_URL}?category=laundry`,        labelRu: 'Прачечная',   labelEn: 'Laundry',      icon: Package,  status: 'available' },
      { id: 'pest-control', path: `${SERVICES_URL}?category=pest-control`,   labelRu: 'Дезинсекция', labelEn: 'Pest control', icon: Bug,      status: 'available' },
    ],
  },
  {
    id: 'cat-home-repair',
    clusterId: 'live',
    labelRu: 'Ремонт и техника',
    labelEn: 'Repair & Maintenance',
    valueRu: 'Мастер на час, сантехник, электрик, кондиционеры, замки.',
    valueEn: 'Handyman, plumber, electrician, AC, locksmith.',
    icon: Wrench,
    color: '#3B82F6',
    services: [
      { id: 'handyman',   path: `${SERVICES_URL}?category=handyman`,   labelRu: 'Мастер на час', labelEn: 'Handyman',    icon: Hammer,   status: 'available' },
      { id: 'plumbing',   path: `${SERVICES_URL}?category=plumbing`,   labelRu: 'Сантехника',    labelEn: 'Plumbing',    icon: Wrench,   status: 'available' },
      { id: 'electrical', path: `${SERVICES_URL}?category=electrical`, labelRu: 'Электрика',     labelEn: 'Electrical',  icon: Zap,      status: 'available' },
      { id: 'ac-repair',  path: `${SERVICES_URL}?category=ac-repair`,  labelRu: 'Кондиционеры',  labelEn: 'AC repair',   icon: Wind,     status: 'available' },
      { id: 'locksmith',  path: `${SERVICES_URL}?category=locksmith`,  labelRu: 'Замки',         labelEn: 'Locksmith',   icon: KeyRound, status: 'available' },
    ],
  },
  {
    id: 'cat-home-outdoor',
    clusterId: 'live',
    labelRu: 'Двор и сад',
    labelEn: 'Garden & Outdoor',
    valueRu: 'Сад, бассейн, цветы — внешняя территория.',
    valueEn: 'Garden, pool, flowers — outside the home.',
    icon: TreePine,
    color: '#22C55E',
    services: [
      { id: 'gardening', path: `${SERVICES_URL}?category=gardening`, labelRu: 'Сад',    labelEn: 'Gardening', icon: TreePine, status: 'available' },
      { id: 'flowers',   path: APP_ROUTES.FLOWERS,                   labelRu: 'Цветы',  labelEn: 'Flowers',   icon: Sparkles, status: 'available', verticalId: 'flower' },
    ],
  },
  {
    id: 'cat-home-logistics',
    clusterId: 'live',
    labelRu: 'Логистика и хранение',
    labelEn: 'Logistics & Storage',
    valueRu: 'Хранение вещей, переезды, все домашние услуги одной точкой.',
    valueEn: 'Storage, moving, all home services in one place.',
    icon: Truck,
    color: '#0EA5E9',
    services: [
      { id: 'storage',  path: `${SERVICES_URL}?category=storage`, labelRu: 'Хранение',   labelEn: 'Storage',      icon: Warehouse, status: 'available' },
      { id: 'services', path: SERVICES_URL,                        labelRu: 'Все услуги', labelEn: 'Services hub', icon: Wrench,    status: 'available' },
    ],
  },
  {
    id: 'cat-food-delivery',
    clusterId: 'live',
    labelRu: 'Еда и доставка',
    labelEn: 'Food & Delivery',
    valueRu: 'Рестораны, маркет, доставка еды и продуктов.',
    valueEn: 'Restaurants, market, food & grocery delivery.',
    icon: Utensils,
    color: '#F59E0B',
    services: [
      { id: 'restaurant', path: APP_ROUTES.RESTAURANTS, labelRu: 'Рестораны', labelEn: 'Restaurants', icon: Utensils,    status: 'available', verticalId: 'restaurant' },
      { id: 'delivery',   path: APP_ROUTES.DELIVERY,    labelRu: 'Доставка',  labelEn: 'Delivery',    icon: Truck,       status: 'available' },
      { id: 'market',     path: APP_ROUTES.MARKET,      labelRu: 'Маркет',    labelEn: 'Market',      icon: ShoppingBag, status: 'available' },
    ],
  },
  {
    id: 'cat-health-wellness',
    clusterId: 'live',
    labelRu: 'Здоровье и велнес',
    labelEn: 'Health & Wellness',
    valueRu: 'Медицина, аптеки, красота, фитнес, страховки.',
    valueEn: 'Medical, pharmacy, beauty, fitness, insurance.',
    icon: Stethoscope,
    color: '#EC4899',
    services: [
      { id: 'medical',   path: APP_ROUTES.MEDICAL,   labelRu: 'Медицина',  labelEn: 'Medical',   icon: Stethoscope, status: 'available', verticalId: 'medical' },
      { id: 'pharmacy',  path: APP_ROUTES.PHARMACY,  labelRu: 'Аптеки',    labelEn: 'Pharmacy',  icon: Bandage,     status: 'available', verticalId: 'pharmacy' },
      { id: 'beauty',    path: APP_ROUTES.BEAUTY,    labelRu: 'Красота',   labelEn: 'Beauty',    icon: Palette,     status: 'available', verticalId: 'beauty' },
      { id: 'fitness',   path: APP_ROUTES.FITNESS,   labelRu: 'Фитнес',    labelEn: 'Fitness',   icon: Dumbbell,    status: 'available', verticalId: 'fitness' },
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
      { id: 'kids',           path: APP_ROUTES.KIDS,           labelRu: 'Дети',         labelEn: 'Kids',         icon: Baby,          status: 'available' },
    ],
  },
  {
    id: 'cat-pet-services',
    clusterId: 'live',
    labelRu: 'Питомцы',
    labelEn: 'Pets',
    valueRu: 'Уход, ветеринары, груминг, ввоз/вывоз питомца.',
    valueEn: 'Pet care, veterinary, grooming, import/export.',
    icon: PawPrint,
    color: '#A78BFA',
    services: [
      { id: 'pets',       path: APP_ROUTES.PETS,       labelRu: 'Питомцы',    labelEn: 'Pets',        icon: PawPrint, status: 'available', verticalId: 'pet_service', personaTags: ['pet_owner'] },
      { id: 'veterinary', path: APP_ROUTES.VETERINARY, labelRu: 'Ветеринары', labelEn: 'Veterinary',  icon: Bandage,  status: 'available', personaTags: ['pet_owner'] },
    ],
  },
  // События и досуг — теперь часть повседневной ЖИЗНИ резидента (а не только
  // туристического "Прибытия"). Events дублируется здесь — Arrive остаётся
  // для туристического сценария, Live — для местного жителя.
  {
    id: 'cat-leisure',
    clusterId: 'live',
    labelRu: 'Досуг и события',
    labelEn: 'Leisure & Events',
    valueRu: 'Что делать вечером и на выходных: события, активности, сообщество.',
    valueEn: 'What to do tonight or this weekend: events, activities, community.',
    icon: CalendarDays,
    color: '#0EA5E9',
    services: [
      { id: 'event-live',   path: APP_ROUTES.EVENTS,                    labelRu: 'События',      labelEn: 'Events',           icon: CalendarDays, status: 'available', verticalId: 'event' },
      { id: 'experience-live', path: EXPERIENCES_URL,                   labelRu: 'Впечатления',  labelEn: 'Experiences',      icon: Compass,      status: 'available', verticalId: 'experience' },
      { id: 'water-live',   path: `${EXPERIENCES_URL}?type=activity`,   labelRu: 'Активности',   labelEn: 'Activities',       icon: Waves,        status: 'available', verticalId: 'water_activity' },
      { id: 'community',    path: APP_ROUTES.HOME,                      labelRu: 'Сообщество',   labelEn: 'Community',        icon: Users,        status: 'soon' },
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
      { id: 'wedding', path: APP_ROUTES.WEDDING, labelRu: 'Свадьбы', labelEn: 'Weddings', icon: CalendarDays, status: 'available' },
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
      { id: 'rent-short',   path: APP_ROUTES.PROPERTY_RENT_SHORT, labelRu: 'Краткосрочная аренда', labelEn: 'Short rent', icon: KeyRound, status: 'available' },
      { id: 'rent-long',    path: APP_ROUTES.PROPERTY_RENT_LONG,  labelRu: 'Долгосрочная аренда',  labelEn: 'Long rent',  icon: HomeIcon, status: 'available' },
      { id: 'offplan',      path: APP_ROUTES.OFFPLAN,     labelRu: 'Новостройки',    labelEn: 'Off-plan',     icon: Building2, status: 'available' },
      { id: 'resale',       path: APP_ROUTES.RESALE,      labelRu: 'Вторичка',       labelEn: 'Resale',       icon: Building2, status: 'available' },
      { id: 'developers',   path: APP_ROUTES.DEVELOPERS,  labelRu: 'Застройщики',    labelEn: 'Developers',   icon: Users,     status: 'available' },
      { id: 'business-invest', path: APP_ROUTES.INVEST_BUSINESS, labelRu: 'Бизнес и франшизы', labelEn: 'Business & franchises', icon: Briefcase, status: 'available' },
      { id: 'roi-hub',      path: APP_ROUTES.INVEST_DASHBOARD, labelRu: 'Портфель и ROI', labelEn: 'Portfolio & ROI', icon: BarChart3, status: 'available' },
      { id: 'due-diligence',path: APP_ROUTES.INVEST_KNOWLEDGE, labelRu: 'База знаний',    labelEn: 'Knowledge base', icon: BookOpen, status: 'available' },
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
  // IA: Halal & Faith stays under the Legal surface (six surfaces / canon 02
  // category 13). Moving this pillar to Live requires PROJECT.md + IA doc
  // alignment and a DB `group_id` migration — not a frontend-only rename.
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
      {
        id: 'halal-persona',
        path: APP_ROUTES.HALAL_PERSONA,
        labelRu: 'Халяль-путешественник',
        labelEn: 'Halal traveller hub',
        icon: Compass,
        status: 'available',
        jtbdClusters: ['I'],
      },
      {
        id: 'halal-stay',
        path: APP_ROUTES.HALAL_STAY,
        labelRu: 'Жильё с учётом практик',
        labelEn: 'Halal-friendly stay',
        icon: HomeIcon,
        status: 'available',
        jtbdClusters: ['A', 'I'],
      },
      {
        id: 'halal-dining',
        path: APP_ROUTES.RESTAURANTS,
        labelRu: 'Рестораны (халяль)',
        labelEn: 'Halal dining',
        icon: Utensils,
        status: 'available',
        jtbdClusters: ['I'],
      },
      {
        id: 'halal-knowledge',
        path: APP_ROUTES.KNOWLEDGE,
        labelRu: 'Вера и обычаи',
        labelEn: 'Faith & customs guides',
        icon: BookOpen,
        status: 'available',
        jtbdClusters: ['I'],
      },
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
 * a guest doesn't accidentally see operator canvases). "Canvas" is the app
 * shell (Home/Discover/Operate/Wallet/Me/Admin) — see `src/types/canvas.ts`
 * — distinct from the content "cluster"/"surface" defined above.
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

// ─────────────────────────────────────────────────────────────────────────
// Life Situations (20) — static SSOT mirror of `public.life_situations` seed
// ─────────────────────────────────────────────────────────────────────────

export const LIFE_SITUATIONS: LifeSituationEntry[] = [
  // Arrival
  { code: 'arrival',        titleRu: 'Приезд',                  titleEn: 'Arrival',           icon: 'Plane',         color: '#3B82F6', priority: 100, isActive: true },
  { code: 'tourist',        titleRu: 'Турист',                  titleEn: 'Tourist',           icon: 'Camera',        color: '#06B6D4', priority: 90,  isActive: true },
  { code: 'first_time',     titleRu: 'Впервые на Пхукете',      titleEn: 'First time',        icon: 'MapPin',        color: '#06B6D4', priority: 85,  isActive: true },
  { code: 'transit',        titleRu: 'Короткий визит',          titleEn: 'Short stay',        icon: 'Clock',         color: '#0EA5E9', priority: 70,  isActive: true },
  // Live
  { code: 'living',         titleRu: 'Жизнь на острове',        titleEn: 'Living here',       icon: 'Home',          color: '#10B981', priority: 100, isActive: true },
  { code: 'resident',       titleRu: 'Резидент',                titleEn: 'Resident',          icon: 'Building',      color: '#10B981', priority: 95,  isActive: true },
  { code: 'family',         titleRu: 'Переезд семьёй',          titleEn: 'Family relocation', icon: 'Users',         color: '#F472B6', priority: 90,  isActive: true },
  { code: 'pet_owner',      titleRu: 'С питомцем',              titleEn: 'With a pet',        icon: 'PawPrint',      color: '#A78BFA', priority: 75,  isActive: true },
  { code: 'health',         titleRu: 'Здоровье и лечение',      titleEn: 'Health & wellness', icon: 'Stethoscope',   color: '#EC4899', priority: 80,  isActive: true },
  { code: 'leisure',        titleRu: 'Активности и досуг',      titleEn: 'Leisure',           icon: 'Compass',       color: '#22C55E', priority: 70,  isActive: true },
  { code: 'food',           titleRu: 'Еда и доставка',          titleEn: 'Food & delivery',   icon: 'Utensils',      color: '#F59E0B', priority: 65,  isActive: true },
  { code: 'nightlife',      titleRu: 'Ночная жизнь',            titleEn: 'Nightlife',         icon: 'Music',         color: '#8B5CF6', priority: 55,  isActive: true },
  // Manage
  { code: 'managing',       titleRu: 'Управление объектом',     titleEn: 'Managing property', icon: 'Building2',     color: '#0891B2', priority: 100, isActive: true },
  { code: 'property_owner', titleRu: 'Собственник',             titleEn: 'Property owner',    icon: 'KeyRound',      color: '#0891B2', priority: 95,  isActive: true },
  { code: 'business',       titleRu: 'Бизнес и операции',       titleEn: 'Business',          icon: 'Briefcase',     color: '#6366F1', priority: 85,  isActive: true },
  // Invest
  { code: 'investing',      titleRu: 'Инвестирование',          titleEn: 'Investing',         icon: 'TrendingUp',    color: '#8B5CF6', priority: 100, isActive: true },
  { code: 'investor',       titleRu: 'Инвестор',                titleEn: 'Investor',          icon: 'LineChart',     color: '#A855F7', priority: 95,  isActive: true },
  // Legal
  { code: 'settling',       titleRu: 'Документы и обустройство', titleEn: 'Settling in',      icon: 'FileText',      color: '#6366F1', priority: 95,  isActive: true },
  { code: 'visa_renewal',   titleRu: 'Виза и продление',        titleEn: 'Visa renewal',      icon: 'Stamp',         color: '#6366F1', priority: 100, isActive: true },
  { code: 'relocation',     titleRu: 'Релокация',               titleEn: 'Relocation',        icon: 'Truck',         color: '#14B8A6', priority: 90,  isActive: true },
  // Build
  { code: 'developer',      titleRu: 'Застройщик',              titleEn: 'Developer',         icon: 'HardHat',       color: '#F97316', priority: 100, isActive: true },
];

/**
 * Cluster ↔ life-situation links — mirrors migration 20260424012840 §6 seed.
 * Codes that don't exist in `LIFE_SITUATIONS` are silently skipped (matches
 * the migration's `JOIN situations s ON s.code = p.situation_code` semantic).
 */
export const CLUSTER_LIFE_SITUATIONS: ClusterLifeSituationLink[] = [
  // ARRIVE
  { clusterId: 'arrive', situationCode: 'arrival',        weight: 100, isPrimary: true  },
  { clusterId: 'arrive', situationCode: 'tourist',        weight: 90,  isPrimary: true  },
  { clusterId: 'arrive', situationCode: 'first_time',     weight: 90,  isPrimary: false },
  { clusterId: 'arrive', situationCode: 'transit',        weight: 80,  isPrimary: false },
  // LIVE
  { clusterId: 'live',   situationCode: 'living',         weight: 100, isPrimary: true  },
  { clusterId: 'live',   situationCode: 'resident',       weight: 95,  isPrimary: true  },
  { clusterId: 'live',   situationCode: 'family',         weight: 90,  isPrimary: false },
  { clusterId: 'live',   situationCode: 'pet_owner',      weight: 80,  isPrimary: false },
  { clusterId: 'live',   situationCode: 'health',         weight: 85,  isPrimary: false },
  { clusterId: 'live',   situationCode: 'leisure',        weight: 75,  isPrimary: false },
  { clusterId: 'live',   situationCode: 'food',           weight: 70,  isPrimary: false },
  { clusterId: 'live',   situationCode: 'nightlife',      weight: 60,  isPrimary: false },
  // MANAGE
  { clusterId: 'manage', situationCode: 'managing',       weight: 100, isPrimary: true  },
  { clusterId: 'manage', situationCode: 'property_owner', weight: 95,  isPrimary: true  },
  { clusterId: 'manage', situationCode: 'business',       weight: 90,  isPrimary: false },
  // INVEST
  { clusterId: 'invest', situationCode: 'investing',      weight: 100, isPrimary: true  },
  { clusterId: 'invest', situationCode: 'investor',       weight: 95,  isPrimary: true  },
  { clusterId: 'invest', situationCode: 'business',       weight: 70,  isPrimary: false },
  // LEGAL
  { clusterId: 'legal',  situationCode: 'settling',       weight: 95,  isPrimary: true  },
  { clusterId: 'legal',  situationCode: 'visa_renewal',   weight: 100, isPrimary: true  },
  { clusterId: 'legal',  situationCode: 'relocation',     weight: 90,  isPrimary: false },
  { clusterId: 'legal',  situationCode: 'business',       weight: 70,  isPrimary: false },
  // BUILD
  { clusterId: 'build',  situationCode: 'developer',      weight: 100, isPrimary: true  },
  { clusterId: 'build',  situationCode: 'business',       weight: 60,  isPrimary: false },
];

/**
 * Dominant catalog cluster for a life-situation code (SSOT `CLUSTER_LIFE_SITUATIONS`).
 * Used for marketing deep links (`/discover?cluster=…`) when the same code maps to several clusters.
 */
export function resolvePrimaryClusterForLifeSituation(situationCode: string): ClusterId | null {
  const links = CLUSTER_LIFE_SITUATIONS.filter((l) => l.situationCode === situationCode);
  if (links.length === 0) return null;
  const sorted = [...links].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return String(a.clusterId).localeCompare(String(b.clusterId));
  });
  return sorted[0].clusterId;
}

/** Index `LIFE_SITUATIONS` by code for O(1) lookup. */
export const LIFE_SITUATIONS_BY_CODE: Record<string, LifeSituationEntry> = Object.fromEntries(
  LIFE_SITUATIONS.map((s) => [s.code, s]),
);

/**
 * Build the per-cluster life-situation map from the static SSOT.
 * Used as the fallback in `useCatalogFromDB` when the DB has no live join data.
 */
export function buildStaticClusterLifeSituationsMap(): Record<ClusterId, LifeSituationEntry[]> {
  const map: Record<string, LifeSituationEntry[]> = {};
  for (const link of CLUSTER_LIFE_SITUATIONS) {
    const situation = LIFE_SITUATIONS_BY_CODE[link.situationCode];
    if (!situation || !situation.isActive) continue;
    const arr = map[link.clusterId] ?? [];
    arr.push(situation);
    map[link.clusterId] = arr;
  }
  return map as Record<ClusterId, LifeSituationEntry[]>;
}
