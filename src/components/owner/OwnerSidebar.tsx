import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2,
  CalendarDays,
  MessageCircle,
  DollarSign,
  ClipboardList,
  Settings,
  Plus,
  BarChart3,
  Star,
  Wrench,
  FileText,
  ChevronDown,
  LogOut,
  Home
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

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  labelRu: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigationGroups: NavGroup[] = [
  // 1. MAIN - Core functionality (always open)
  {
    label: 'Main',
    labelRu: 'Главное',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', titleRu: 'Обзор', path: '/owner', icon: LayoutDashboard },
      { title: 'My Properties', titleRu: 'Мои объекты', path: '/owner/properties', icon: Building2 },
      { title: 'Calendar', titleRu: 'Календарь', path: '/owner/calendar', icon: CalendarDays },
      { title: 'Messages', titleRu: 'Сообщения', path: '/owner/messages', icon: MessageCircle },
    ],
  },
  // 2. OPERATIONS - Daily tasks
  {
    label: 'Operations',
    labelRu: 'Операции',
    defaultOpen: false,
    items: [
      { title: 'Tasks', titleRu: 'Задачи', path: '/owner/operations', icon: ClipboardList },
      { title: 'Service Request', titleRu: 'Заявка на услугу', path: '/owner/service-request', icon: Wrench },
      { title: 'Inspection', titleRu: 'Осмотр', path: '/owner/inspection', icon: FileText },
    ],
  },
  // 3. FINANCE - Money management
  {
    label: 'Finance',
    labelRu: 'Финансы',
    defaultOpen: false,
    items: [
      { title: 'Financials', titleRu: 'Финансы', path: '/owner/financials', icon: DollarSign },
      { title: 'Quick Expense', titleRu: 'Быстрый расход', path: '/owner/expenses/quick', icon: Plus },
      { title: 'Portfolio', titleRu: 'Портфолио', path: '/owner/portfolio', icon: BarChart3 },
    ],
  },
  // 4. GROWTH - Improve performance
  {
    label: 'Growth',
    labelRu: 'Рост',
    defaultOpen: false,
    items: [
      { title: 'Reviews', titleRu: 'Отзывы', path: '/owner/reviews', icon: Star },
      { title: 'Superhost', titleRu: 'Суперхозяин', path: '/owner/superhost', icon: Star },
      { title: 'Channel Manager', titleRu: 'Каналы', path: '/owner/channels', icon: Settings },
      { title: 'Full Management', titleRu: 'Полное управление', path: '/owner/full-management', icon: Building2 },
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

  const isActive = (path: string) => {
    if (path === '/owner') {
      return location.pathname === '/owner';
    }
    return location.pathname.startsWith(path);
  };

  const getGroupDefaultOpen = (group: NavGroup) => {
    // Keep group open if any item in it is active
    return group.items.some(item => isActive(item.path)) || group.defaultOpen;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">
                {isRussian ? 'Мой дом' : 'My Home'}
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {isRussian ? 'Управление недвижимостью' : 'Property Management'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
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

      {/* Footer */}
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
