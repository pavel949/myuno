/**
 * @module catalog/taxonomy
 * @description **Single Source of Truth** for the public service catalog.
 *
 * Hierarchy:
 *
 *   Cluster (6)  →  Category (18)  →  Service / App (68 total · 67 available)
 *   Categories per cluster: arrive=3 · live=10 · manage=0 (workspace) · invest=1 · legal=3 · build=1
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
 * (DB) vs `13 / 31 / 9 / 11 / 4` here (static service counts per cluster,
 * recounted 2026-06-15). DB reconciliation deferred until a
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
  Calendar, BarChart3, Wrench, PenTool, DollarSign,
  Building, Search, LineChart, Palette, Scissors, Crown, Bike, Shirt,
  Compass, Anchor, Dumbbell, CalendarDays, GraduationCap, PawPrint,
  Hammer, Wind, TreePine, Bug, KeyRound, Warehouse, Route, Waves, Pill, Flower2,
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
  // Live (6) — повседневная жизнь, одна зонтик-категория для дома
  | 'cat-home-services'      // Услуги для дома (cleaning + repair + outdoor + storage)
  | 'cat-food-delivery'      // Еда и доставка
  | 'cat-health-wellness'    // Здоровье и велнес
  | 'cat-family-kids'        // Семья и дети
  | 'cat-pet-services'       // Уход за питомцами
  | 'cat-leisure'            // Досуг, события, подарки, сообщество (вкл. wedding + flowers)
  // Manage (0 public — workspace-only cluster, see /mc/* routes)
  // Invest (1)
  | 'cat-real-estate'
  // Legal (3)
  | 'cat-business-legal' | 'cat-finance' | 'cat-halal-faith'
  // Build (1)
  | 'cat-partner-portal';

/**
 * Service availability state.
 *  - `available` — fully wired: dedicated page + booking form.
 *  - `soon`      — visible in catalog, "Coming soon" badge, click goes nowhere meaningful.
 *  - `pro`       — gated to professional / workspace users.
 *  - `info`      — informational entry that maps to a generic `/services?category=X` hub
 *                   (or a coordinator WhatsApp link) rather than a per-service booking page.
 *                   Used for trades like laundry/plumbing/handyman where the path is the
 *                   coordinator-route, not a self-service form. UI hides booking CTA for these.
 */
export type ServiceStatus = 'available' | 'soon' | 'pro' | 'info';

export type Audience = 'public' | 'workspace';

/**
 * Lifecycle stages — when in the user's journey this service is relevant.
 * Codes from `docs/canonical/02-service-catalogue-v2.md §0 Легенда`.
 */
export type LifecycleStage =
  | 'scout'      // researching Phuket from abroad, has not arrived
  | 'tourist'    // here for ≤ 30 days
  | 'snowbird'   // seasonal 2–6 months
  | 'nomad'      // remote workers, rolling stays
  | 'settler'    // moved within the last 12 months, still setting up
  | 'resident'   // > 12 months, established
  | 'absentee'   // owns assets, lives abroad
  | 'returnee'   // came back after extended absence
  | 'all';

/**
 * Functional role tags — what the user is _doing_ when they pick the service.
 * Codes from `docs/canonical/02-service-catalogue-v2.md §0 Легенда`.
 */
