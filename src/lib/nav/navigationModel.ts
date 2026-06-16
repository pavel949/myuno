/**
 * Navigation Model — Single Source of Truth.
 *
 * All app navigation (top-bar pills, side-rail groups, bottom-bar slots,
 * contextual FAB) is derived from these maps. No layout/component should
 * hardcode menu items. To add/move/rename a destination, edit ONLY this file.
 *
 * Three structures:
 *  - PRIMARY_NAV[role]   — 5 items max → bottom-bar (mobile) + top-pills (≥md)
 *  - SIDEBAR_NAV[role]   — grouped, full menu → side-rail (≥md, workspace roles)
 *  - FAB_ACTIONS[role]   — quick actions → contextual FAB (mobile workspace)
 *
 * Roles are resolved via `resolveNavRole` from auth context first, URL fallback
 * second. Re-exports legacy items from `navConfig.ts` for backward compatibility
 * during the migration window.
 */
import {
  // primary
  Compass, ShoppingBag, User, LayoutDashboard, Building2,
  CalendarDays, Wallet, MessageCircle, TrendingUp, Package, Calendar,
  UserCheck, MessageSquare, FileCheck, Users, BarChart3, FileText,
  // sidebar extras (workspace)
  Crown, CreditCard, DollarSign, Zap, CalendarCheck, ContactRound,
  PackageOpen, Receipt, Tag, Star, ShieldCheck, Radio,
  BookOpen, Megaphone, Truck, ClipboardList, Shuffle,
  ArrowLeftRight, Target, Layers, LineChart, CalendarClock,
  Key, Webhook, Rocket, Settings, MapPin, Sparkles,
  Stethoscope, GraduationCap, PawPrint, Flower2, UtensilsCrossed,
  Scale, Baby, Ship, Store, Dumbbell,
  // admin sidebar extras
  Pill, Globe, Trash2, Database, Languages, Sliders, Newspaper,
  AlertTriangle, Briefcase, Heart, Camera, Waves, Wrench, ListChecks,
  // fab
  Plus, Receipt as ReceiptIcon, ListTodo, CalendarPlus,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  GUEST_NAV, OWNER_NAV, VENDOR_NAV, ADMIN_NAV, TEAM_NAV,
  INVESTOR_NAV, MC_PORTAL_NAV, NAV_BY_ROLE, resolveNavRole,
  shouldShowAppsLauncher, type NavRoleKey, type NavItem,
} from '@/lib/navConfig';

export { GUEST_STAY_SIDEBAR_DRAFT } from './guestStayNavDraft';
export { FLOATING, FLOATING_OFFSET } from './floatingStack';
/** @see src/lib/nav/roleIA.ts — role, URL, and shell boundaries */

// Re-export so consumers only need one import path going forward.
export {
  GUEST_NAV, OWNER_NAV, VENDOR_NAV, ADMIN_NAV, TEAM_NAV,
  INVESTOR_NAV, MC_PORTAL_NAV, NAV_BY_ROLE, resolveNavRole,
  shouldShowAppsLauncher,
};
export type { NavRoleKey, NavItem };

/** Primary 5-slot navigation (alias of NAV_BY_ROLE for clarity). */
export const PRIMARY_NAV = NAV_BY_ROLE;

// ─────────────────────────────────────────────────────────────
// Bottom-bar relevance mapping (mobile <768px).
//
// Each role gets exactly 5 slots. The slot composition encodes
// product-level "what matters most" for that role:
//
//  guest      → Home · Discover · Market · Property · Me
//                  (consumer browsing + monetization entry points)
//  investor   → Home · Invest · Discover · Property · Me
//                  (capital workflow first, browse second)
//  mc_portal  → My Properties · Statements · Documents · Messages · Me
//                  (read-only owner portal — finance + comms)
//  owner      → Dashboard · Properties · Calendar · Finance · Messages
//                  (operator workflow — daily PMS loop)
//  vendor     → Dashboard · Services · Bookings · Payouts · Profile
//                  (service-provider workflow — fulfilment + payouts)
//  admin      → Dashboard · CRM · Tickets · Moderation · Profile
//                  (platform operator — support + governance)
//  team       → Dashboard · Content · Moderation · CRM · Profile
//                  (uno_team — content & moderation; SideRail N/A, see TeamLayout)
//
// When `feature_flag:me_shell_v1` is on, guest swaps to GUEST_NAV_ME_HUB
// (Home · Feed · Services · Documents · Profile) — handled in BottomBar.
// ─────────────────────────────────────────────────────────────

