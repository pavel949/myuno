/**
 * Single source of truth for role-aware navigation items.
 * Used by both <AdaptiveBottomNav /> (mobile) and <DesktopNavTabs /> (desktop)
 * so the structure stays in sync across breakpoints.
 *
 * Role resolution: prefer `activeRole` from useUserContext (server-truth),
 * fall back to URL pathname when no auth context is available (guest browse).
 */

import {
  Home, Compass, ShoppingBag, User, LayoutDashboard, Building2,
  CalendarDays, Calendar, Package, Wallet, UserCheck, MessageSquare,
  FileCheck, Users, MessageCircle, BarChart3, FileText, TrendingUp, Inbox,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

export type NavItem = {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
  /** Match path exactly (for `/` and dashboard roots) */
  exact?: boolean;
};

export type NavRoleKey =
  | 'guest'
  | 'owner'        // owner / property_manager (MC operator)
  | 'vendor'
  | 'admin'        // platform admin
  | 'team'         // uno_team
  | 'investor'
  | 'mc_portal';   // owner whose property is run by an MC

// ─────────────────────────────────────────────────────────────
// Per-role nav configs — kept identical between mobile & desktop.
// 5 items max (mobile constraint). Desktop can render all 5.
// ─────────────────────────────────────────────────────────────

/**
 * GUEST_NAV — legacy 5-tab (Home/Discover/Market/Property/Me).
 * Kept as default until `feature_flag:me_shell_v1` is enabled, then
 * `GUEST_NAV_ME_HUB` (Gosuslugi-style 5-tab) takes over via NavShell.
 */
export const GUEST_NAV: NavItem[] = [
  { path: APP_ROUTES.HOME,     icon: Home,        labelEn: 'Home',      labelRu: 'Главная', exact: true },
  { path: APP_ROUTES.DISCOVER, icon: Compass,     labelEn: 'Discover',  labelRu: 'Навигатор' },
  { path: APP_ROUTES.MARKET,   icon: ShoppingBag, labelEn: 'Market',    labelRu: 'Маркет' },
  { path: APP_ROUTES.PROPERTY, icon: Building2,   labelEn: 'Property',  labelRu: 'Недвижимость' },
  { path: APP_ROUTES.ACCOUNT,  icon: User,        labelEn: 'Me',        labelRu: 'Профиль' },
];

/**
 * GUEST_NAV_ME_HUB — Phase A5 Gosuslugi-style nav. Replaces GUEST_NAV
 * when `feature_flag:me_shell_v1` is enabled in system_settings.
 */
export const GUEST_NAV_ME_HUB: NavItem[] = [
  { path: APP_ROUTES.HOME,         icon: Home,          labelEn: 'Home',      labelRu: 'Главная', exact: true },
  { path: APP_ROUTES.ME_FEED,      icon: Inbox,         labelEn: 'Feed',      labelRu: 'Лента', exact: true },
  { path: APP_ROUTES.ME_SERVICES,  icon: Compass,       labelEn: 'Services',  labelRu: 'Услуги' },
  { path: APP_ROUTES.ME_DOCUMENTS, icon: FileText,      labelEn: 'Documents', labelRu: 'Документы' },
  { path: APP_ROUTES.ME_PROFILE,   icon: User,          labelEn: 'Profile',   labelRu: 'Профиль' },
];

export const OWNER_NAV: NavItem[] = [
  { path: APP_ROUTES.MC,            icon: LayoutDashboard, labelEn: 'Dashboard',  labelRu: 'Дашборд', exact: true },
  { path: APP_ROUTES.MC_PROPERTIES, icon: Building2,       labelEn: 'Properties', labelRu: 'Объекты' },
  { path: APP_ROUTES.MC_CALENDAR,   icon: CalendarDays,    labelEn: 'Calendar',   labelRu: 'Календарь' },
  { path: APP_ROUTES.MC_FINANCE,    icon: Wallet,          labelEn: 'Finance',    labelRu: 'Финансы' },
  { path: APP_ROUTES.MC_MESSAGES,   icon: MessageCircle,   labelEn: 'Messages',   labelRu: 'Чаты' },
];

export const VENDOR_NAV: NavItem[] = [
  { path: APP_ROUTES.VENDOR,          icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Дашборд', exact: true },
  { path: APP_ROUTES.VENDOR_SERVICES, icon: Package,         labelEn: 'Services',  labelRu: 'Услуги' },
  { path: APP_ROUTES.VENDOR_BOOKINGS, icon: Calendar,        labelEn: 'Bookings',  labelRu: 'Заказы' },
  { path: APP_ROUTES.VENDOR_PAYOUTS,  icon: Wallet,          labelEn: 'Payouts',   labelRu: 'Выплаты' },
  { path: APP_ROUTES.PROFILE,         icon: User,            labelEn: 'Profile',   labelRu: 'Профиль' },
];

export const ADMIN_NAV: NavItem[] = [
  { path: APP_ROUTES.ADMIN,            icon: LayoutDashboard, labelEn: 'Dashboard',  labelRu: 'Обзор', exact: true },
  { path: APP_ROUTES.ADMIN_CRM,        icon: UserCheck,       labelEn: 'CRM',        labelRu: 'CRM' },
  { path: APP_ROUTES.ADMIN_TICKETS,    icon: MessageSquare,   labelEn: 'Tickets',    labelRu: 'Тикеты' },
  { path: APP_ROUTES.ADMIN_MODERATION, icon: FileCheck,       labelEn: 'Moderation', labelRu: 'Модерация' },
  { path: APP_ROUTES.PROFILE,          icon: User,            labelEn: 'Profile',    labelRu: 'Профиль' },
];

export const TEAM_NAV: NavItem[] = [
  { path: APP_ROUTES.TEAM,             icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор', exact: true },
  { path: APP_ROUTES.TEAM_CONTENT,     icon: FileText,        labelEn: 'Content',   labelRu: 'Контент' },
  { path: APP_ROUTES.ADMIN_MODERATION, icon: FileCheck,       labelEn: 'Moderation', labelRu: 'Модерация' },
  { path: APP_ROUTES.ADMIN_CRM,        icon: Users,           labelEn: 'CRM',       labelRu: 'CRM' },
  { path: APP_ROUTES.PROFILE,          icon: User,            labelEn: 'Profile',   labelRu: 'Профиль' },
];

export const INVESTOR_NAV: NavItem[] = [
  { path: APP_ROUTES.HOME,             icon: Home,         labelEn: 'Home',     labelRu: 'Главная', exact: true },
  { path: APP_ROUTES.INVEST_DASHBOARD, icon: TrendingUp,   labelEn: 'Invest',   labelRu: 'Инвестиции' },
  { path: APP_ROUTES.DISCOVER,         icon: Compass,      labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: APP_ROUTES.PROPERTY,         icon: Building2,    labelEn: 'Property', labelRu: 'Недвижимость' },
  { path: APP_ROUTES.ACCOUNT,          icon: User,         labelEn: 'Me',       labelRu: 'Профиль' },
];

export const MC_PORTAL_NAV: NavItem[] = [
  { path: APP_ROUTES.OWNER_PORTAL,         icon: Building2, labelEn: 'My Properties', labelRu: 'Мои объекты', exact: true },
  { path: APP_ROUTES.OWNER_PORTAL_STATEMENTS, icon: BarChart3, labelEn: 'Statements', labelRu: 'Отчёты' },
  { path: APP_ROUTES.OWNER_PORTAL_SIGNATURES, icon: FileText,  labelEn: 'Documents',  labelRu: 'Документы' },
  { path: APP_ROUTES.MC_MESSAGES,    icon: MessageCircle, labelEn: 'Messages',  labelRu: 'Чаты' },
  { path: APP_ROUTES.ACCOUNT,        icon: User,      labelEn: 'Me',            labelRu: 'Профиль' },
];

// ─────────────────────────────────────────────────────────────
// Resolution
// ─────────────────────────────────────────────────────────────

export const NAV_BY_ROLE: Record<NavRoleKey, NavItem[]> = {
  guest:     GUEST_NAV,
  owner:     OWNER_NAV,
  vendor:    VENDOR_NAV,
  admin:     ADMIN_NAV,
  team:      TEAM_NAV,
  investor:  INVESTOR_NAV,
  mc_portal: MC_PORTAL_NAV,
};

/**
 * Resolve nav role from auth context first; URL-based fallback for guests
 * or when context hasn't loaded yet (prevents flash of wrong nav).
 */
export function resolveNavRole(opts: {
  activeRole?: string | null;
  isMCPortal?: boolean;
  pathname: string;
}): NavRoleKey {
  const { activeRole, isMCPortal, pathname } = opts;

  // 1. Authenticated role wins
  if (activeRole === 'admin') return 'admin';
  if (activeRole === 'uno_team' || activeRole === 'staff') return 'team';
  if (activeRole === 'vendor') return 'vendor';
  if (activeRole === 'owner' || activeRole === 'property_manager' || activeRole === 'property_owner') {
    return 'owner';
  }
  if (activeRole === 'investor') return 'investor';
  if (isMCPortal) return 'mc_portal';

  // 2. URL-based fallback (guest browsing into operational area)
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/team')) return 'team';
  if (pathname.startsWith('/vendor')) return 'vendor';
  if (pathname.startsWith('/mc') || pathname.startsWith('/owner')) return 'owner';
  if (pathname.startsWith('/my-property')) return 'mc_portal';
  if (pathname.startsWith('/invest')) return 'investor';

  return 'guest';
}

/** Whether the "All Apps" launcher pill should appear (guest/investor consumer surfaces). */
export function shouldShowAppsLauncher(role: NavRoleKey): boolean {
  return role === 'guest' || role === 'investor' || role === 'mc_portal';
}