export type RoleTag =
  | 'consumer'         // buying a one-off service for themselves
  | 'resident-user'    // recurring user (vs one-off tourist)
  | 'investor-passive' // capital deployment, hands-off
  | 'investor-active'  // active investor / deal flow
  | 'operator'         // operating an asset or business
  | 'provider'         // selling services on the platform
  | 'all';

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
  /** Personas that should see this in personalized feeds — runtime UserPersona ids. */
  personaTags?: string[];
  /** JTBD cluster codes (A..J) from Master Taxonomy v1.0. */
  jtbdClusters?: string[];
  /** Lifecycle stages this service serves. Required for AI routing per canon §22. */
  lifecycleStages?: LifecycleStage[];
  /** Functional role tags. Required for AI routing per canon §22. */
  roleTags?: RoleTag[];
  /**
   * Life-situation codes this service maps to (codes from LIFE_SITUATIONS).
   *
   * This is the SSOT for the `entity_type='service'` rows in `catalog_life_map`.
   * When non-empty, the validate-catalog-life-map script enforces:
   *   - every code in this list exists in LIFE_SITUATIONS,
   *   - every (service.id, code) pair has a matching DB row after sync.
   *
   * Vertical entities (property/yacht/transfer/etc.) are seeded separately by
   * `seed_catalog_life_map_full_coverage.sql` and do not need entries here.
   */
  situationCodes?: string[];
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
// Categories with Services (18 categories, 68 services · 67 available)
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
      { id: 'transfer',   path: APP_ROUTES.AIRPORT_TRANSFER, labelRu: 'Трансферы',  labelEn: 'Transfers',  icon: PlaneLanding, status: 'available', verticalId: 'transfer', personaTags: ['tourist','relocation','family','nomad'], jtbdClusters: ['A'], lifecycleStages: ['tourist','snowbird','settler','returnee'], roleTags: ['consumer'], situationCodes: ['arrival','first_time','transit','tourist','emergency'] },
      { id: 'fast-track', path: APP_ROUTES.FAST_TRACK,        labelRu: 'Fast Track',  labelEn: 'Fast Track', icon: Zap,         status: 'available', personaTags: ['tourist','business','relocation'], jtbdClusters: ['A'], lifecycleStages: ['tourist','snowbird'], roleTags: ['consumer'], situationCodes: ['arrival','tourist','transit'] },
      { id: 'vehicle',    path: APP_ROUTES.TRANSPORT,         labelRu: 'Авто и байки',labelEn: 'Car & bike', icon: Car,         status: 'available', verticalId: 'vehicle', personaTags: ['tourist','resident','nomad','active','family'], jtbdClusters: ['A'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident'], roleTags: ['consumer'], situationCodes: ['arrival','tourist','living','resident','leisure'] },
      { id: 'sim',        path: APP_ROUTES.SIM_START,         labelRu: 'SIM-карты',   labelEn: 'SIM cards',  icon: Smartphone,  status: 'available', personaTags: ['tourist','relocation','nomad'], jtbdClusters: ['A'], lifecycleStages: ['tourist','snowbird','settler'], roleTags: ['consumer'], situationCodes: ['arrival','tourist','first_time','transit'] },
      { id: 'exchange',   path: APP_ROUTES.EXCHANGE,          labelRu: 'Курсы валют', labelEn: 'Exchange',   icon: ArrowLeftRight, status: 'available', personaTags: ['tourist','resident','nomad','investor','business'], jtbdClusters: ['A'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident','absentee'], roleTags: ['consumer','investor-passive'], situationCodes: ['arrival','tourist','investing','investor'] },
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
      { id: 'experience', path: EXPERIENCES_URL,                          labelRu: 'Впечатления',  labelEn: 'Experiences',   icon: Compass,      status: 'available', verticalId: 'experience', personaTags: ['tourist','active','couple','family','nightlife'], jtbdClusters: ['A','I'], lifecycleStages: ['tourist','snowbird','nomad','resident'], roleTags: ['consumer'], situationCodes: ['tourist','leisure','first_time','transit'] },
      { id: 'tours',      path: `${EXPERIENCES_URL}?type=tour`,           labelRu: 'Туры',          labelEn: 'Tours',         icon: Route,        status: 'available', personaTags: ['tourist','family','active'], jtbdClusters: ['A','I'], lifecycleStages: ['tourist','snowbird'], roleTags: ['consumer'], situationCodes: ['tourist','leisure','first_time'] },
      { id: 'water',      path: `${EXPERIENCES_URL}?type=activity`,       labelRu: 'Вода и активности', labelEn: 'Water & activities', icon: Waves, status: 'available', verticalId: 'water_activity', personaTags: ['tourist','active','family'], jtbdClusters: ['A','I'], lifecycleStages: ['tourist','snowbird','resident'], roleTags: ['consumer'], situationCodes: ['tourist','leisure'] },
      { id: 'yacht',      path: APP_ROUTES.YACHTS,                        labelRu: 'Яхты',          labelEn: 'Yachts',        icon: Anchor,       status: 'available', verticalId: 'yacht', personaTags: ['tourist','couple','nightlife','business','active'], jtbdClusters: ['A','I'], lifecycleStages: ['tourist','snowbird','nomad','resident','absentee'], roleTags: ['consumer'], situationCodes: ['tourist','leisure','nightlife'] },
      { id: 'event',      path: APP_ROUTES.EVENTS,                        labelRu: 'События',       labelEn: 'Events',        icon: CalendarDays, status: 'available', verticalId: 'event', personaTags: ['tourist','nightlife','couple','active'], jtbdClusters: ['A','I'], lifecycleStages: ['tourist','snowbird','nomad','resident'], roleTags: ['consumer'], situationCodes: ['tourist','leisure','nightlife'] },
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
      { id: 'sos',           path: APP_ROUTES.SOS,           labelRu: 'SOS',           labelEn: 'SOS',           icon: AlertTriangle, status: 'available', personaTags: ['tourist','resident','family','pet_owner','property_owner','investor','relocation'], jtbdClusters: ['H','A'], lifecycleStages: ['all'], roleTags: ['all'], situationCodes: ['emergency'] },
      { id: 'vip-concierge', path: APP_ROUTES.VIP_CONCIERGE, labelRu: 'VIP-консьерж',   labelEn: 'VIP Concierge', icon: Crown,         status: 'available', personaTags: ['tourist','couple','business','nightlife','family','investor'], jtbdClusters: ['H','I'], lifecycleStages: ['tourist','snowbird','nomad','absentee'], roleTags: ['consumer','investor-active'], situationCodes: ['emergency','arrival','tourist'] },
      { id: 'support',       path: APP_ROUTES.SUPPORT,       labelRu: 'Поддержка',      labelEn: 'Support',       icon: LifeBuoy,      status: 'available', personaTags: ['tourist','resident','family','pet_owner','property_owner','investor','business','relocation'], jtbdClusters: ['H','A'], lifecycleStages: ['all'], roleTags: ['all'], situationCodes: ['emergency','arrival','living','resident'] },
    ],
  },

  // ============== LIVE — повседневность ==============
  // 2026-06-16 consolidation: 4 home-* categories (cleaning / repair / outdoor /
  // logistics) collapsed into one "Услуги для дома" umbrella. Before, the Live
  // cluster carried 10 categories, 4 of them about the home with overlapping
  // semantics and a 1-service `cat-home-logistics` orphan. Users couldn't tell
  // why "уборка" and "ремонт" were separate top-level rubrics when the deeper
  // taxonomy on /services already covers everything. `flowers` was the one
  // member of the old `cat-home-outdoor` that isn't maintenance — it moved
  // into `cat-leisure` as a gift/lifestyle item.
  {
    id: 'cat-home-services',
    clusterId: 'live',
    labelRu: 'Услуги для дома',
    labelEn: 'Home services',
    valueRu: 'Уборка, ремонт, сантехника, электрика, сад, хранение — одной точкой.',
    valueEn: 'Cleaning, repair, plumbing, electrical, garden, storage — one umbrella.',
    icon: Wrench,
    color: '#10B981',
    services: [
      // Cleaning trio
      { id: 'cleaning',     path: APP_ROUTES.CLEANING,                       labelRu: 'Уборка',      labelEn: 'Cleaning',     icon: Sparkles, status: 'available', verticalId: 'cleaning', personaTags: ['resident','family','property_owner','nomad'], jtbdClusters: ['C'], lifecycleStages: ['settler','resident','snowbird','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing','property_owner','departure'] },
      { id: 'laundry',      path: `${SERVICES_URL}?category=laundry`,        labelRu: 'Прачечная',   labelEn: 'Laundry',      icon: Shirt,    status: 'info',      personaTags: ['tourist','resident','nomad','family'], jtbdClusters: ['C'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident'], roleTags: ['consumer'], situationCodes: ['living','resident','tourist'] },
      { id: 'pest-control', path: `${SERVICES_URL}?category=pest-control`,   labelRu: 'Дезинсекция', labelEn: 'Pest control', icon: Bug,      status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
      // Repair / trade trades (former cat-home-repair)
      { id: 'handyman',   path: `${SERVICES_URL}?category=handyman`,   labelRu: 'Мастер на час', labelEn: 'Handyman',    icon: Hammer,   status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
      { id: 'plumbing',   path: `${SERVICES_URL}?category=plumbing`,   labelRu: 'Сантехника',    labelEn: 'Plumbing',    icon: Wrench,   status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
      { id: 'electrical', path: `${SERVICES_URL}?category=electrical`, labelRu: 'Электрика',     labelEn: 'Electrical',  icon: Plug,     status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
      { id: 'ac-repair',  path: `${SERVICES_URL}?category=ac-repair`,  labelRu: 'Кондиционеры',  labelEn: 'AC repair',   icon: Wind,     status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
      { id: 'locksmith',  path: `${SERVICES_URL}?category=locksmith`,  labelRu: 'Замки',         labelEn: 'Locksmith',   icon: KeyRound, status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','H'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing','emergency'] },
      // Outdoor
      { id: 'gardening',  path: `${SERVICES_URL}?category=gardening`,  labelRu: 'Сад',           labelEn: 'Gardening',   icon: TreePine, status: 'info',      personaTags: ['resident','property_owner','family'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
      // Storage (former cat-home-logistics)
      { id: 'storage',    path: `${SERVICES_URL}?category=storage`,    labelRu: 'Хранение',      labelEn: 'Storage',     icon: Warehouse,status: 'info',      personaTags: ['resident','nomad','relocation','family'], jtbdClusters: ['C','B'], lifecycleStages: ['settler','resident','nomad','snowbird'], roleTags: ['consumer'], situationCodes: ['living','resident','departure','relocation'] },
      // Home-services hub: deep catalogue of trades (handyman + plumber + electrician +
      // AC + cleaning + pool + garden + pest + security + moving) via
      // src/lib/config/homeServiceFunctions.ts. Keeps the LayoutGrid-of-trades
      // pattern as an explicit umbrella inside the umbrella category.
      { id: 'services',   path: SERVICES_URL,                          labelRu: 'Каталог трейдов', labelEn: 'Trades catalogue', icon: Wrench, status: 'info', personaTags: ['resident','property_owner','family','nomad'], jtbdClusters: ['C','F'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','operator'], situationCodes: ['living','resident','managing'] },
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
      { id: 'restaurant', path: APP_ROUTES.RESTAURANTS, labelRu: 'Рестораны', labelEn: 'Restaurants', icon: Utensils,    status: 'available', verticalId: 'restaurant', personaTags: ['tourist','resident','couple','family','nightlife','business','active'], jtbdClusters: ['I'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident'], roleTags: ['consumer'], situationCodes: ['food','living','resident','tourist','nightlife','leisure'] },
      { id: 'delivery',   path: APP_ROUTES.DELIVERY,    labelRu: 'Доставка',  labelEn: 'Delivery',    icon: Bike,        status: 'available', personaTags: ['resident','nomad','family','nightlife'], jtbdClusters: ['I'], lifecycleStages: ['settler','resident','nomad','snowbird'], roleTags: ['consumer'], situationCodes: ['food','living','resident'] },
      { id: 'market',     path: APP_ROUTES.MARKET,      labelRu: 'Маркет',    labelEn: 'Market',      icon: ShoppingBag, status: 'available', personaTags: ['resident','family','couple','active','nomad'], jtbdClusters: ['I'], lifecycleStages: ['settler','resident','snowbird','nomad'], roleTags: ['consumer'], situationCodes: ['food','living','resident'] },
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
      { id: 'medical',   path: APP_ROUTES.MEDICAL,   labelRu: 'Медицина',  labelEn: 'Medical',   icon: Stethoscope, status: 'available', verticalId: 'medical', personaTags: ['tourist','resident','family','active','pet_owner'], jtbdClusters: ['C','H'], lifecycleStages: ['all'], roleTags: ['consumer'], situationCodes: ['health','family','emergency','living','resident'] },
      { id: 'pharmacy',  path: APP_ROUTES.PHARMACY,  labelRu: 'Аптеки',    labelEn: 'Pharmacy',  icon: Pill,        status: 'available', verticalId: 'pharmacy', personaTags: ['tourist','resident','family','pet_owner'], jtbdClusters: ['C'], lifecycleStages: ['all'], roleTags: ['consumer'], situationCodes: ['health','family','living','resident','emergency','settling'] },
      { id: 'beauty',    path: APP_ROUTES.BEAUTY,    labelRu: 'Красота',   labelEn: 'Beauty',    icon: Scissors,    status: 'available', verticalId: 'beauty', personaTags: ['tourist','resident','couple','nightlife','family'], jtbdClusters: ['I'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident'], roleTags: ['consumer'], situationCodes: ['health','leisure','living','resident'] },
      { id: 'fitness',   path: APP_ROUTES.FITNESS,   labelRu: 'Фитнес',    labelEn: 'Fitness',   icon: Dumbbell,    status: 'available', verticalId: 'fitness', personaTags: ['tourist','resident','active','nomad','nightlife'], jtbdClusters: ['I'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident'], roleTags: ['consumer'], situationCodes: ['health','living','resident','leisure'] },
      { id: 'insurance', path: APP_ROUTES.INSURANCE, labelRu: 'Страховка', labelEn: 'Insurance', icon: ShieldCheck, status: 'available', verticalId: 'insurance', personaTags: ['resident','family','property_owner','investor','relocation','nomad'], jtbdClusters: ['G','C'], lifecycleStages: ['settler','resident','snowbird','absentee','returnee'], roleTags: ['consumer','investor-passive','operator'], situationCodes: ['health','settling','family','relocation','managing','departure'] },
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
      { id: 'babysitter',     path: APP_ROUTES.BABYSITTER,     labelRu: 'Няни',         labelEn: 'Babysitters',  icon: Baby,          status: 'available', verticalId: 'babysitter', personaTags: ['family','couple','tourist'], jtbdClusters: ['C','I'], lifecycleStages: ['tourist','snowbird','settler','resident'], roleTags: ['consumer'], situationCodes: ['family','living','resident'] },
      { id: 'school-finder',  path: APP_ROUTES.SCHOOL_FINDER,  labelRu: 'Школы',        labelEn: 'School finder',icon: Search,        status: 'available', personaTags: ['family','relocation'], jtbdClusters: ['C','B'], lifecycleStages: ['scout','settler','resident'], roleTags: ['consumer'], situationCodes: ['family','relocation','settling'] },
      { id: 'education',      path: APP_ROUTES.EDUCATION,      labelRu: 'Образование',  labelEn: 'Education',    icon: GraduationCap, status: 'available', verticalId: 'education', personaTags: ['family','resident','relocation','active'], jtbdClusters: ['C'], lifecycleStages: ['settler','resident','snowbird'], roleTags: ['consumer'], situationCodes: ['family','living','resident','settling'] },
      { id: 'kids',           path: APP_ROUTES.KIDS,           labelRu: 'Дети',         labelEn: 'Kids',         icon: Baby,          status: 'available', personaTags: ['family','tourist'], jtbdClusters: ['I','C'], lifecycleStages: ['tourist','snowbird','settler','resident'], roleTags: ['consumer'], situationCodes: ['family','leisure','living'] },
    ],
  },
  {
    // Renamed from "Питомцы" → "Уход за питомцами" so the category header
    // doesn't echo the flagship "Питомцы" service inside it. Same icon
    // (PawPrint) is fine — the icon belongs to the topic, not the label.
    id: 'cat-pet-services',
    clusterId: 'live',
    labelRu: 'Уход за питомцами',
    labelEn: 'Pet care',
    valueRu: 'Уход, ветеринары, груминг, ввоз/вывоз питомца.',
    valueEn: 'Pet care, veterinary, grooming, import/export.',
    icon: PawPrint,
    color: '#A78BFA',
    services: [
      { id: 'pets',       path: APP_ROUTES.PETS,       labelRu: 'Питомцы',    labelEn: 'Pets',        icon: PawPrint, status: 'available', verticalId: 'pet_service', personaTags: ['pet_owner','family'], jtbdClusters: ['C','I'], lifecycleStages: ['tourist','snowbird','settler','resident','absentee'], roleTags: ['consumer'], situationCodes: ['pet_owner','living','resident'] },
      { id: 'veterinary', path: APP_ROUTES.VETERINARY, labelRu: 'Ветеринары', labelEn: 'Veterinary',  icon: Stethoscope, status: 'available', personaTags: ['pet_owner','family'], jtbdClusters: ['C','H'], lifecycleStages: ['settler','resident','snowbird','absentee'], roleTags: ['consumer'], situationCodes: ['pet_owner','emergency','health'] },
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
    valueRu: 'Что делать вечером и на выходных: события, активности, подарки, сообщество.',
    valueEn: 'What to do tonight or this weekend: events, activities, gifts, community.',
    icon: CalendarDays,
    color: '#0EA5E9',
    services: [
      // Cat-leisure (Live cluster) versions of event/experience target residents,
      // not tourists — same listing pages but contextual framing. Labels are
      // intentionally differentiated from the cat-tourism originals (line ~370)
      // so /discover-from-Live doesn't show two identically-named cards.
      { id: 'event-live',   path: APP_ROUTES.EVENTS,                    labelRu: 'Местные события',     labelEn: 'Local events',      icon: CalendarDays, status: 'available', verticalId: 'event', personaTags: ['resident','couple','nightlife','active','family'], jtbdClusters: ['I'], lifecycleStages: ['settler','resident','nomad','snowbird'], roleTags: ['consumer'], situationCodes: ['leisure','living','resident','nightlife'] },
      { id: 'experience-live', path: EXPERIENCES_URL,                   labelRu: 'Локальные впечатления', labelEn: 'Local experiences', icon: Compass,      status: 'available', verticalId: 'experience', personaTags: ['resident','couple','active','family','nightlife'], jtbdClusters: ['I'], lifecycleStages: ['settler','resident','nomad','snowbird'], roleTags: ['consumer'], situationCodes: ['leisure','living','resident'] },
      { id: 'water-live',   path: `${EXPERIENCES_URL}?type=activity`,   labelRu: 'Активности',   labelEn: 'Activities',       icon: Waves,        status: 'available', verticalId: 'water_activity', personaTags: ['resident','active','family'], jtbdClusters: ['I'], lifecycleStages: ['settler','resident','nomad','snowbird'], roleTags: ['consumer'], situationCodes: ['leisure','living','resident'] },
      { id: 'community',    path: APP_ROUTES.HOME,                      labelRu: 'Сообщество',   labelEn: 'Community',        icon: Users,        status: 'soon', personaTags: ['resident','family','relocation','nomad'], jtbdClusters: ['I','C'], lifecycleStages: ['settler','resident','nomad','snowbird','returnee'], roleTags: ['consumer','resident-user'], situationCodes: ['living','resident','family'] },
      // Wedding (moved from former cat-wedding-events, 2026-06-16) — destination
      // ceremonies and family celebrations fit the lifestyle/leisure umbrella.
      { id: 'wedding',      path: APP_ROUTES.WEDDING, labelRu: 'Свадьбы', labelEn: 'Weddings', icon: CalendarDays, status: 'available', personaTags: ['couple','family','business','tourist'], jtbdClusters: ['I'], lifecycleStages: ['tourist','snowbird','settler','resident'], roleTags: ['consumer'], situationCodes: ['family','leisure'] },
      // Flowers (moved from former cat-home-outdoor, 2026-06-16) — gift/lifestyle,
      // not home maintenance. Lives next to wedding and event-live where the
      // intent is celebration rather than property upkeep.
      { id: 'flowers',      path: APP_ROUTES.FLOWERS,                   labelRu: 'Цветы',  labelEn: 'Flowers',   icon: Flower2,  status: 'available', verticalId: 'flower', personaTags: ['tourist','resident','couple','family','business'], jtbdClusters: ['I'], lifecycleStages: ['tourist','snowbird','settler','resident'], roleTags: ['consumer'], situationCodes: ['leisure','living','resident'] },
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
      { id: 'property',     path: APP_ROUTES.PROPERTY,    labelRu: 'Поиск',          labelEn: 'Property',     icon: Search,    status: 'available', verticalId: 'property', personaTags: ['investor','property_owner','family','relocation','resident'], jtbdClusters: ['D','E'], lifecycleStages: ['scout','settler','resident','absentee','returnee'], roleTags: ['consumer','investor-active','investor-passive','operator'], situationCodes: ['investing','investor','managing','property_owner','relocation','departure'] },
      { id: 'rent-short',   path: APP_ROUTES.PROPERTY_RENT_SHORT, labelRu: 'Краткосрочная аренда', labelEn: 'Short rent', icon: KeyRound, status: 'available', personaTags: ['tourist','relocation','nomad','family'], jtbdClusters: ['D','A'], lifecycleStages: ['scout','tourist','snowbird','settler'], roleTags: ['consumer'], situationCodes: ['tourist','first_time','transit','relocation'] },
      { id: 'rent-long',    path: APP_ROUTES.PROPERTY_RENT_LONG,  labelRu: 'Долгосрочная аренда',  labelEn: 'Long rent',  icon: HomeIcon, status: 'available', personaTags: ['resident','family','relocation','nomad'], jtbdClusters: ['C','D'], lifecycleStages: ['settler','resident','snowbird','nomad'], roleTags: ['consumer'], situationCodes: ['relocation','living','resident','family','settling'] },
      { id: 'offplan',      path: APP_ROUTES.OFFPLAN,     labelRu: 'Новостройки',    labelEn: 'Off-plan',     icon: Building2, status: 'available', personaTags: ['investor','property_owner'], jtbdClusters: ['D','E'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','investor-passive'], situationCodes: ['investing','investor','developer'] },
      { id: 'resale',       path: APP_ROUTES.RESALE,      labelRu: 'Вторичка',       labelEn: 'Resale',       icon: Building2, status: 'available', personaTags: ['investor','property_owner','family','relocation'], jtbdClusters: ['D','E'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','consumer'], situationCodes: ['investing','investor','departure'] },
      { id: 'developers',   path: APP_ROUTES.DEVELOPERS,  labelRu: 'Застройщики',    labelEn: 'Developers',   icon: Users,     status: 'available', personaTags: ['investor','property_owner','real_estate_developer'], jtbdClusters: ['D'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','investor-passive','provider'], situationCodes: ['investing','investor','developer'] },
      { id: 'business-invest', path: APP_ROUTES.INVEST_BUSINESS, labelRu: 'Бизнес и франшизы', labelEn: 'Business & franchises', icon: Briefcase, status: 'available', personaTags: ['investor','business','property_owner'], jtbdClusters: ['D','E'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','operator'], situationCodes: ['business','investing','investor'] },
      { id: 'roi-hub',      path: APP_ROUTES.INVEST_DASHBOARD, labelRu: 'Портфель и ROI', labelEn: 'Portfolio & ROI', icon: BarChart3, status: 'available', personaTags: ['investor','property_owner'], jtbdClusters: ['F'], lifecycleStages: ['resident','absentee'], roleTags: ['investor-active','investor-passive','operator'], situationCodes: ['investing','investor','property_owner','managing'] },
      // Renamed from generic "База знаний" (which clashed with the legal
      // knowledge entry below at line ~606) to "Инвест-база знаний" so
      // /discover-from-Invest doesn't show two BookOpen cards with identical
      // labels routing to different content (INVEST_KNOWLEDGE vs KNOWLEDGE).
      { id: 'due-diligence',path: APP_ROUTES.INVEST_KNOWLEDGE, labelRu: 'Инвест-база знаний', labelEn: 'Investment knowledge', icon: BookOpen, status: 'available', personaTags: ['investor','property_owner','business'], jtbdClusters: ['D','G'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','investor-passive'], situationCodes: ['investing','investor'] },
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
      { id: 'visa',        path: APP_ROUTES.VISA_IMMIGRATION,  labelRu: 'Визы',        labelEn: 'Visas',       icon: Globe,      status: 'available', personaTags: ['tourist','resident','relocation','nomad','family','business'], jtbdClusters: ['G'], lifecycleStages: ['tourist','snowbird','nomad','settler','resident'], roleTags: ['consumer'], situationCodes: ['settling','visa_renewal','relocation','departure','arrival'] },
      { id: 'legal',       path: APP_ROUTES.LEGAL,             labelRu: 'Юристы',      labelEn: 'Legal',       icon: Scale,      status: 'available', verticalId: 'legal', personaTags: ['resident','property_owner','investor','business','family','relocation'], jtbdClusters: ['G'], lifecycleStages: ['all'], roleTags: ['consumer','operator','investor-active','investor-passive'], situationCodes: ['settling','visa_renewal','investing','departure','managing','business','emergency'] },
      { id: 'contract-ai', path: APP_ROUTES.CONTRACT_ANALYSIS, labelRu: 'ContractAI',   labelEn: 'ContractAI',  icon: FileSearch, status: 'available', personaTags: ['resident','property_owner','investor','business'], jtbdClusters: ['G','E'], lifecycleStages: ['settler','resident','absentee'], roleTags: ['consumer','investor-active','investor-passive','operator'], situationCodes: ['settling','investing','business','managing'] },
      { id: 'relocate',    path: APP_ROUTES.RELOCATE,          labelRu: 'Релокация',   labelEn: 'Relocation',  icon: Briefcase,  status: 'available', personaTags: ['relocation','family','nomad','business'], jtbdClusters: ['B','C'], lifecycleStages: ['scout','settler','returnee'], roleTags: ['consumer'], situationCodes: ['relocation','settling'] },
      { id: 'knowledge',   path: APP_ROUTES.KNOWLEDGE,         labelRu: 'База знаний', labelEn: 'Knowledge',   icon: BookOpen,   status: 'available', personaTags: ['tourist','resident','property_owner','investor','family','relocation','business'], jtbdClusters: ['G'], lifecycleStages: ['all'], roleTags: ['all'], situationCodes: ['settling','visa_renewal','investing','managing'] },
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
      { id: 'banking', path: APP_ROUTES.BANKING, labelRu: 'Банк',     labelEn: 'Banking', icon: Landmark,   status: 'available', verticalId: 'bank', personaTags: ['resident','property_owner','investor','nomad','relocation','business'], jtbdClusters: ['G'], lifecycleStages: ['settler','resident','snowbird','absentee'], roleTags: ['consumer','investor-passive','investor-active','operator'], situationCodes: ['settling','visa_renewal','investing','investor','business','managing','departure'] },
      { id: 'tax',     path: APP_ROUTES.TAX_NAV, labelRu: 'Налоги',   labelEn: 'Taxes',   icon: Calculator, status: 'available', personaTags: ['resident','property_owner','investor','business'], jtbdClusters: ['G'], lifecycleStages: ['settler','resident','absentee','returnee'], roleTags: ['consumer','investor-passive','investor-active','operator'], situationCodes: ['settling','investing','managing','business','property_owner'] },
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
        personaTags: ['tourist','resident','family'],
        jtbdClusters: ['I'],
        lifecycleStages: ['tourist','snowbird','settler','resident'],
        roleTags: ['consumer'],
        situationCodes: ['arrival','tourist','first_time','settling'],
      },
      {
        id: 'halal-stay',
        path: APP_ROUTES.HALAL_STAY,
        labelRu: 'Жильё с учётом практик',
        labelEn: 'Halal-friendly stay',
        icon: HomeIcon,
        status: 'available',
        personaTags: ['tourist','resident','family','relocation'],
        jtbdClusters: ['A', 'I'],
        lifecycleStages: ['tourist','snowbird','settler','resident'],
        roleTags: ['consumer'],
        situationCodes: ['arrival','tourist','living','resident'],
      },
      {
        id: 'halal-dining',
        path: APP_ROUTES.RESTAURANTS,
        labelRu: 'Рестораны (халяль)',
        labelEn: 'Halal dining',
        icon: Utensils,
        status: 'available',
        personaTags: ['tourist','resident','family','couple'],
        jtbdClusters: ['I'],
        lifecycleStages: ['tourist','snowbird','settler','resident'],
        roleTags: ['consumer'],
        situationCodes: ['tourist','living','resident','food'],
      },
      {
        id: 'halal-knowledge',
        path: APP_ROUTES.KNOWLEDGE,
        labelRu: 'Вера и обычаи',
        labelEn: 'Faith & customs guides',
        icon: BookOpen,
        status: 'available',
        personaTags: ['tourist','resident','family','relocation'],
        jtbdClusters: ['I','G'],
        lifecycleStages: ['all'],
        roleTags: ['all'],
        situationCodes: ['arrival','first_time','settling'],
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
      { id: 'developer-portal', path: APP_ROUTES.DEVELOPER_PORTAL,           labelRu: 'Портал',       labelEn: 'Portal',    icon: Building,  status: 'available', personaTags: ['real_estate_developer','business'], jtbdClusters: ['F'], lifecycleStages: ['all'], roleTags: ['provider','operator'], situationCodes: ['developer','business'] },
      { id: 'program',          path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, labelRu: 'Программа',    labelEn: 'Program',   icon: LineChart, status: 'available', personaTags: ['real_estate_developer','business','investor'], jtbdClusters: ['D','E'], lifecycleStages: ['all'], roleTags: ['provider','investor-active'], situationCodes: ['developer','business'] },
      { id: 'newbuilds',        path: APP_ROUTES.NEWBUILDS,                  labelRu: 'Витрина',      labelEn: 'Showcase',  icon: Building2, status: 'available', personaTags: ['investor','property_owner','relocation'], jtbdClusters: ['D'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','investor-passive','consumer'], situationCodes: ['investing','investor','developer'] },
      { id: 'advisory',         path: APP_ROUTES.PROPERTY_CONSULTATION,      labelRu: 'Консультация', labelEn: 'Advisory',  icon: PenTool,   status: 'available', personaTags: ['investor','property_owner','business'], jtbdClusters: ['D','E'], lifecycleStages: ['scout','resident','absentee'], roleTags: ['investor-active','investor-passive'], situationCodes: ['investing','investor','developer','departure'] },
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
  // Emergency (JTBD H) — SOS, medical, accident, lost docs. Primary on Arrive cluster
  // (first-hour-on-island reflex), secondary on Legal (insurance / police follow-up).
  { code: 'emergency',      titleRu: 'Срочная помощь',          titleEn: 'Emergency',         icon: 'AlertTriangle', color: '#DC2626', priority: 100, isActive: true },
  // Exit (JTBD J) — leaving Phuket: visa closure, PM hand-off, asset sale, deposit return.
  { code: 'departure',      titleRu: 'Уезжаю с острова',        titleEn: 'Leaving Phuket',    icon: 'LogOut',        color: '#78716C', priority: 80,  isActive: true },
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
  // EMERGENCY — primary on Arrive (SOS reflex when something goes wrong), secondary on Legal.
  { clusterId: 'arrive', situationCode: 'emergency',      weight: 100, isPrimary: true  },
  { clusterId: 'legal',  situationCode: 'emergency',      weight: 70,  isPrimary: false },
  // DEPARTURE — primary on Legal (visa exit, paperwork), with Manage (PM hand-off)
  // and Invest (property sale / capital repatriation) as secondary anchors.
  { clusterId: 'legal',  situationCode: 'departure',      weight: 100, isPrimary: true  },
  { clusterId: 'manage', situationCode: 'departure',      weight: 80,  isPrimary: false },
  { clusterId: 'invest', situationCode: 'departure',      weight: 60,  isPrimary: false },
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
