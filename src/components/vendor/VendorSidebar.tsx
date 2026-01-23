import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays,
  Package,
  BarChart3,
  DollarSign,
  Settings,
  ChevronDown,
  LogOut,
  Store,
  Ship,
  Car,
  Sparkles,
  Dumbbell,
  Stethoscope,
  GraduationCap,
  PawPrint,
  Flower2,
  UtensilsCrossed,
  Calendar,
  Scale,
  Baby,
  MapPin
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
    label: 'Main',
    labelRu: 'Главное',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', titleRu: 'Обзор', path: '/vendor', icon: LayoutDashboard },
      { title: 'Bookings', titleRu: 'Заказы', path: '/vendor/bookings', icon: CalendarDays },
      { title: 'Services', titleRu: 'Услуги', path: '/vendor/services', icon: Package },
      { title: 'Locations', titleRu: 'Локации', path: '/vendor/locations', icon: MapPin },
    ],
  },
  {
    label: 'Finance',
    labelRu: 'Финансы',
    defaultOpen: false,
    items: [
      { title: 'Analytics', titleRu: 'Аналитика', path: '/vendor/analytics', icon: BarChart3 },
      { title: 'Payouts', titleRu: 'Выплаты', path: '/vendor/payouts', icon: DollarSign },
      { title: 'Subscription', titleRu: 'Подписка', path: '/vendor/subscription', icon: Settings },
    ],
  },
  {
    label: 'Verticals',
    labelRu: 'Вертикали',
    defaultOpen: false,
    items: [
      { title: 'Properties', titleRu: 'Недвижимость', path: '/vendor/properties', icon: Store },
      { title: 'Yachts', titleRu: 'Яхты', path: '/vendor/yachts', icon: Ship },
      { title: 'Transport', titleRu: 'Транспорт', path: '/vendor/transport', icon: Car },
      { title: 'Tours', titleRu: 'Туры', path: '/vendor/tours', icon: Calendar },
      { title: 'Activities', titleRu: 'Активности', path: '/vendor/activities', icon: Calendar },
    ],
  },
  {
    label: 'Services',
    labelRu: 'Сервисы',
    defaultOpen: false,
    items: [
      { title: 'Beauty', titleRu: 'Красота', path: '/vendor/beauty', icon: Sparkles },
      { title: 'Fitness', titleRu: 'Фитнес', path: '/vendor/fitness', icon: Dumbbell },
      { title: 'Clinics', titleRu: 'Клиники', path: '/vendor/clinics', icon: Stethoscope },
      { title: 'Restaurants', titleRu: 'Рестораны', path: '/vendor/restaurants', icon: UtensilsCrossed },
      { title: 'Events', titleRu: 'Мероприятия', path: '/vendor/events', icon: Calendar },
      { title: 'Education', titleRu: 'Образование', path: '/vendor/education', icon: GraduationCap },
      { title: 'Legal', titleRu: 'Юридические', path: '/vendor/legal', icon: Scale },
      { title: 'Pets', titleRu: 'Питомцы', path: '/vendor/pets', icon: PawPrint },
      { title: 'Cleaning', titleRu: 'Клининг', path: '/vendor/cleaning', icon: Sparkles },
      { title: 'Babysitters', titleRu: 'Няни', path: '/vendor/babysitters', icon: Baby },
      { title: 'Flowers', titleRu: 'Цветы', path: '/vendor/flowers', icon: Flower2 },
    ],
  },
];

export function VendorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/vendor') {
      return location.pathname === '/vendor';
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
            <Store className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">
                {isRussian ? 'Мой бизнес' : 'My Business'}
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {isRussian ? 'Панель поставщика' : 'Vendor Panel'}
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
              {user?.email?.charAt(0).toUpperCase() || 'V'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.name || (isRussian ? 'Поставщик' : 'Vendor')}
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
