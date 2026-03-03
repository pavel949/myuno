import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users,
  Package, 
  Sparkles,
  DollarSign,
  Building2,
  Settings,
  LogOut,
  Badge as BadgeIcon,
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
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  badgeKey?: 'pendingContent' | 'pendingProviders';
}

const navigationItems: NavItem[] = [
  { title: 'Dashboard', titleRu: 'Обзор', path: '/admin', icon: LayoutDashboard },
  { title: 'Users & Access', titleRu: 'Пользователи', path: '/admin/users', icon: Users },
  { title: 'Catalog & Content', titleRu: 'Каталог', path: '/admin/catalog', icon: Package, badgeKey: 'pendingContent' },
  { title: 'LifeOS', titleRu: 'LifeOS', path: '/admin/life-situations', icon: Sparkles },
  { title: 'Finance', titleRu: 'Финансы', path: '/admin/finance', icon: DollarSign },
  { title: 'Partners', titleRu: 'Партнёры', path: '/admin/providers', icon: Building2, badgeKey: 'pendingProviders' },
  { title: 'System Settings', titleRu: 'Настройки', path: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: stats } = useAdminDashboardStats();
  
  const isCollapsed = isMobile ? false : state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  const getBadgeCount = (key?: 'pendingContent' | 'pendingProviders') => {
    if (!key || !stats) return 0;
    return stats[key] || 0;
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
              <span className="text-xs text-sidebar-foreground/60">Admin Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation — 7 flat items */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {navigationItems.map((item) => {
            const badgeCount = getBadgeCount(item.badgeKey);
            
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  onClick={() => handleNavigate(item.path)}
                  isActive={isActive(item.path)}
                  tooltip={isRussian ? item.titleRu : item.title}
                  className={cn(
                    "transition-all duration-200 h-10",
                    isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{isRussian ? item.titleRu : item.title}</span>
                  {!isCollapsed && badgeCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                      {badgeCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
