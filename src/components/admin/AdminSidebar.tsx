import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Cog,
  Layers,
  LogOut,
  ChevronRight,
  Bot,
  Inbox,
  UserPlus
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  description: string;
  descriptionRu: string;
}

// 5 mega-sections as per the plan
const navigationItems: NavItem[] = [
  { 
    title: 'Dashboard', 
    titleRu: 'Дашборд', 
    path: '/admin', 
    icon: LayoutDashboard,
    description: 'KPIs, alerts, overview',
    descriptionRu: 'KPI, алерты, обзор'
  },
  { 
    title: 'Catalog', 
    titleRu: 'Каталог', 
    path: '/admin/catalog', 
    icon: Package,
    description: 'All services & products',
    descriptionRu: 'Все объекты и товары'
  },
  { 
    title: 'Operations', 
    titleRu: 'Операции', 
    path: '/admin/operations', 
    icon: Layers,
    description: 'Moderation, leads, bookings',
    descriptionRu: 'Модерация, лиды, заказы'
  },
  { 
    title: 'Intake', 
    titleRu: 'Приём', 
    path: '/admin/intake', 
    icon: Inbox,
    description: 'AI listing creation',
    descriptionRu: 'AI-создание листингов'
  },
  { 
    title: 'AI Agents', 
    titleRu: 'AI Агенты', 
    path: '/admin/ai-agents', 
    icon: Bot,
    description: 'Manage AI assistants',
    descriptionRu: 'Управление AI-агентами'
  },
  { 
    title: 'Acquisition', 
    titleRu: 'Привлечение', 
    path: '/admin/vendor-prospects', 
    icon: UserPlus,
    description: 'Vendor prospecting',
    descriptionRu: 'Привлечение вендоров'
  },
  { 
    title: 'Control', 
    titleRu: 'Управление', 
    path: '/admin/control', 
    icon: Cog,
    description: 'Users, analytics, system',
    descriptionRu: 'Пользователи, аналитика'
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state, isMobile, openMobile } = useSidebar();
  
  // On mobile, always show full content when sidebar is open
  // On desktop, respect the collapsed state
  const isCollapsed = isMobile ? false : state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg shadow-sm">
            m
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-lg">myUNO</span>
              <span className="text-xs text-sidebar-foreground/60">Command Center</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation - 4 main sections */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-2">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => navigate(item.path)}
                isActive={isActive(item.path)}
                tooltip={isRussian ? item.titleRu : item.title}
                className={cn(
                  "h-auto py-3 px-3 transition-all duration-200 rounded-xl",
                  isActive(item.path) 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-sidebar-accent"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                    isActive(item.path) 
                      ? "bg-primary-foreground/20" 
                      : "bg-sidebar-accent"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-sm">
                        {isRussian ? item.titleRu : item.title}
                      </span>
                      <span className={cn(
                        "text-xs truncate",
                        isActive(item.path) 
                          ? "text-primary-foreground/70" 
                          : "text-sidebar-foreground/60"
                      )}>
                        {isRussian ? item.descriptionRu : item.description}
                      </span>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0",
                      isActive(item.path) 
                        ? "text-primary-foreground/50" 
                        : "text-sidebar-foreground/30"
                    )} />
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.name || 'Admin'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
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
