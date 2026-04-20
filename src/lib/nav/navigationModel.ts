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
  Home, Compass, ShoppingBag, User, LayoutDashboard, Building2,
  CalendarDays, Wallet, MessageCircle, TrendingUp, Package, Calendar,
  UserCheck, MessageSquare, FileCheck, Users, BarChart3, FileText,
  // sidebar extras (workspace)
  Crown, CreditCard, DollarSign, Zap, CalendarCheck, ContactRound,
  PackageOpen, Receipt, Tag, Star, ShieldCheck, Radio,
  BookOpen, Megaphone, Truck, ClipboardList, Shuffle,
  ArrowLeftRight, Target, Layers, LineChart, CalendarClock,
  Key, Webhook, Rocket, Settings, MapPin, Sparkles, Car,
  Stethoscope, GraduationCap, PawPrint, Flower2, UtensilsCrossed,
  Scale, Baby, Ship, Store, Dumbbell,
  // fab
  Plus, Receipt as ReceiptIcon, ListTodo, CalendarPlus,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  GUEST_NAV, OWNER_NAV, VENDOR_NAV, ADMIN_NAV, TEAM_NAV,
  INVESTOR_NAV, MC_PORTAL_NAV, NAV_BY_ROLE, resolveNavRole,
  shouldShowAppsLauncher, type NavRoleKey, type NavItem,
} from '@/lib/navConfig';

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
    labelEn: 'Insights', labelRu: 'Аналитика',
    items: [
      { path: APP_ROUTES.MC_PERFORMANCE,     labelEn: 'Performance',      labelRu: 'Показатели',                icon: BarChart3 },
      { path: APP_ROUTES.MC_OWNER_ANALYTICS, labelEn: 'Owner Analytics',  labelRu: 'Аналитика собственников',   icon: Crown },
      { path: APP_ROUTES.MC_REVIEWS,         labelEn: 'Reviews',          labelRu: 'Отзывы',                    icon: Star },
    ],
  },
  {
    labelEn: 'Properties', labelRu: 'Объекты',
    items: [
      { path: APP_ROUTES.MC_PROPERTIES, labelEn: 'Properties', labelRu: 'Объекты',     icon: Building2 },
      { path: APP_ROUTES.MC_INVENTORY,  labelEn: 'Inventory',  labelRu: 'Инвентарь',   icon: PackageOpen },
      { path: APP_ROUTES.MC_VENDORS,    labelEn: 'Vendors',    labelRu: 'Поставщики',  icon: Truck },
    ],
  },
  {
    labelEn: 'Operations', labelRu: 'Операции',
    items: [
      { path: APP_ROUTES.MC_RATES,      labelEn: 'Rate Seasons',     labelRu: 'Тарифы',                    icon: Tag },
      { path: APP_ROUTES.MC_INSURANCE,  labelEn: 'Insurance & Docs', labelRu: 'Страховки и документы',     icon: ShieldCheck },
      { path: APP_ROUTES.MC_DOCUMENTS,  labelEn: 'Templates',        labelRu: 'Шаблоны',                   icon: FileText },
      { path: APP_ROUTES.MC_SIGNATURES, labelEn: 'E-Signatures',     labelRu: 'Электронные подписи',       icon: FileText },
    ],
  },
  {
    labelEn: 'Distribution', labelRu: 'Дистрибуция',
    items: [
      { path: APP_ROUTES.MC_CHANNELS, labelEn: 'Channel Manager', labelRu: 'Channel Manager', icon: Radio },
    ],
  },
  {
    labelEn: 'Finance', labelRu: 'Финансы',
    items: [
      { path: APP_ROUTES.MC_FINANCE,             labelEn: 'Overview',             labelRu: 'Обзор',                       icon: DollarSign },
      { path: APP_ROUTES.MC_OWNER_PAYOUTS,       labelEn: 'Owner Payouts',        labelRu: 'Выплаты собственникам',       icon: Shuffle },
      { path: APP_ROUTES.MC_AR_AGING,            labelEn: 'AR Aging',             labelRu: 'Дебиторка',                   icon: Receipt },
      { path: APP_ROUTES.MC_TRUST_ACCOUNTS,      labelEn: 'Trust Accounts',       labelRu: 'Эскроу-счета',                icon: ShieldCheck },
      { path: APP_ROUTES.MC_TAX_CENTER,          labelEn: 'Tax Center',           labelRu: 'Налоги (Thai)',               icon: Target },
      { path: APP_ROUTES.MC_STATEMENT_APPROVALS, labelEn: 'Statement Approvals',  labelRu: 'Одобрения отчётов',           icon: FileText },
      { path: APP_ROUTES.MC_FINANCIALS,          labelEn: 'Transactions',         labelRu: 'Транзакции',                  icon: ArrowLeftRight },
      { path: APP_ROUTES.MC_REPORTS,             labelEn: 'Reports',              labelRu: 'Отчёты',                      icon: BarChart3 },
      { path: APP_ROUTES.MC_BUDGET,              labelEn: 'Budget',               labelRu: 'Бюджет',                      icon: Target },
      { path: APP_ROUTES.MC_FINANCE_PLANNING,    labelEn: 'Financial Planning',   labelRu: 'Финансовое планирование',     icon: LineChart },
      { path: APP_ROUTES.MC_INVOICES,            labelEn: 'Invoices',             labelRu: 'Инвойсы',                     icon: Receipt },
      { path: APP_ROUTES.MC_MANAGEMENT_TERMS,    labelEn: 'Management Terms',     labelRu: 'Условия управления',          icon: Layers },
    ],
  },
  {
    labelEn: 'CRM & Sales', labelRu: 'CRM и продажи',
    items: [
      { path: APP_ROUTES.MC_CRM_DASHBOARD,     labelEn: 'CRM Dashboard',       labelRu: 'CRM Обзор',           icon: BarChart3 },
      { path: APP_ROUTES.MC_CONTACTS,          labelEn: 'Contacts',            labelRu: 'Контакты',            icon: ContactRound },
      { path: APP_ROUTES.MC_PIPELINES,         labelEn: 'Pipelines',           labelRu: 'Воронки',             icon: Layers },
      { path: APP_ROUTES.MC_SALES,             labelEn: 'Sales Pipeline',      labelRu: 'Воронка продаж',      icon: TrendingUp },
      { path: APP_ROUTES.MC_OWNERS,            labelEn: 'Owners',              labelRu: 'Собственники',        icon: Crown },
      { path: APP_ROUTES.MC_VENDOR_ACQUISITION,labelEn: 'Vendor Acquisition',  labelRu: 'Привлечение вендоров',icon: Target },
      { path: APP_ROUTES.MC_SEQUENCES,         labelEn: 'Sequences',           labelRu: 'Цепочки',             icon: Zap },
      { path: APP_ROUTES.MC_QUOTES,            labelEn: 'Quotes',              labelRu: 'КП',                  icon: FileText },
    ],
  },
  {
    labelEn: 'Team', labelRu: 'Команда',
    items: [
      { path: APP_ROUTES.MC_STAFF,        labelEn: 'Staff & Access',         labelRu: 'Сотрудники',     icon: Users },
      { path: APP_ROUTES.MC_TEAM_SHIFTS,  labelEn: 'Shifts & Timesheets',    labelRu: 'Смены и табель', icon: CalendarClock },
      { path: APP_ROUTES.MC_APPROVALS,    labelEn: 'Approvals',              labelRu: 'Согласования',   icon: ShieldCheck },
      { path: APP_ROUTES.MC_PROCUREMENT,  labelEn: 'Procurement',            labelRu: 'Закупки',        icon: PackageOpen },
      { path: APP_ROUTES.MC_SUBSCRIPTION, labelEn: 'Subscription',           labelRu: 'Подписка',       icon: CreditCard },
      { path: APP_ROUTES.MC_HELP,         labelEn: 'Help Center',            labelRu: 'Справочник',     icon: BookOpen },
    ],
  },
  {
    labelEn: 'Developer', labelRu: 'Разработчику',
    items: [
      { path: APP_ROUTES.MC_ONBOARDING_WIZARD, labelEn: 'Setup Wizard', labelRu: 'Мастер настройки', icon: Rocket },
      { path: APP_ROUTES.MC_API_KEYS,          labelEn: 'API Keys',     labelRu: 'API ключи',        icon: Key },
      { path: APP_ROUTES.MC_WEBHOOKS,          labelEn: 'Webhooks',     labelRu: 'Webhooks',         icon: Webhook },
    ],
  },
];

