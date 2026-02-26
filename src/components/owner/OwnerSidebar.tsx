import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, 
  Building2,
  CalendarDays,
  DollarSign,
  Users,
  LogOut,
  ContactRound,
  Home,
  ChevronDown,
  TrendingUp,
  Wrench,
  ClipboardList,
  PackageOpen,
  FileText,
  UserCog,
  Receipt,
  Settings,
  Tag,
  Star,
  ShieldCheck,
  BarChart3,
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

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  label: string;
  labelRu: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

/**
 * 5 logical groups, no duplicates:
 * 1. Main — Dashboard, Properties, Calendar (daily operational core)
 * 2. CRM — Sales Pipeline, Contacts (revenue generation)
 * 3. Operations — Tasks, Inventory, Vendors (field work)
 * 4. Finance — Income/Expenses, Invoices, Reports (money tracking)
 * 5. Team — Staff directory + MC members/delegation (people management)
 */
const navigationGroups: NavGroup[] = [
  {
    label: 'Main',
    labelRu: 'Главное',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', titleRu: 'Обзор', path: '/owner', icon: LayoutDashboard },
      { title: 'Properties', titleRu: 'Объекты', path: '/owner/properties', icon: Building2 },
      { title: 'Calendar', titleRu: 'Календарь', path: '/owner/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'CRM & Sales',
    labelRu: 'CRM и продажи',
    defaultOpen: false,
    items: [
      { title: 'Sales Pipeline', titleRu: 'Воронка продаж', path: '/owner/sales', icon: TrendingUp },
      { title: 'Contacts', titleRu: 'Контакты', path: '/owner/contacts', icon: ContactRound },
      { title: 'CRM Settings', titleRu: 'Настройки CRM', path: '/owner/sales/settings', icon: Settings },
    ],
  },
  {
    label: 'Operations',
    labelRu: 'Операции',
    defaultOpen: false,
    items: [
      { title: 'Tasks', titleRu: 'Задачи', path: '/owner/operations', icon: Wrench },
      { title: 'Inventory', titleRu: 'Инвентарь', path: '/owner/inventory', icon: PackageOpen },
      { title: 'Vendors', titleRu: 'Поставщики', path: '/owner/vendors', icon: Building2 },
    ],
  },
  {
    label: 'Commerce',
    labelRu: 'Коммерция',
    defaultOpen: false,
    items: [
      { title: 'Rate Seasons', titleRu: 'Тарифы', path: '/owner/rates', icon: Tag },
      { title: 'Reviews', titleRu: 'Отзывы', path: '/owner/reviews-management', icon: Star },
      { title: 'Insurance & Docs', titleRu: 'Страховки и документы', path: '/owner/insurance', icon: ShieldCheck },
    ],
  },
  {
    label: 'Finance',
    labelRu: 'Финансы',
    defaultOpen: false,
    items: [
      { title: 'Income & Expenses', titleRu: 'Доходы и расходы', path: '/owner/financials', icon: DollarSign },
      { title: 'Invoices', titleRu: 'Счета', path: '/owner/invoices', icon: Receipt },
      { title: 'Analytics', titleRu: 'Аналитика', path: '/owner/analytics', icon: ClipboardList },
    ],
  },
  {
    label: 'Team',
    labelRu: 'Команда',
    defaultOpen: false,
    items: [
      { title: 'Staff & Access', titleRu: 'Сотрудники и доступ', path: '/owner/staff', icon: Users },
    ],
  },
];

export function OwnerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { activeCompany } = useActiveCompany();
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
        {navigationGroups.map((group) => (
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
                    {group.items.map((item) => (
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
                          {item.badge && item.badge > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
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
