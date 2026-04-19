import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CalendarDays, Crown, CreditCard, DollarSign,
  Users, Zap, FileText as FileTextIcon, BarChart3, CalendarCheck,
  ContactRound, Home, ChevronDown, TrendingUp, PackageOpen,
  Receipt, Settings, Tag, Star, ShieldCheck, MessageSquare, Radio,
  BookOpen, FileText, Megaphone, Truck, ClipboardList, Shuffle,
  ArrowLeftRight, Target, Layers, LineChart,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { useTeamPermissions, type ModuleKey } from '@/hooks/useTeamPermissions';
import { useTodayTasksCount } from '@/hooks/useCrmTasks';
import { useProfile } from '@/hooks/useProfile';
import { APP_ROUTES } from '@/lib/config/routes';

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  badgeKey?: 'tasks' | 'messages';
}

interface NavGroup {
  label: string;
  labelRu: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export const navigationGroups: NavGroup[] = [
  {
    label: 'Control Tower',
    labelRu: 'Центр управления',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', titleRu: 'Обзор', path: APP_ROUTES.MC, icon: LayoutDashboard },
      { title: 'Bookings', titleRu: 'Бронирования', path: APP_ROUTES.MC_BOOKINGS_LIST, icon: CalendarCheck },
      { title: 'Calendar', titleRu: 'Календарь', path: APP_ROUTES.MC_CALENDAR, icon: CalendarDays },
      { title: 'Tasks', titleRu: 'Задачи', path: APP_ROUTES.MC_TASKS, icon: ClipboardList, badgeKey: 'tasks' },
      { title: 'Messages', titleRu: 'Сообщения', path: APP_ROUTES.MC_MESSAGES, icon: MessageSquare, badgeKey: 'messages' },
    ],
  },
  {
    label: 'Insights',
    labelRu: 'Аналитика',
    defaultOpen: false,
    items: [
      { title: 'Performance', titleRu: 'Показатели', path: APP_ROUTES.MC_PERFORMANCE, icon: BarChart3 },
      { title: 'Reviews', titleRu: 'Отзывы', path: APP_ROUTES.MC_REVIEWS, icon: Star },
    ],
  },
  {
    label: 'Properties',
    labelRu: 'Объекты',
    defaultOpen: false,
    items: [
      { title: 'Properties', titleRu: 'Объекты', path: APP_ROUTES.MC_PROPERTIES, icon: Building2 },
      { title: 'Inventory', titleRu: 'Инвентарь', path: APP_ROUTES.MC_INVENTORY, icon: PackageOpen },
      { title: 'Vendors', titleRu: 'Поставщики', path: APP_ROUTES.MC_VENDORS, icon: Truck },
    ],
  },
  {
    label: 'Operations',
    labelRu: 'Операции',
    defaultOpen: false,
    items: [
      { title: 'Rate Seasons', titleRu: 'Тарифы', path: APP_ROUTES.MC_RATES, icon: Tag },
      { title: 'Insurance & Docs', titleRu: 'Страховки и документы', path: APP_ROUTES.MC_INSURANCE, icon: ShieldCheck },
      { title: 'Templates', titleRu: 'Шаблоны', path: APP_ROUTES.MC_DOCUMENTS, icon: FileText },
    ],
  },
  {
    label: 'Distribution',
    labelRu: 'Дистрибуция',
    defaultOpen: false,
    items: [
      { title: 'Channel Manager', titleRu: 'Channel Manager', path: APP_ROUTES.MC_CHANNELS, icon: Radio },
    ],
  },
  {
    label: 'Finance',
    labelRu: 'Финансы',
    defaultOpen: false,
    items: [
      { title: 'Overview', titleRu: 'Обзор', path: APP_ROUTES.MC_FINANCE, icon: DollarSign },
      { title: 'Owner Payouts', titleRu: 'Выплаты собственникам', path: APP_ROUTES.MC_OWNER_PAYOUTS, icon: Shuffle },
      { title: 'AR Aging', titleRu: 'Дебиторка', path: APP_ROUTES.MC_AR_AGING, icon: Receipt },
      { title: 'Trust Accounts', titleRu: 'Эскроу-счета', path: APP_ROUTES.MC_TRUST_ACCOUNTS, icon: ShieldCheck },
      { title: 'Tax Center', titleRu: 'Налоги (Thai)', path: APP_ROUTES.MC_TAX_CENTER, icon: Target },
      { title: 'Transactions', titleRu: 'Транзакции', path: APP_ROUTES.MC_FINANCIALS, icon: ArrowLeftRight },
      { title: 'Reports', titleRu: 'Отчёты', path: APP_ROUTES.MC_REPORTS, icon: BarChart3 },
      { title: 'Budget', titleRu: 'Бюджет', path: APP_ROUTES.MC_BUDGET, icon: Target },
      { title: 'Financial Planning', titleRu: 'Финансовое планирование', path: APP_ROUTES.MC_FINANCE_PLANNING, icon: LineChart },
      { title: 'Invoices', titleRu: 'Инвойсы', path: APP_ROUTES.MC_INVOICES, icon: Receipt },
      { title: 'Management Terms', titleRu: 'Условия управления', path: APP_ROUTES.MC_MANAGEMENT_TERMS, icon: Layers },
    ],
  },
  {
    label: 'CRM & Sales',
    labelRu: 'CRM и продажи',
    defaultOpen: false,
    items: [
      { title: 'CRM Dashboard', titleRu: 'CRM Обзор', path: APP_ROUTES.MC_CRM_DASHBOARD, icon: BarChart3 },
      { title: 'Contacts', titleRu: 'Контакты', path: APP_ROUTES.MC_CONTACTS, icon: ContactRound },
      { title: 'Pipelines', titleRu: 'Воронки', path: APP_ROUTES.MC_PIPELINES, icon: Layers },
      { title: 'Sales Pipeline', titleRu: 'Воронка продаж', path: APP_ROUTES.MC_SALES, icon: TrendingUp },
      { title: 'Owners', titleRu: 'Собственники', path: APP_ROUTES.MC_OWNERS, icon: Crown },
      { title: 'Vendor Acquisition', titleRu: 'Привлечение вендоров', path: APP_ROUTES.MC_VENDOR_ACQUISITION, icon: Target },
      { title: 'Sequences', titleRu: 'Цепочки', path: APP_ROUTES.MC_SEQUENCES, icon: Zap },
      { title: 'Quotes', titleRu: 'КП', path: APP_ROUTES.MC_QUOTES, icon: FileTextIcon },
    ],
  },
  {
    label: 'Team',
    labelRu: 'Команда',
    defaultOpen: false,
    items: [
      { title: 'Staff & Access', titleRu: 'Сотрудники', path: APP_ROUTES.MC_STAFF, icon: Users },
      { title: 'Subscription', titleRu: 'Подписка', path: APP_ROUTES.MC_SUBSCRIPTION, icon: CreditCard },
      { title: 'Help Center', titleRu: 'Справочник', path: APP_ROUTES.MC_HELP, icon: BookOpen },
    ],
  },
];