const ADMIN_SIDEBAR: SidebarNavGroup[] = [
  {
    labelEn: 'Platform', labelRu: 'Платформа', defaultOpen: true,
    items: [
      { path: '/admin',                 labelEn: 'Dashboard',          labelRu: 'Обзор',         icon: LayoutDashboard },
      { path: '/admin/catalog',         labelEn: 'Catalog & Content',  labelRu: 'Каталог',       icon: Package, badgeKey: 'pendingContent' },
      { path: '/admin/operations',      labelEn: 'Operations',         labelRu: 'Операции',      icon: CalendarCheck },
      { path: '/admin/crm',             labelEn: 'CRM',                labelRu: 'CRM',           icon: UserCheck },
      { path: '/admin/providers',       labelEn: 'Partners',           labelRu: 'Партнёры',      icon: Building2, badgeKey: 'pendingProviders' },
    ],
  },
  {
    labelEn: 'Finance & Analytics', labelRu: 'Финансы и аналитика',
    items: [
      { path: '/admin/finance',         labelEn: 'Finance',            labelRu: 'Финансы',       icon: DollarSign },
      { path: '/admin/analytics',       labelEn: 'Analytics',          labelRu: 'Аналитика',     icon: BarChart3 },
    ],
  },
  {
    labelEn: 'System', labelRu: 'Система',
    items: [
      { path: '/admin/life-situations', labelEn: 'LifeOS',             labelRu: 'LifeOS',        icon: Sparkles },
      { path: '/admin/newbuilds',       labelEn: 'New Developments',   labelRu: 'Новостройки',   icon: Building2 },
      { path: '/admin/users',           labelEn: 'Users & Access',     labelRu: 'Пользователи',  icon: Users },
      { path: '/admin/settings',        labelEn: 'System Settings',    labelRu: 'Настройки',     icon: Settings },
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

const GUEST_PORTAL_SIDEBAR: SidebarNavGroup[] = [
  {
    labelEn: 'My Stay', labelRu: 'Мой визит', defaultOpen: true,
    items: [
      { path: '/my-stay',         labelEn: 'Dashboard',    labelRu: 'Обзор',              icon: Home },
      { path: '/bookings',        labelEn: 'My Bookings',  labelRu: 'Мои бронирования',   icon: CalendarCheck },
      { path: '/guest/messages',  labelEn: 'Messages',     labelRu: 'Сообщения',          icon: MessageCircle },
    ],
  },
  {
    labelEn: 'Services', labelRu: 'Услуги', defaultOpen: true,
    items: [
      { path: '/cleaning',  labelEn: 'Cleaning',  labelRu: 'Уборка',    icon: Sparkles },
      { path: '/transport', labelEn: 'Transport', labelRu: 'Транспорт', icon: Car },
      { path: '/delivery',  labelEn: 'Delivery',  labelRu: 'Доставка',  icon: ShoppingBag },
    ],
  },
  {
    labelEn: 'Property', labelRu: 'Объект',
    items: [
      { path: '/guest/guidebook', labelEn: 'Guidebook',   labelRu: 'Гайдбук',  icon: BookOpen },
      { path: '/guest/area',      labelEn: 'Area Guide',  labelRu: 'Район',    icon: MapPin },
      { path: '/guest/rules',     labelEn: 'House Rules', labelRu: 'Правила',  icon: ClipboardList },
    ],
  },
];

const TEAM_SIDEBAR: SidebarNavGroup[] = [
  {
    labelEn: 'Team Hub', labelRu: 'Команда', defaultOpen: true,
    items: [
      { path: APP_ROUTES.TEAM,             labelEn: 'Dashboard', labelRu: 'Обзор',     icon: LayoutDashboard },
      { path: APP_ROUTES.TEAM_CONTENT,     labelEn: 'Content',   labelRu: 'Контент',   icon: FileText },
      { path: APP_ROUTES.ADMIN_MODERATION, labelEn: 'Review',    labelRu: 'Проверка',  icon: FileCheck },
      { path: APP_ROUTES.ADMIN_CRM,        labelEn: 'CRM',       labelRu: 'CRM',       icon: Users },
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
  team:      TEAM_SIDEBAR,
};

export function hasSidebar(role: NavRoleKey): boolean {
  return SIDEBAR_NAV[role].length > 0;
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
