import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Crown,
  DollarSign,
  Users,
  LogOut,
  ContactRound,
  Home,
  ChevronDown,
  TrendingUp,
  Wrench,
  PackageOpen,
  Receipt,
  Settings,
  Tag,
  Star,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  Radio,
  BookOpen,
  FileText,
  Megaphone,
  Truck,
  ClipboardList,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useTeamPermissions, type ModuleKey } from '@/hooks/useTeamPermissions';
import { useTodayTasksCount } from '@/hooks/useCrmTasks';

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
  /** Items always visible even when group is collapsed */
  pinned?: boolean;
}

/**
 * 5 logical groups:
 * 1. Main — Dashboard, Properties, Calendar, Messages (daily operational core)
 * 2. CRM — Owners, Contacts, Sales, Reviews, Marketing
 * 3. Operations — Tasks, Channels, Inventory, Vendors, Insurance, Docs
 * 4. Finance — Rates, Income/Expenses, Invoices, Reports
 * 5. Team — Staff, Guide
 */
const navigationGroups: NavGroup[] = [
  {
    label: 'Main',
    labelRu: 'Главное',
    defaultOpen: true,
    pinned: true,
    items: [
      { title: 'Dashboard', titleRu: 'Обзор', path: '/owner', icon: LayoutDashboard },
      { title: 'Properties', titleRu: 'Объекты', path: '/owner/properties', icon: Building2 },
      { title: 'Calendar', titleRu: 'Календарь', path: '/owner/calendar', icon: CalendarDays },
      { title: 'Messages', titleRu: 'Сообщения', path: '/owner/messages', icon: MessageSquare, badgeKey: 'messages' },
    ],
  },
  {
    label: 'CRM & Sales',
    labelRu: 'CRM и продажи',
    defaultOpen: false,
    items: [
      { title: 'Owners', titleRu: 'Собственники', path: '/owner/owners', icon: Crown },
      { title: 'Contacts', titleRu: 'Контакты', path: '/owner/contacts', icon: ContactRound },
      { title: 'Sales Pipeline', titleRu: 'Воронка продаж', path: '/owner/sales', icon: TrendingUp },
      { title: 'Reviews', titleRu: 'Отзывы', path: '/owner/reviews-management', icon: Star },
      { title: 'Marketing', titleRu: 'Маркетинг', path: '/owner/marketing', icon: Megaphone },
      { title: 'CRM Settings', titleRu: 'Настройки CRM', path: '/owner/sales/settings', icon: Settings },
    ],
  },
  {
    label: 'Operations',
    labelRu: 'Операции',
    defaultOpen: false,
    items: [
      { title: 'Tasks', titleRu: 'Задачи', path: '/owner/tasks', icon: ClipboardList, badgeKey: 'tasks' },
      { title: 'Channel Manager', titleRu: 'Каналы', path: '/owner/channels', icon: Radio },
      { title: 'Inventory', titleRu: 'Инвентарь', path: '/owner/inventory', icon: PackageOpen },
      { title: 'Vendors', titleRu: 'Поставщики', path: '/owner/vendors', icon: Truck },
      { title: 'Insurance & Docs', titleRu: 'Страховки и документы', path: '/owner/insurance', icon: ShieldCheck },
      { title: 'Templates', titleRu: 'Шаблоны', path: '/owner/documents', icon: FileText },
    ],
  },
  {
    label: 'Finance',
    labelRu: 'Финансы',
    defaultOpen: false,
    items: [
      { title: 'Rate Seasons', titleRu: 'Тарифы', path: '/owner/rates', icon: Tag },
      { title: 'Income & Expenses', titleRu: 'Доходы и расходы', path: '/owner/financials', icon: DollarSign },
      { title: 'Invoices', titleRu: 'Счета', path: '/owner/invoices', icon: Receipt },
      { title: 'Analytics & Reports', titleRu: 'Аналитика', path: '/owner/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Team',
    labelRu: 'Команда',
    defaultOpen: false,
    items: [
      { title: 'Staff & Access', titleRu: 'Сотрудники', path: '/owner/staff', icon: Users },
      { title: 'Owner Guide', titleRu: 'Руководство', path: '/owner/guide', icon: BookOpen },
    ],
  },
];

// Map paths to permission modules for filtering
const PATH_TO_MODULE: Record<string, ModuleKey> = {
  '/owner/properties': 'properties',
  '/owner/owners': 'crm',
  '/owner/calendar': 'bookings',
  '/owner/sales': 'crm',
  '/owner/contacts': 'crm',
  '/owner/reviews-management': 'crm',
  '/owner/sales/settings': 'crm',
  '/owner/marketing': 'crm',
  '/owner/tasks': 'tasks',
  '/owner/inventory': 'properties',
  '/owner/vendors': 'properties',
  '/owner/rates': 'finance',
  '/owner/financials': 'finance',
  '/owner/invoices': 'finance',
  '/owner/analytics': 'reports',
  '/owner/staff': 'staff',
};

export function OwnerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { activeCompany } = useActiveCompany();
  const { canAccess } = useTeamPermissions();
  const { data: todayTasksCount } = useTodayTasksCount();

  const companyName = activeCompany
    ? (isRussian ? activeCompany.name_ru : activeCompany.name_en)
    : 'myUNO';

  const isActive = (path: string) => {
    if (path === '/owner') return location.pathname === '/owner';
    return location.pathname.startsWith(path);
  };

  const getGroupDefaultOpen = (group: NavGroup) => {
    return group.items.some(item => isActive(item.path)) || group.defaultOpen;
  };

  const getBadgeCount = (key?: 'tasks' | 'messages'): number => {
    if (key === 'tasks') return todayTasksCount || 0;
    return 0;
  };

  // Filter nav items based on team permissions
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const module = PATH_TO_MODULE[item.path];
      if (!module) return true;
      return canAccess(module, 'view');
    }),
  })).filter(group => group.items.length > 0);

  const renderNavItem = (item: NavItem) => {
    const badgeCount = getBadgeCount(item.badgeKey);
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          onClick={() => navigate(item.path)}
          isActive={isActive(item.path)}
          tooltip={isRussian ? item.titleRu : item.title}
          className={cn(
            "transition-all duration-200",
            isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          )}
        >
          <item.icon className="h-4 w-4" />
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
              <span className="font-semibold text-sidebar-foreground truncate">
                {companyName}
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {isRussian ? '← На главную' : '← Back to Home'}
              </span>
            </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredGroups.map((group) => (
          <Collapsible
            key={group.label}
            defaultOpen={getGroupDefaultOpen(group)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 flex items-center justify-between text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                  {isRussian ? group.labelRu : group.label}
                  {!isCollapsed && (
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(renderNavItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'O'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.name || (isRussian ? 'Владелец' : 'Owner')}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              title={isRussian ? 'Выйти' : 'Sign out'}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
