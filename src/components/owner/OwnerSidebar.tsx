import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Crown,
  CreditCard,
  DollarSign,
  Users,
  Zap,
  FileText as FileTextIcon,
  Calendar,
  BarChart3 as DashboardIcon,
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
  Search,
  Globe,
  Shuffle,
  ArrowLeftRight,
  Target,
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
      { title: 'Portfolio', titleRu: 'Портфолио', path: '/owner/portfolio', icon: Building2 },
      { title: 'Finance', titleRu: 'Финансы', path: '/owner/finance', icon: DollarSign },
      { title: 'Guide', titleRu: 'Руководство', path: '/owner/guide', icon: BookOpen },
    ],
  },
  {
    label: 'Services',
    labelRu: 'Услуги',
    defaultOpen: false,
    items: [
      { title: 'Service Request', titleRu: 'Заявка', path: '/owner/service-request', icon: Wrench },
      { title: 'Inspection', titleRu: 'Осмотр', path: '/owner/inspection', icon: ClipboardList },
      { title: 'Full Management', titleRu: 'Полное управление', path: '/owner/full-management', icon: Settings },
    ],
  },
  {
    label: 'MC Workspace',
    labelRu: 'Рабочее пространство УК',
    defaultOpen: false,
    items: [
      { title: 'Go to MC Dashboard', titleRu: 'Перейти в панель УК', path: '/mc', icon: Home },
    ],
  },
];

// Simplified path-to-module map for owner-only pages
const PATH_TO_MODULE: Record<string, ModuleKey> = {
  '/owner/finance': 'finance',
};

export function OwnerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state, setOpenMobile, isMobile } = useSidebar();
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

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  const renderNavItem = (item: NavItem) => {
    const badgeCount = getBadgeCount(item.badgeKey);
    const active = isActive(item.path);
    return (
      <SidebarMenuItem key={item.path}>
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