/**
 * Canonical mapping of role → 5 mobile bottom-bar slots.
 * All items resolve to existing routes in `APP_ROUTES`.
 */
export const BOTTOM_BAR_BY_ROLE: Record<NavRoleKey, NavItem[]> = NAV_BY_ROLE;

/**
 * Get the 5 bottom-bar items relevant to a role.
 * Falls back to `guest` when the role is unknown so the bar never empties.
 */
export function getBottomBarItems(role: NavRoleKey | string | null | undefined): NavItem[] {
  const key = (role && (role as NavRoleKey) in BOTTOM_BAR_BY_ROLE
    ? (role as NavRoleKey)
    : 'guest') as NavRoleKey;
  return BOTTOM_BAR_BY_ROLE[key];
}

/**
 * Whether a given route path is part of the bottom-bar set for a role.
 * Useful for highlight logic and tests.
 */
export function isBottomBarRoute(role: NavRoleKey, path: string): boolean {
  return getBottomBarItems(role).some((item) => item.path === path);
}

// ─────────────────────────────────────────────────────────────
// Active-tab matching
// ─────────────────────────────────────────────────────────────

/**
 * Routes that "absorb" certain sibling pathnames so the right tab stays
 * highlighted across related screens (e.g. /profile is part of the /account
 * tab on the guest bar).
 */
const PATH_ALIASES: Record<string, string[]> = {
  '/account':     ['/account', '/profile', '/me'],
  '/me':          ['/me', '/account', '/profile'],
  '/profile':     ['/profile', '/account'],
  '/market':      ['/market'],
  '/property':    ['/property'],
  '/discover':    ['/discover', '/navigator'],
  '/my-property': [
    '/my-property',
    '/my-property/statements',
    '/my-property/signatures',
  ],
};

/**
 * Decide if a bottom-bar item should render as active for the current
 * pathname. Rules:
 *  1. Items marked `exact` only match an exact pathname.
 *  2. Items with a known alias group match any pathname starting with one
 *     of the aliased prefixes.
 *  3. Otherwise the item matches when the pathname equals or starts with
 *     `${item.path}/`.
 *
 * The function is pure so it can be unit-tested without React Router.
 */
