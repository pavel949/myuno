/**
 * @module clusterCatalog
 * @description SSOT for the platform's cluster → service catalog.
 *
 * **Rule:** Adding/moving/renaming any service in the public navigation map
 * MUST happen in this file. Both `NavigatorPage` (full /discover catalog)
 * and `AppDrawer` (left-side launcher) consume this same array — no other
 * place may declare cluster groupings.
 *
 * Why a separate file from `navigationModel.ts`?
 * `navigationModel.ts` describes ROLE-aware shells (top bar pills, side rail,
 * bottom bar slots — i.e. *navigation chrome*). This file describes the
 * **public service map** (what the platform offers, grouped by life-stage
 * cluster). The two intentionally don't overlap and should not be merged.
 */
import {
  Plane, Home as HomeIcon, Heart, Scale, TrendingUp, Building2, HardHat, Baby,
  Smartphone, ArrowLeftRight, Car, Landmark, Zap,
  Utensils, Sparkles, Stethoscope, ClipboardList, ShoppingBag, Users,
  FileSearch, Calculator, Shield,
  Calendar, BarChart3, Wrench, PenTool, DollarSign,
  Building, Search, LineChart, Palette,
  Compass, Anchor, Dumbbell, CalendarDays, GraduationCap, PawPrint,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

export type ClusterServiceStatus = 'available' | 'soon' | 'pro';

export interface ClusterService {
  /** Bilingual label — RU */
  labelRu: string;
  /** Bilingual label — EN */
  labelEn: string;
  /** Lucide icon component */
  icon: React.ElementType;
  /** Internal route (must come from APP_ROUTES) */
  path: string;
  /** Availability state — drives Soon/Pro badges and click-disabled */
  status: ClusterServiceStatus;
}

export interface ClusterCatalogEntry {
  /** Stable id (used as filter key, accordion value, analytics tag) */
  id: string;
  /** Cluster heading — RU */
  labelRu: string;
  /** Cluster heading — EN */
  labelEn: string;
  /** One-line value-prop — RU (used by NavigatorPage; AppDrawer ignores) */
  valueRu: string;
  /** One-line value-prop — EN */
  valueEn: string;
  /** Hex accent color (matches DS cluster palette) */
  color: string;
  /** Cluster icon */
  icon: React.ElementType;
  /** Services inside this cluster (order = display order) */
  services: ClusterService[];
  /**
   * Visibility rules (drives AppDrawer filtering by role/persona).
   *  - `audience: 'public'`   — always visible to everyone (default)
   *  - `audience: 'workspace'`— hidden unless persona/role matches `personas`/`roles`
   *
   * `personas` are checked against the user's `useUserPersonas` stack.
   * `roles` are checked against the resolved `NavRoleKey` from `navigationModel`.
   * If both arrays are present, EITHER match makes the cluster visible.
   *
   * Public catalog (`/discover` NavigatorPage) ignores these filters and
   * shows everything — it's the full ecosystem map.
   */
  audience?: 'public' | 'workspace';
  personas?: string[];
  roles?: string[];
}

/**
 * Canonical cluster list. Mirrors the 8 life-stage clusters of the super-app
 * (Arrive, Live, Enjoy, Stay Legal, Invest, Family & Pets, Manage, Build).
 *
 * **Order matters** — first appearance in this array drives display order on
 * `/discover` and inside the AppDrawer accordion.
 */
export const CLUSTER_CATALOG: ClusterCatalogEntry[] = [
  {
    id: 'arrive',
    labelRu: 'ПРИЕХАТЬ',
    labelEn: 'ARRIVE',
    valueRu: 'Туристы и новые резиденты: дорога от аэропорта, связь, деньги, мобильность.',
    valueEn: 'Tourists & new residents: airport transfers, connectivity, money, getting around.',
    color: '#00D68F',
    icon: Plane,
    services: [
      { labelRu: 'Трансферы',   labelEn: 'Transfers',  icon: Car,            path: APP_ROUTES.AIRPORT_TRANSFER, status: 'available' },
      { labelRu: 'SIM-карты',   labelEn: 'SIM Cards',  icon: Smartphone,     path: APP_ROUTES.SIM_START,        status: 'available' },
      { labelRu: 'Курсы валют', labelEn: 'Exchange',   icon: ArrowLeftRight, path: APP_ROUTES.EXCHANGE,         status: 'available' },
      { labelRu: 'Авто',        labelEn: 'Car Rental', icon: Car,            path: APP_ROUTES.TRANSPORT,        status: 'available' },
      { labelRu: 'Банк',        labelEn: 'Bank',       icon: Landmark,       path: APP_ROUTES.BANKING,          status: 'available' },
      { labelRu: 'Fast Track',  labelEn: 'Fast Track', icon: Zap,            path: APP_ROUTES.FAST_TRACK,       status: 'available' },
    ],
  },
  {
    id: 'live',
    labelRu: 'ЖИТЬ',
    labelEn: 'LIVE',
    valueRu: 'Резиденты: быт, здоровье, еда, покупки — без хаоса.',
    valueEn: 'Residents: dining, wellness, home services, shopping — one place.',
    color: '#4E7BFF',
    icon: HomeIcon,
    services: [
      { labelRu: 'Рестораны', labelEn: 'Restaurants', icon: Utensils,    path: APP_ROUTES.RESTAURANTS, status: 'available' },
      { labelRu: 'Афиша',     labelEn: 'Events',      icon: CalendarDays, path: APP_ROUTES.EVENTS,     status: 'available' },
      { labelRu: 'Красота',   labelEn: 'Beauty',      icon: Palette,     path: APP_ROUTES.BEAUTY,      status: 'available' },
      { labelRu: 'Медицина',  labelEn: 'Medical',     icon: Stethoscope, path: APP_ROUTES.MEDICAL,     status: 'available' },
      { labelRu: 'Маркет',    labelEn: 'Market',      icon: ShoppingBag, path: APP_ROUTES.MARKET,      status: 'available' },
      { labelRu: 'Уборка',    labelEn: 'Cleaning',    icon: Sparkles,    path: APP_ROUTES.CLEANING,    status: 'available' },
      { labelRu: 'Услуги',    labelEn: 'Services',    icon: Wrench,      path: APP_ROUTES.SERVICES,    status: 'available' },
    ],
  },
  {
    id: 'enjoy',
    labelRu: 'ОТДЫХАТЬ',
    labelEn: 'ENJOY',
    valueRu: 'Впечатления, яхты, спорт, события — лучшее на Пхукете.',
    valueEn: 'Experiences, yachts, fitness, events — the best of Phuket.',
    color: '#EC4899',
    icon: Heart,
    services: [
      { labelRu: 'Впечатления', labelEn: 'Experiences', icon: Compass,     path: APP_ROUTES.EXPERIENCES, status: 'available' },
      { labelRu: 'Яхты',        labelEn: 'Yachts',      icon: Anchor,      path: APP_ROUTES.YACHTS,      status: 'available' },
      { labelRu: 'События',     labelEn: 'Events',      icon: CalendarDays, path: APP_ROUTES.EVENTS,     status: 'available' },
      { labelRu: 'Фитнес',      labelEn: 'Fitness',     icon: Dumbbell,    path: APP_ROUTES.FITNESS,     status: 'available' },
      { labelRu: 'Цветы',       labelEn: 'Flowers',     icon: Sparkles,    path: APP_ROUTES.FLOWERS,     status: 'available' },
    ],
  },
  {
    id: 'legal',
    labelRu: 'ЛЕГАЛЬНО',
    labelEn: 'STAY LEGAL',
    valueRu: 'Статус, налоги, договоры и страховки.',
    valueEn: 'Visa status, taxes, contracts & insurance.',
    color: '#F59E0B',
    icon: Scale,
    services: [
      { labelRu: 'Визы',       labelEn: 'Visas',      icon: Plane,      path: APP_ROUTES.VISA_IMMIGRATION,   status: 'available' },
      { labelRu: 'Налоги',     labelEn: 'Taxes',      icon: Calculator, path: APP_ROUTES.TAX_NAV,            status: 'available' },
      { labelRu: 'ContractAI', labelEn: 'ContractAI', icon: FileSearch, path: APP_ROUTES.CONTRACT_ANALYSIS,  status: 'available' },
      { labelRu: 'Страховка',  labelEn: 'Insurance',  icon: Shield,     path: APP_ROUTES.INSURANCE,          status: 'available' },
    ],
  },
  {
    id: 'invest',
    labelRu: 'КУПИТЬ',
    labelEn: 'INVEST',
    valueRu: 'Каталог, новостройки, вторичка, застройщики, ROI.',
    valueEn: 'Search, off-plan, resale, developers, ROI tools.',
    color: '#A855F7',
    icon: TrendingUp,
    services: [
      { labelRu: 'Поиск',        labelEn: 'Property',     icon: Search,    path: APP_ROUTES.PROPERTY,    status: 'available' },
      { labelRu: 'Новостройки',  labelEn: 'Off-plan',     icon: Building2, path: APP_ROUTES.OFFPLAN,     status: 'available' },
      { labelRu: 'Вторичка',     labelEn: 'Resale',       icon: Building2, path: APP_ROUTES.RESALE,      status: 'available' },
      { labelRu: 'Застройщики',  labelEn: 'Developers',   icon: Users,     path: APP_ROUTES.DEVELOPERS,  status: 'available' },
      { labelRu: 'ROI',          labelEn: 'ROI Hub',      icon: BarChart3, path: APP_ROUTES.INVEST,      status: 'available' },
      { labelRu: 'DueDiligence', labelEn: 'DueDiligence', icon: Shield,    path: APP_ROUTES.INVEST,      status: 'soon' },
    ],
  },
  {
    id: 'family',
    labelRu: 'СЕМЬЯ',
    labelEn: 'FAMILY & PETS',
    valueRu: 'Школы, няни, ветеринары, питомцы.',
    valueEn: 'Schools, childcare, vets, pet services.',
    color: '#F59E0B',
    icon: Baby,
    services: [
      { labelRu: 'Образование', labelEn: 'Education',   icon: GraduationCap, path: APP_ROUTES.EDUCATION,      status: 'available' },
      { labelRu: 'Няни',        labelEn: 'Babysitters', icon: Baby,          path: APP_ROUTES.BABYSITTER,     status: 'available' },
      { labelRu: 'Питомцы',     labelEn: 'Pets',        icon: PawPrint,      path: APP_ROUTES.PETS,           status: 'available' },
      { labelRu: 'Школы',       labelEn: 'Schools',     icon: Search,        path: APP_ROUTES.SCHOOL_FINDER,  status: 'available' },
      { labelRu: 'Аптеки',      labelEn: 'Pharmacy',    icon: Stethoscope,   path: APP_ROUTES.PHARMACY,       status: 'available' },
    ],
  },
  {
    id: 'manage',
    labelRu: 'УПРАВЛЯТЬ',
    labelEn: 'MANAGE',
    valueRu: 'Собственники: брони, финансы, CRM — один кабинет.',
    valueEn: 'Hosts & managers: bookings, money, ops, CRM.',
    color: '#06B6D4',
    icon: Building2,
    // Workspace cluster — gated to property owners and pro operator roles.
    audience: 'workspace',
    personas: ['property_owner', 'local_services_provider'],
    roles: ['owner', 'admin', 'team', 'vendor'],
    services: [
      { labelRu: 'Кабинет',   labelEn: 'Dashboard',  icon: Calendar,        path: '/mc',                       status: 'available' },
      { labelRu: 'Календарь', labelEn: 'Calendar',   icon: Calendar,        path: APP_ROUTES.MC_CALENDAR,      status: 'available' },
      { labelRu: 'Финансы',   labelEn: 'Finances',   icon: DollarSign,      path: APP_ROUTES.MC_FINANCE,       status: 'available' },
      { labelRu: 'Задачи',    labelEn: 'Operations', icon: ClipboardList,   path: APP_ROUTES.MC_TASKS,         status: 'available' },
      { labelRu: 'Отчёты',    labelEn: 'Reports',    icon: BarChart3,       path: APP_ROUTES.MC_REPORTS,       status: 'pro' },
      { labelRu: 'CRM',       labelEn: 'CRM',        icon: Users,           path: APP_ROUTES.MC_CRM_DASHBOARD, status: 'pro' },
    ],
  },
  {
    id: 'build',
    labelRu: 'ДЕВЕЛОПЕРАМ',
    labelEn: 'FOR DEVELOPERS',
    valueRu: 'Портал, лиды, витрина проектов, консультации.',
    valueEn: 'Portal, leads, project showcase & deal advisory.',
    color: '#F43F5E',
    icon: HardHat,
    // Workspace cluster — gated to real-estate developers and platform admins.
    audience: 'workspace',
    personas: ['real_estate_developer'],
    roles: ['admin', 'team'],
    services: [
      { labelRu: 'Портал',       labelEn: 'Portal',    icon: Building,   path: APP_ROUTES.DEVELOPER_PORTAL,            status: 'available' },
      { labelRu: 'Программа',    labelEn: 'Program',   icon: LineChart,  path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS,  status: 'available' },
      { labelRu: 'Витрина',      labelEn: 'Showcase',  icon: Building2,  path: APP_ROUTES.NEWBUILDS,                   status: 'available' },
      { labelRu: 'Консультация', labelEn: 'Advisory',  icon: PenTool,    path: APP_ROUTES.PROPERTY_CONSULTATION,       status: 'available' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Derived helpers — avoid re-computing in consumers
// ─────────────────────────────────────────────────────────────

/** Flat list of every service across all clusters, with parent metadata attached. */
export interface FlatClusterService extends ClusterService {
  clusterId: string;
  clusterColor: string;
  clusterLabelRu: string;
  clusterLabelEn: string;
}

export const CLUSTER_CATALOG_FLAT: FlatClusterService[] =
  CLUSTER_CATALOG.flatMap((c) =>
    c.services.map((s) => ({
      ...s,
      clusterId: c.id,
      clusterColor: c.color,
      clusterLabelRu: c.labelRu,
      clusterLabelEn: c.labelEn,
    })),
  );

/** Available-only flat list — what gets shown in `/discover` search and tile rows. */
export const CLUSTER_CATALOG_AVAILABLE: FlatClusterService[] =
  CLUSTER_CATALOG_FLAT.filter((s) => s.status !== 'soon');

/** Coming-soon-only flat list — rendered as muted pills at bottom of `/discover`. */
export const CLUSTER_CATALOG_SOON: FlatClusterService[] =
  CLUSTER_CATALOG_FLAT.filter((s) => s.status === 'soon');

/** Total count of bookable/available services across the platform. */
export const CLUSTER_CATALOG_TOTAL_AVAILABLE: number = CLUSTER_CATALOG_AVAILABLE.length;

/** Lookup by id — O(1) reads from drawer/navigator. */
export function getClusterById(id: string): ClusterCatalogEntry | undefined {
  return CLUSTER_CATALOG.find((c) => c.id === id);
}

// ─────────────────────────────────────────────────────────────
// Role/persona-aware filtering — drives the AppDrawer launcher
// ─────────────────────────────────────────────────────────────

export interface ClusterAudienceContext {
  /** Active persona stack from `useUserPersonas()` (string[] for decoupling). */
  personas?: string[];
  /** Resolved nav role from `resolveNavRole()` (`navigationModel`). */
  role?: string | null;
}

/**
 * Decide whether a cluster should appear in the AppDrawer for a given user.
 *
 * Rules:
 *  - `audience: 'public'` (default) → always visible.
 *  - `audience: 'workspace'` → visible only when the user's persona stack
 *    intersects `cluster.personas` OR their resolved `role` is in
 *    `cluster.roles`. Empty/missing context hides the cluster (safer default
 *    — consumer/guest doesn't see operator surfaces by accident).
 */
export function isClusterVisibleToUser(
  cluster: ClusterCatalogEntry,
  ctx: ClusterAudienceContext,
): boolean {
  if (cluster.audience !== 'workspace') return true;

  const { personas = [], role } = ctx;
  const personaMatch = (cluster.personas ?? []).some((p) => personas.includes(p));
  const roleMatch = !!role && (cluster.roles ?? []).includes(role);
  return personaMatch || roleMatch;
}

/**
 * Filter the SSOT catalog down to clusters this user is allowed to launch
 * from the AppDrawer. Pure / memoizable — does not touch React state.
 */
export function filterCatalogForUser(
  ctx: ClusterAudienceContext,
): ClusterCatalogEntry[] {
  return CLUSTER_CATALOG.filter((c) => isClusterVisibleToUser(c, ctx));
}