const PATH_TO_MODULE: Record<string, ModuleKey> = {
  [APP_ROUTES.MC_PROPERTIES]: 'properties',
  [APP_ROUTES.MC_OWNERS]: 'crm',
  [APP_ROUTES.MC_CALENDAR]: 'bookings',
  [APP_ROUTES.MC_SALES]: 'crm',
  [APP_ROUTES.MC_CONTACTS]: 'crm',
  [APP_ROUTES.MC_CRM_DASHBOARD]: 'crm',
  [APP_ROUTES.MC_SEQUENCES]: 'crm',
  [APP_ROUTES.MC_QUOTES]: 'crm',
  [APP_ROUTES.MC_REVIEWS]: 'crm',
  [APP_ROUTES.MC_PERFORMANCE]: 'reports',
  [APP_ROUTES.MC_SETTINGS]: 'staff',
  [APP_ROUTES.MC_MARKETING]: 'crm',
  [APP_ROUTES.MC_VENDOR_ACQUISITION]: 'crm',
  [APP_ROUTES.MC_TASKS]: 'tasks',
  [APP_ROUTES.MC_INVENTORY]: 'properties',
  [APP_ROUTES.MC_VENDORS]: 'properties',
  [APP_ROUTES.MC_RATES]: 'finance',
  [APP_ROUTES.MC_FINANCE]: 'finance',
  [APP_ROUTES.MC_MANAGEMENT_TERMS]: 'finance',
  [APP_ROUTES.MC_FINANCIALS]: 'finance',
  [APP_ROUTES.MC_INVOICES]: 'finance',
  [APP_ROUTES.MC_REPORTS]: 'reports',
  [APP_ROUTES.MC_BUDGET]: 'finance',
  [APP_ROUTES.MC_STAFF]: 'staff',
};