export function isBottomBarItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.path;

  const aliases = PATH_ALIASES[item.path];
  if (aliases) {
    return aliases.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

/**
 * Return the active item from a role's bottom bar for the given pathname,
 * or `null` if nothing matches. When several items would match, the most
 * specific (longest path) wins so that e.g. `/my-property/statements`
 * highlights "Statements", not "My Properties".
 */
export function getActiveBottomBarItem(
  role: NavRoleKey,
  pathname: string,
): NavItem | null {
  const matches = getBottomBarItems(role).filter((item) =>
    isBottomBarItemActive(item, pathname),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, candidate) =>
    candidate.path.length > best.path.length ? candidate : best,
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar (grouped) navigation — workspace roles only.
// Consumer roles (guest/investor/mc_portal) get no sidebar; they use
// the top-pills + bottom-bar pattern.
// ─────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  path: string;
  labelEn: string;
  labelRu: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'tasks' | 'messages' | 'pendingContent' | 'pendingProviders';
}

export interface SidebarNavGroup {
  labelEn: string;
  labelRu: string;
  defaultOpen?: boolean;
  items: SidebarNavItem[];
}

/**
 * OWNER sidebar — consolidated to ~20 items across 6 groups (down from 41/9).
 *
 * Decisions (audit «Управление недвижимостью» §2-3):
 *  • Finance: 10 → 4 items (single hub + key sub-screens).
 *  • CRM: 8 → 4 items (rest accessible via "CRM Tools" grid in dashboard).
 *  • Distribution group folded into Operations (Rates & Channels).
 *  • Developer hidden from main nav — accessible via Settings → Developer.
 *  • Insights collapsed into Properties → Performance.
 */
const OWNER_SIDEBAR: SidebarNavGroup[] = [
  {
    labelEn: 'Control Tower', labelRu: 'Центр управления', defaultOpen: true,
    items: [
      { path: APP_ROUTES.MC,               labelEn: 'Dashboard',  labelRu: 'Обзор',          icon: LayoutDashboard },
      { path: APP_ROUTES.MC_BOOKINGS_LIST, labelEn: 'Bookings',   labelRu: 'Бронирования',   icon: CalendarCheck },
      { path: APP_ROUTES.MC_CALENDAR,      labelEn: 'Calendar',   labelRu: 'Календарь',      icon: CalendarDays },
      { path: APP_ROUTES.MC_TASKS,         labelEn: 'Tasks',      labelRu: 'Задачи',         icon: ClipboardList, badgeKey: 'tasks' },
      { path: APP_ROUTES.MC_MESSAGES,      labelEn: 'Messages',   labelRu: 'Сообщения',      icon: MessageSquare, badgeKey: 'messages' },
    ],
  },
  {
    labelEn: 'Properties', labelRu: 'Объекты', defaultOpen: true,
    items: [
      { path: APP_ROUTES.MC_PROPERTIES,  labelEn: 'Properties',  labelRu: 'Объекты',     icon: Building2 },
      { path: APP_ROUTES.MC_PERFORMANCE, labelEn: 'Performance', labelRu: 'Показатели',  icon: BarChart3 },
      { path: APP_ROUTES.MC_REVIEWS,     labelEn: 'Reviews',     labelRu: 'Отзывы',      icon: Star },
    ],
  },
  {
    labelEn: 'Operations', labelRu: 'Операции',
    items: [
      { path: APP_ROUTES.MC_RATES,      labelEn: 'Rates & Channels', labelRu: 'Тарифы и каналы',       icon: Tag },
      { path: APP_ROUTES.MC_INVENTORY,  labelEn: 'Inventory',        labelRu: 'Инвентарь',             icon: PackageOpen },
      { path: APP_ROUTES.MC_INSURANCE,  labelEn: 'Insurance & Docs', labelRu: 'Страховки и документы', icon: ShieldCheck },
      { path: APP_ROUTES.MC_DOCUMENTS,  labelEn: 'Templates',        labelRu: 'Шаблоны',               icon: FileText },
    ],
  },
  {
    labelEn: 'Finance', labelRu: 'Финансы',
    items: [
      { path: APP_ROUTES.MC_FINANCE,          labelEn: 'Finance Hub',      labelRu: 'Финансы',                 icon: DollarSign },
      { path: APP_ROUTES.MC_INVOICES,         labelEn: 'Invoices & AR',    labelRu: 'Инвойсы и дебиторка',     icon: Receipt },
      // Owner Payouts hidden until first owner_payouts row exists. Direct URL still works.
      // { path: APP_ROUTES.MC_OWNER_PAYOUTS, labelEn: 'Owner Payouts',    labelRu: 'Выплаты собственникам',   icon: Shuffle },
      { path: APP_ROUTES.MC_MANAGEMENT_TERMS, labelEn: 'Management Terms', labelRu: 'Условия управления',      icon: Layers },
    ],
  },
  {
    labelEn: 'CRM & Sales', labelRu: 'CRM и продажи',
    items: [
      { path: APP_ROUTES.MC_CRM_DASHBOARD,      labelEn: 'CRM Dashboard',      labelRu: 'CRM Обзор',           icon: BarChart3 },
      { path: APP_ROUTES.MC_CONTACTS,           labelEn: 'Contacts',           labelRu: 'Контакты',            icon: ContactRound },
      { path: APP_ROUTES.MC_OWNERS,             labelEn: 'Owners',             labelRu: 'Собственники',        icon: Crown },
      { path: APP_ROUTES.MC_VENDOR_ACQUISITION, labelEn: 'Vendor Acquisition', labelRu: 'Привлечение вендоров',icon: Target },
    ],
  },
  {
    labelEn: 'Team & Settings', labelRu: 'Команда и настройки',
    items: [
      { path: APP_ROUTES.MC_STAFF,        labelEn: 'Staff & Access', labelRu: 'Сотрудники',       icon: Users },
      // Approvals hidden until first approval_request row exists. Direct URL still works.
      // { path: APP_ROUTES.MC_APPROVALS,    labelEn: 'Approvals',      labelRu: 'Согласования',     icon: ShieldCheck },
      { path: APP_ROUTES.MC_SETTINGS,     labelEn: 'Settings',       labelRu: 'Настройки',        icon: Settings },
      { path: APP_ROUTES.MC_HELP,         labelEn: 'Help Center',    labelRu: 'Справочник',       icon: BookOpen },
    ],
  },
];

/**
 * Persona-aware filter for the owner sidebar.
 *
 * Single-property owners (BusinessRole 'general' with ≤1 property) get a
 * trimmed nav (no CRM, no Staff/Approvals). Sales agents drop Operations &
 * Finance; service providers drop CRM & Finance. Directors see everything.
 *
 * Pure function — safe to call from render and from unit tests.
 */
export function getOwnerSidebarForRole(
  businessRole: 'property_manager' | 'sales_agent' | 'service_provider' | 'general' | undefined | null,
  options: { propertyCount?: number } = {},
): SidebarNavGroup[] {
  const propertyCount = options.propertyCount ?? 0;
  const isSingleOwner = businessRole === 'general' && propertyCount <= 1;

  const HIDE_GROUPS: Record<string, Set<string>> = {
    sales_agent: new Set(['Operations', 'Finance']),
    service_provider: new Set(['CRM & Sales', 'Finance']),
  };

  return OWNER_SIDEBAR
    .map((group) => {
      if (isSingleOwner) {
        if (group.labelEn === 'CRM & Sales') return null;
        if (group.labelEn === 'Operations') {
          return {
            ...group,
            items: group.items.filter(i =>
              i.path === APP_ROUTES.MC_RATES || i.path === APP_ROUTES.MC_DOCUMENTS,
            ),
          };
        }
        if (group.labelEn === 'Team & Settings') {
          return {
            ...group,
            items: group.items.filter(i =>
              i.path === APP_ROUTES.MC_SETTINGS || i.path === APP_ROUTES.MC_HELP,
            ),
          };
        }
      }
      if (businessRole && HIDE_GROUPS[businessRole]?.has(group.labelEn)) return null;
      return group;
    })
    .filter((g): g is SidebarNavGroup => g !== null);
}

/**
 * ADMIN sidebar — full surfaced map.
 *
 * Previously exposed only 13 of ~67 working admin pages, forcing admins
 * to memorize URLs or rely on Cmd-K. The new shape covers every routed
 * admin page in 7 collapsible groups; daily-use groups default to open,
 * deep-tool groups stay collapsed to keep the rail scannable.
 *
 * Group ordering follows admin workflow priority:
 *   Platform → Verticals → Properties → Finance → Support → AI/Tools → System
 *
 * `/admin/analytics` is retained as a back-compat redirect in
 * adminRoutes.tsx but the sidebar now points «Control Center» at the
 * real route (`/admin/control`) so the rail no longer routes through a
 * redirect.
 */
const ADMIN_SIDEBAR: SidebarNavGroup[] = [
  {
    labelEn: 'Platform', labelRu: 'Платформа', defaultOpen: true,
    items: [
      { path: '/admin/add',                labelEn: 'Add',                labelRu: 'Добавить',                  icon: Plus },
      { path: '/admin',                    labelEn: 'Dashboard',          labelRu: 'Обзор',                     icon: LayoutDashboard },
      { path: '/admin/catalog',            labelEn: 'Catalog & Content',  labelRu: 'Каталог',                   icon: Package, badgeKey: 'pendingContent' },
      { path: '/admin/operations',         labelEn: 'Operations',         labelRu: 'Операции',                  icon: CalendarCheck },
      { path: '/admin/crm',                labelEn: 'CRM',                labelRu: 'CRM',                       icon: UserCheck },
      { path: '/admin/providers',          labelEn: 'Partners',           labelRu: 'Партнёры',                  icon: Building2, badgeKey: 'pendingProviders' },
      { path: '/admin/transfer-operators', labelEn: 'Transfer operators', labelRu: 'Операторы трансферов',      icon: Users },
      { path: '/admin/partner-applications', labelEn: 'Applications',     labelRu: 'Заявки партнёров',          icon: FileCheck },
    ],
  },
  {
    labelEn: 'Content verticals', labelRu: 'Вертикали',
    items: [
      { path: '/admin/restaurants',        labelEn: 'Restaurants',        labelRu: 'Рестораны',                 icon: UtensilsCrossed },
      { path: '/admin/salons',             labelEn: 'Salons',             labelRu: 'Салоны',                    icon: Sparkles },
      { path: '/admin/clinics',            labelEn: 'Clinics',            labelRu: 'Клиники',                   icon: Stethoscope },
      { path: '/admin/gyms',               labelEn: 'Gyms',               labelRu: 'Фитнес',                    icon: Dumbbell },
      { path: '/admin/vehicles',           labelEn: 'Vehicles',           labelRu: 'Транспорт',                 icon: Truck },
      { path: '/admin/transfers',          labelEn: 'Transfers',          labelRu: 'Трансферы',                 icon: ArrowLeftRight },
      { path: '/admin/yachts',             labelEn: 'Yachts',             labelRu: 'Яхты',                      icon: Ship },
      { path: '/admin/water-activities',   labelEn: 'Water activities',   labelRu: 'Водные активности',         icon: Waves },
      { path: '/admin/experiences',        labelEn: 'Experiences',        labelRu: 'Впечатления',               icon: Star },
      { path: '/admin/activities',         labelEn: 'Activities',         labelRu: 'Активности',                icon: Compass },
      { path: '/admin/events',             labelEn: 'Events',             labelRu: 'События',                   icon: CalendarDays },
      { path: '/admin/education',          labelEn: 'Education',          labelRu: 'Образование',               icon: GraduationCap },
      { path: '/admin/legal',              labelEn: 'Legal',              labelRu: 'Юридические',               icon: Scale },
      { path: '/admin/insurance',          labelEn: 'Insurance',          labelRu: 'Страхование',               icon: ShieldCheck },
      { path: '/admin/pharmacies',         labelEn: 'Pharmacies',         labelRu: 'Аптеки',                    icon: Pill },
      { path: '/admin/stores',             labelEn: 'Stores',             labelRu: 'Магазины',                  icon: Store },
      { path: '/admin/pets',               labelEn: 'Pets',               labelRu: 'Питомцы',                   icon: PawPrint },
      { path: '/admin/cleaning',           labelEn: 'Cleaning',           labelRu: 'Уборка',                    icon: Wrench },
      { path: '/admin/babysitters',        labelEn: 'Babysitters',        labelRu: 'Няни',                      icon: Baby },
      { path: '/admin/flowers',            labelEn: 'Flowers',            labelRu: 'Цветы',                     icon: Flower2 },
      { path: '/admin/consultations',      labelEn: 'Consultations',      labelRu: 'Консультации',              icon: MessageCircle },
    ],
  },
  {
    labelEn: 'Properties & Projects', labelRu: 'Недвижимость и проекты',
    items: [
      { path: '/admin/properties',         labelEn: 'Properties',         labelRu: 'Объекты',                   icon: Building2 },
      { path: '/admin/projects',           labelEn: 'Projects',           labelRu: 'Проекты',                   icon: Layers },
      { path: '/admin/newbuilds',          labelEn: 'New developments',   labelRu: 'Новостройки',               icon: Crown },
      { path: '/admin/developers',         labelEn: 'Developers',         labelRu: 'Девелоперы',                icon: Briefcase },
      { path: '/admin/pm-companies',       labelEn: 'PM companies',       labelRu: 'Управляющие компании',      icon: ContactRound },
      { path: '/admin/mc-dashboard',       labelEn: 'MC dashboard',       labelRu: 'Дашборд УК',                icon: BarChart3 },
      { path: '/admin/investments',        labelEn: 'Investments',        labelRu: 'Инвестиции',                icon: TrendingUp },
      { path: '/admin/nb-leads',           labelEn: 'NB leads',           labelRu: 'Лиды новостроек',           icon: ListChecks },
      { path: '/admin/contracts',          labelEn: 'Contracts',          labelRu: 'Контракты',                 icon: FileCheck },
    ],
  },
  {
    labelEn: 'Finance & Analytics', labelRu: 'Финансы и аналитика',
    items: [
      { path: '/admin/finance',            labelEn: 'Finance',            labelRu: 'Финансы',                   icon: DollarSign },
      { path: '/admin/control',            labelEn: 'Control Center',     labelRu: 'Центр управления',          icon: Sliders },
      { path: '/admin/acquisition-metrics', labelEn: 'Acquisition',       labelRu: 'Привлечение',               icon: Target },
      { path: '/admin/investor-metrics',   labelEn: 'Investor metrics',   labelRu: 'Метрики инвесторов',        icon: LineChart },
      { path: '/admin/disputes',           labelEn: 'Disputes',           labelRu: 'Споры',                     icon: AlertTriangle },
      { path: '/admin/marketing',          labelEn: 'Marketing',          labelRu: 'Маркетинг',                 icon: Megaphone },
      { path: '/admin/lifecycle-messaging', labelEn: 'Lifecycle',         labelRu: 'Lifecycle-рассылки',        icon: Radio },
    ],
  },
  {
    labelEn: 'Support & Ops', labelRu: 'Поддержка и операции',
    items: [
      { path: '/admin/tickets',            labelEn: 'Support tickets',    labelRu: 'Тикеты',                    icon: MessageSquare },
      { path: '/admin/quick-listings',     labelEn: 'Quick listings',     labelRu: 'Быстрые листинги',          icon: Zap },
      { path: '/admin/bulk-publish',       labelEn: 'Bulk publish',       labelRu: 'Массовая публикация',       icon: Rocket },
      { path: '/admin/vendor-prospects',   labelEn: 'Vendor prospects',   labelRu: 'Кандидаты в вендоры',       icon: Target },
      { path: '/admin/vendor-content',     labelEn: 'Vendor content',     labelRu: 'Контент вендоров',          icon: Camera },
      { path: '/admin/intake',             labelEn: 'Intake',             labelRu: 'Прием данных',              icon: PackageOpen },
      { path: '/admin/data-import',        labelEn: 'Data import',        labelRu: 'Импорт данных',             icon: Database },
      { path: '/admin/trash',              labelEn: 'Trash',              labelRu: 'Корзина',                   icon: Trash2 },
    ],
  },
  {
    labelEn: 'AI & Tools', labelRu: 'ИИ и инструменты',
    items: [
      { path: '/admin/ai-agents',          labelEn: 'AI agents',          labelRu: 'AI-агенты',                 icon: Sparkles },
      { path: '/admin/ai-ops',             labelEn: 'AI ops',             labelRu: 'AI-операции',               icon: Zap },
      { path: '/admin/ai-knowledge',       labelEn: 'AI knowledge',       labelRu: 'AI-знания',                 icon: BookOpen },
      { path: '/admin/qa-test-runner',     labelEn: 'QA runner',          labelRu: 'QA-тесты',                  icon: ListChecks },
      { path: '/admin/master-catalog',     labelEn: 'Master catalog',     labelRu: 'Мастер-каталог',            icon: Layers },
      { path: '/admin/taxonomy',           labelEn: 'Taxonomy',           labelRu: 'Таксономия',                icon: Tag },
      { path: '/admin/lookups',            labelEn: 'Lookups',            labelRu: 'Справочники',               icon: BookOpen },
      { path: '/admin/official-news',      labelEn: 'Official news',      labelRu: 'Официальные новости',       icon: Newspaper },
      { path: '/admin/legal-documents',    labelEn: 'Legal docs',         labelRu: 'Юр. документы',             icon: FileText },
      { path: '/admin/experience-categories', labelEn: 'Exp. categories', labelRu: 'Категории впечатлений',     icon: Tag },
    ],
  },
  {
    labelEn: 'System', labelRu: 'Система',
    items: [
      { path: '/admin/life-situations',    labelEn: 'LifeOS',             labelRu: 'LifeOS',                    icon: Heart },
      { path: '/admin/users',              labelEn: 'Users & access',     labelRu: 'Пользователи',              icon: Users },
      { path: '/admin/uno-team',           labelEn: 'UNO team',           labelRu: 'Команда UNO',               icon: ShieldCheck },
      { path: '/admin/cities',             labelEn: 'Cities',             labelRu: 'Города',                    icon: MapPin },
      { path: '/admin/location-knowledge', labelEn: 'Location knowledge', labelRu: 'База локаций',              icon: Globe },
      { path: '/admin/translations',       labelEn: 'Translations',       labelRu: 'Переводы',                  icon: Languages },
      { path: '/admin/relocation-articles', labelEn: 'Relocation guides', labelRu: 'Гайды по переезду',         icon: BookOpen },
      { path: '/admin/api-keys',           labelEn: 'API keys',           labelRu: 'API-ключи',                 icon: Key },
      { path: '/admin/settings',           labelEn: 'System settings',    labelRu: 'Настройки',                 icon: Settings },
    ],
  },
];

const VENDOR_SIDEBAR: SidebarNavGroup[] = [
  {
    labelEn: 'Main', labelRu: 'Главное', defaultOpen: true,
    items: [
      { path: '/vendor',           labelEn: 'Dashboard', labelRu: 'Обзор',     icon: LayoutDashboard },
      { path: '/vendor/bookings',  labelEn: 'Bookings',  labelRu: 'Заказы',    icon: CalendarDays },
      { path: '/vendor/services',  labelEn: 'Services',  labelRu: 'Услуги',    icon: Package },
      { path: '/vendor/products',  labelEn: 'Products',  labelRu: 'Товары',    icon: Store },
      { path: '/vendor/locations', labelEn: 'Locations', labelRu: 'Локации',   icon: MapPin },
    ],
  },
  {
    labelEn: 'Performance', labelRu: 'Эффективность',
    items: [
      { path: '/vendor/analytics', labelEn: 'Analytics', labelRu: 'Аналитика', icon: BarChart3 },
      { path: '/vendor/payouts',   labelEn: 'Payouts',   labelRu: 'Выплаты',   icon: DollarSign },
      { path: '/vendor/messages',  labelEn: 'Messages',  labelRu: 'Сообщения', icon: MessageSquare },
    ],
  },
  {
    labelEn: 'Settings', labelRu: 'Настройки',
    items: [
      { path: '/vendor/settings',  labelEn: 'Settings',  labelRu: 'Настройки', icon: Settings },
    ],
  },
];

export const SIDEBAR_NAV: Record<NavRoleKey, SidebarNavGroup[]> = {
  guest:     [],   // consumer — no sidebar
  investor:  [],   // consumer — no sidebar
  mc_portal: [],   // consumer-style portal — no sidebar (uses top + bottom)
  owner:     OWNER_SIDEBAR,
  vendor:    VENDOR_SIDEBAR,
  admin:     ADMIN_SIDEBAR,
  /** `team` uses `TeamLayout` + `TeamSidebar` (not global `SideRail`). */
  team:      [],
};

export function hasSidebar(role: NavRoleKey): boolean {
  return SIDEBAR_NAV[role].length > 0;
}

/**
 * Workspace block for `AppDrawer`. Team has no `SIDEBAR_NAV` (custom sidebar in layout);
 * we still expose the same 5 primary destinations here for quick access.
 */
export function getWorkspaceDrawerGroups(role: NavRoleKey): SidebarNavGroup[] {
  if (role === 'team') {
    return [
      {
        labelEn: 'Team workspace',
        labelRu: 'Команда',
        defaultOpen: true,
        items: TEAM_NAV.map((item) => ({
          path: item.path,
          labelEn: item.labelEn,
          labelRu: item.labelRu,
          icon: item.icon,
        })),
      },
    ];
  }
  if (hasSidebar(role)) return SIDEBAR_NAV[role];
  return [];
}

// ─────────────────────────────────────────────────────────────
// Contextual FAB (mobile workspace only)
// ─────────────────────────────────────────────────────────────

export interface FabAction {
  id: string;
  path: string;
  labelEn: string;
  labelRu: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Token-based color class, e.g. 'bg-primary/15 text-primary' */
  tone: string;
}

const OWNER_FAB: FabAction[] = [
  { id: 'expense', path: `${APP_ROUTES.MC_FINANCE}?action=create`,  labelEn: 'Expense', labelRu: 'Расход',   icon: ReceiptIcon,  tone: 'bg-destructive/15 text-destructive' },
  { id: 'task',    path: `${APP_ROUTES.MC_TASKS}?action=create`,    labelEn: 'Task',    labelRu: 'Задача',   icon: ListTodo,     tone: 'bg-primary/15 text-primary' },
  { id: 'meeting', path: `${APP_ROUTES.MC_CALENDAR}?action=create`, labelEn: 'Meeting', labelRu: 'Встреча',  icon: CalendarPlus, tone: 'bg-accent/15 text-accent-foreground' },
  { id: 'apps',    path: APP_ROUTES.HOME,                            labelEn: 'myUNO',   labelRu: 'myUNO',    icon: ShoppingBag,  tone: 'bg-success/15 text-success' },
];

export const FAB_ACTIONS: Partial<Record<NavRoleKey, FabAction[]>> = {
  owner: OWNER_FAB,
  // admin/vendor: not enabled by default — add when product-confirmed.
};

export function hasFab(role: NavRoleKey): boolean {
  return Boolean(FAB_ACTIONS[role]?.length);
}

/** Workspace roles render side-rail + optional FAB; consumer roles do not. */
export function isWorkspaceRole(role: NavRoleKey): boolean {
  return role === 'owner' || role === 'vendor' || role === 'admin' || role === 'team';
}
