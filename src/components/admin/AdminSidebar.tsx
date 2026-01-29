import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Building2,
  Ship,
  Compass,
  Home,
  Utensils,
  Scissors,
  Stethoscope,
  Dumbbell,
  Car,
  Calendar,
  GraduationCap,
  Scale,
  PawPrint,
  SprayCan,
  Baby,
  Flower2,
  Pill,
  Store,
  Shield,
  Waves,
  Globe,
  DollarSign,
  MessageSquare,
  UserCheck,
  FileText,
  ClipboardList,
  Presentation,
  Rocket,
  Flag,
  ChevronDown,
  LogOut,
  ShoppingCart,
  Grid3X3,
  List,
  BadgeCheck
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
  // 1. OPERATIONS - Daily work (always open)
  {
    label: 'Operations',
    labelRu: 'Операции',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', titleRu: 'Дашборд', path: '/admin', icon: LayoutDashboard },
      { title: 'Moderation', titleRu: 'Модерация', path: '/admin/moderation', icon: FileText },
      { title: 'Leads', titleRu: 'Лиды', path: '/admin/leads', icon: UserCheck },
      { title: 'Tickets', titleRu: 'Тикеты', path: '/admin/tickets', icon: ClipboardList },
      { title: 'Consultations', titleRu: 'Консультации', path: '/admin/consultations', icon: MessageSquare },
      { title: 'Operations Hub', titleRu: 'Центр операций', path: '/admin/operations', icon: Building2 },
    ],
  },
  // 2. CATALOG - All verticals grouped logically
  {
    label: 'Catalog',
    labelRu: 'Каталог',
    defaultOpen: false,
    items: [
      // Travel & Leisure
      { title: 'Properties', titleRu: 'Недвижимость', path: '/admin/properties', icon: Home },
      { title: 'Yachts', titleRu: 'Яхты', path: '/admin/yachts', icon: Ship },
      { title: 'Tours & Activities', titleRu: 'Туры', path: '/admin/tours', icon: Compass },
      { title: 'Water Sports', titleRu: 'Вода', path: '/admin/water-activities', icon: Waves },
      { title: 'Events', titleRu: 'События', path: '/admin/events', icon: Calendar },
      // Food & Beauty
      { title: 'Restaurants', titleRu: 'Рестораны', path: '/admin/restaurants', icon: Utensils },
      { title: 'Salons', titleRu: 'Салоны', path: '/admin/salons', icon: Scissors },
      { title: 'Gyms', titleRu: 'Фитнес', path: '/admin/gyms', icon: Dumbbell },
      { title: 'Flowers', titleRu: 'Цветы', path: '/admin/flowers', icon: Flower2 },
    ],
  },
  {
    label: 'Health & Home',
    labelRu: 'Здоровье и дом',
    defaultOpen: false,
    items: [
      // Health
      { title: 'Clinics', titleRu: 'Клиники', path: '/admin/clinics', icon: Stethoscope },
      { title: 'Pharmacies', titleRu: 'Аптеки', path: '/admin/pharmacies', icon: Pill },
      { title: 'Pets', titleRu: 'Питомцы', path: '/admin/pets', icon: PawPrint },
      // Home
      { title: 'Cleaning', titleRu: 'Уборка', path: '/admin/cleaning', icon: SprayCan },
      { title: 'Babysitters', titleRu: 'Няни', path: '/admin/babysitters', icon: Baby },
    ],
  },
  {
    label: 'Services & Shops',
    labelRu: 'Сервисы',
    defaultOpen: false,
    items: [
      { title: 'Transport', titleRu: 'Транспорт', path: '/admin/vehicles', icon: Car },
      { title: 'Education', titleRu: 'Образование', path: '/admin/education', icon: GraduationCap },
      { title: 'Legal', titleRu: 'Юридические', path: '/admin/legal', icon: Scale },
      { title: 'Insurance', titleRu: 'Страхование', path: '/admin/insurance', icon: Shield },
      { title: 'Stores', titleRu: 'Магазины', path: '/admin/stores', icon: Store },
    ],
  },
  // Marketplace Management
  {
    label: 'Marketplace',
    labelRu: 'Маркетплейс',
    defaultOpen: false,
    items: [
      { title: 'Products', titleRu: 'Товары', path: '/admin/marketplace/products', icon: ShoppingCart },
      { title: 'Categories', titleRu: 'Категории', path: '/admin/marketplace/categories', icon: Grid3X3 },
      { title: 'Subcategories', titleRu: 'Подкатегории', path: '/admin/marketplace/subcategories', icon: List },
      { title: 'Vendors', titleRu: 'Продавцы', path: '/admin/marketplace/vendors', icon: BadgeCheck },
    ],
  },
  // 3. ANALYTICS & FINANCE
  {
    label: 'Analytics & Finance',
    labelRu: 'Аналитика и Финансы',
    defaultOpen: false,
    items: [
      { title: 'Analytics', titleRu: 'Аналитика', path: '/admin/analytics', icon: BarChart3 },
      { title: 'Finance', titleRu: 'Финансы', path: '/admin/finance', icon: DollarSign },
      { title: 'Acquisition', titleRu: 'Привлечение', path: '/admin/acquisition-metrics', icon: Flag },
      { title: 'Pitch Deck', titleRu: 'Презентация', path: '/admin/pitch-deck', icon: Presentation },
      { title: 'Investor Demo', titleRu: 'Демо для инвестора', path: '/admin/investor-demo', icon: Rocket },
    ],
  },
  // 4. SYSTEM
  {
    label: 'System',
    labelRu: 'Система',
    defaultOpen: false,
    items: [
      { title: 'Providers', titleRu: 'Провайдеры', path: '/admin/providers', icon: Users },
      { title: 'Services', titleRu: 'Услуги', path: '/admin/services', icon: Package },
      { title: 'UNO Team', titleRu: 'Команда UNO', path: '/admin/uno-team', icon: Users },
      { title: 'Cities', titleRu: 'Города', path: '/admin/cities', icon: Globe },
      { title: 'Translations', titleRu: 'Переводы', path: '/admin/translations', icon: Globe },
      { title: 'Lookups', titleRu: 'Справочники', path: '/admin/lookups', icon: Settings },
      { title: 'Partner Apps', titleRu: 'Заявки', path: '/admin/partner-applications', icon: FileText },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            U
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">UNO Admin</span>
              <span className="text-xs text-sidebar-foreground/60">SuperApp Control</span>
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
