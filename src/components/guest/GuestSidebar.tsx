import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CalendarCheck,
  MessageCircle,
  ClipboardList,
  MapPin,
  BookOpen,
  Settings,
  Star,
  ChevronDown,
  LogOut,
  Sparkles,
  Car,
  ShoppingBag
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
  {
    label: 'My Stay',
    labelRu: 'Мой визит',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', titleRu: 'Обзор', path: '/my-stay', icon: Home },
      { title: 'My Bookings', titleRu: 'Мои бронирования', path: '/bookings', icon: CalendarCheck },
      { title: 'Messages', titleRu: 'Сообщения', path: '/guest/messages', icon: MessageCircle },
    ],
  },
  {
    label: 'Services',
    labelRu: 'Услуги',
    defaultOpen: true,
    items: [
      { title: 'Cleaning', titleRu: 'Уборка', path: '/cleaning', icon: Sparkles },
      { title: 'Transport', titleRu: 'Транспорт', path: '/transport', icon: Car },
      { title: 'Delivery', titleRu: 'Доставка', path: '/delivery', icon: ShoppingBag },
    ],
  },
  {
    label: 'Property',
    labelRu: 'Объект',
    defaultOpen: false,
    items: [
      { title: 'Guidebook', titleRu: 'Гайдбук', path: '/guest/guidebook', icon: BookOpen },
      { title: 'Area Guide', titleRu: 'Район', path: '/guest/area', icon: MapPin },
      { title: 'House Rules', titleRu: 'Правила', path: '/guest/rules', icon: ClipboardList },
    ],
  },
  {
    label: 'Account',
    labelRu: 'Аккаунт',
    defaultOpen: false,
    items: [
      { title: 'My Reviews', titleRu: 'Мои отзывы', path: '/guest/reviews', icon: Star },
      { title: 'Settings', titleRu: 'Настройки', path: '/profile/settings', icon: Settings },
    ],
  },
];

export function GuestSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/my-stay') {
      return location.pathname === '/my-stay';
    }
    return location.pathname.startsWith(path);
  };

  const getGroupDefaultOpen = (group: NavGroup) => {
    return group.items.some(item => isActive(item.path)) || group.defaultOpen;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">
                {isRussian ? 'Мой визит' : 'My Stay'}
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {isRussian ? 'Гостевой портал' : 'Guest Portal'}
              </span>
            </div>
          )}
        </div>
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
              {user?.email?.charAt(0).toUpperCase() || 'G'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.name || (isRussian ? 'Гость' : 'Guest')}
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
