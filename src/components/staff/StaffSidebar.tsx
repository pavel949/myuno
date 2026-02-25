import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Star,
  Settings,
  LogOut,
  User,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { title: 'Dashboard', titleRu: 'Обзор', path: '/staff', icon: LayoutDashboard },
  { title: 'Tasks', titleRu: 'Задания', path: '/staff/tasks', icon: ClipboardList },
  { title: 'Calendar', titleRu: 'Календарь', path: '/staff/calendar', icon: Calendar },
  { title: 'Reviews', titleRu: 'Отзывы', path: '/staff/reviews', icon: Star },
  { title: 'Settings', titleRu: 'Настройки', path: '/staff/settings', icon: Settings },
];

export function StaffSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { open } = useSidebar();
  const isRu = language === 'ru';

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className={cn("flex items-center gap-3", !open && "justify-center")}>
          <div className="p-1.5 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          {open && (
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">
                {isRu ? 'Панель исполнителя' : 'Staff Panel'}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isRu ? 'Навигация' : 'Navigation'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    tooltip={isRu ? item.titleRu : item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{isRu ? item.titleRu : item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip={isRu ? 'Выйти' : 'Sign Out'}>
              <LogOut className="h-4 w-4" />
              <span>{isRu ? 'Выйти' : 'Sign Out'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