export function MCSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user } = useAuth();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { activeCompany } = useActiveCompany();
  const { role: resolvedRole } = useResolvedContext();
  const { canAccess } = useTeamPermissions();
  const { data: todayTasksCount } = useTodayTasksCount();
  const { profile } = useProfile();

  const companyName = activeCompany
    ? (isRussian ? activeCompany.name_ru : activeCompany.name_en)
    : 'myUNO MC';

  const isActive = (path: string) => {
    if (path === APP_ROUTES.MC) return location.pathname === APP_ROUTES.MC;
    return location.pathname.startsWith(path);
  };

  const getGroupDefaultOpen = (group: NavGroup) => {
    return group.items.some(item => isActive(item.path)) || group.defaultOpen;
  };

  const getBadgeCount = (key?: 'tasks' | 'messages'): number => {
    if (key === 'tasks') return todayTasksCount || 0;
    return 0;
  };

  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const module = PATH_TO_MODULE[item.path];
      if (!module) return true;
      return canAccess(module, 'view');
    }),
  })).filter(group => group.items.length > 0);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  const renderNavItem = (item: NavItem) => {
    const badgeCount = getBadgeCount(item.badgeKey);
    const active = isActive(item.path);
    return (
      <SidebarMenuItem key={`${item.path}-${item.title}`}>
        <SidebarMenuButton
          onClick={() => handleNavigate(item.path)}
          isActive={active}
          tooltip={isRussian ? item.titleRu : item.title}
          className={cn(
            "transition-all duration-200 gap-3",
            active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          )}
        >
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            active ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"
          )}>
            <item.icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
          </div>
          <span>{isRussian ? item.titleRu : item.title}</span>
          {badgeCount > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground px-1">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity w-full text-left"
          title={isRussian ? 'На главную' : 'Back to Home'}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sidebar-foreground truncate">{companyName}</span>
              <span className="text-xs text-sidebar-foreground/60">
                {isRussian ? '← На главную' : '← Back to Home'}
              </span>
            </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredGroups.map((group) => (
          <Collapsible key={group.label} defaultOpen={getGroupDefaultOpen(group)} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 flex items-center justify-between text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                  {isRussian ? group.labelRu : group.label}
                  {!isCollapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>{group.items.map(renderNavItem)}</SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* Settings — standalone, respects RBAC */}
        {canAccess('staff', 'view') && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItem({
                  title: 'Settings',
                  titleRu: 'Настройки',
                  path: APP_ROUTES.MC_SETTINGS,
                  icon: Settings,
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <button
          onClick={() => handleNavigate(APP_ROUTES.MC_ACCOUNT_SETTINGS)}
          className="flex items-center gap-3 w-full rounded-md hover:bg-sidebar-accent p-1 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'M'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || user?.email?.split('@')[0] || (isRussian ? 'Пользователь' : 'User')}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
