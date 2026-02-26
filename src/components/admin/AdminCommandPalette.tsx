import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Flag,
  Plus,
  Search,
  ShoppingCart,
} from 'lucide-react';

interface CommandItem {
  id: string;
  titleEn: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  group: 'navigation' | 'actions' | 'search';
  keywords?: string[];
}

// Navigation items derived from sidebar
const navigationItems: CommandItem[] = [
  // Dashboard
  { id: 'dashboard', titleEn: 'Dashboard', titleRu: 'Панель управления', path: '/admin', icon: LayoutDashboard, group: 'navigation', keywords: ['home', 'main', 'overview'] },
  
  // Travel & Leisure
  { id: 'yachts', titleEn: 'Yachts', titleRu: 'Яхты', path: '/admin/yachts', icon: Ship, group: 'navigation', keywords: ['boat', 'sailing'] },
  { id: 'tours', titleEn: 'Tours', titleRu: 'Туры', path: '/admin/tours', icon: Compass, group: 'navigation', keywords: ['trip', 'excursion'] },
  { id: 'activities', titleEn: 'Activities', titleRu: 'Активности', path: '/admin/activities', icon: Calendar, group: 'navigation', keywords: ['adventure'] },
  { id: 'properties', titleEn: 'Properties', titleRu: 'Недвижимость', path: '/admin/properties', icon: Home, group: 'navigation', keywords: ['real estate', 'housing', 'villa'] },
  { id: 'water-activities', titleEn: 'Water Activities', titleRu: 'Водные активности', path: '/admin/water-activities', icon: Waves, group: 'navigation', keywords: ['swimming', 'diving'] },
  { id: 'events', titleEn: 'Events', titleRu: 'События', path: '/admin/events', icon: Calendar, group: 'navigation', keywords: ['party', 'concert'] },
  
  // Lifestyle
  { id: 'restaurants', titleEn: 'Restaurants', titleRu: 'Рестораны', path: '/admin/restaurants', icon: Utensils, group: 'navigation', keywords: ['food', 'dining', 'cafe'] },
  { id: 'salons', titleEn: 'Beauty Salons', titleRu: 'Салоны красоты', path: '/admin/salons', icon: Scissors, group: 'navigation', keywords: ['spa', 'beauty', 'hair'] },
  { id: 'clinics', titleEn: 'Medical Clinics', titleRu: 'Клиники', path: '/admin/clinics', icon: Stethoscope, group: 'navigation', keywords: ['hospital', 'doctor', 'health'] },
  { id: 'gyms', titleEn: 'Fitness Centers', titleRu: 'Фитнес-центры', path: '/admin/gyms', icon: Dumbbell, group: 'navigation', keywords: ['gym', 'workout', 'sport'] },
  { id: 'flowers', titleEn: 'Flower Shops', titleRu: 'Цветочные магазины', path: '/admin/flowers', icon: Flower2, group: 'navigation', keywords: ['bouquet', 'florist'] },
  
  // Services
  { id: 'vehicles', titleEn: 'Transport', titleRu: 'Транспорт', path: '/admin/vehicles', icon: Car, group: 'navigation', keywords: ['rental', 'car', 'bike'] },
  { id: 'education', titleEn: 'Education', titleRu: 'Образование', path: '/admin/education', icon: GraduationCap, group: 'navigation', keywords: ['tutor', 'school', 'learning'] },
  { id: 'legal', titleEn: 'Legal Services', titleRu: 'Юридические услуги', path: '/admin/legal', icon: Scale, group: 'navigation', keywords: ['lawyer', 'attorney'] },
  { id: 'pets', titleEn: 'Pet Services', titleRu: 'Услуги для питомцев', path: '/admin/pets', icon: PawPrint, group: 'navigation', keywords: ['vet', 'grooming'] },
  { id: 'cleaning', titleEn: 'Cleaning Services', titleRu: 'Уборка', path: '/admin/cleaning', icon: SprayCan, group: 'navigation', keywords: ['maid', 'housekeeping'] },
  { id: 'babysitters', titleEn: 'Babysitters', titleRu: 'Няни', path: '/admin/babysitters', icon: Baby, group: 'navigation', keywords: ['nanny', 'childcare'] },
  
  // Infrastructure
  { id: 'pharmacies', titleEn: 'Pharmacies', titleRu: 'Аптеки', path: '/admin/pharmacies', icon: Pill, group: 'navigation', keywords: ['medicine', 'drug'] },
  { id: 'stores', titleEn: 'Stores', titleRu: 'Магазины', path: '/admin/stores', icon: Store, group: 'navigation', keywords: ['shop', 'market'] },
  { id: 'insurance', titleEn: 'Insurance', titleRu: 'Страхование', path: '/admin/insurance', icon: Shield, group: 'navigation', keywords: ['policy'] },
  
  // Operations
  { id: 'leads', titleEn: 'Leads', titleRu: 'Лиды', path: '/admin/leads', icon: UserCheck, group: 'navigation', keywords: ['prospect', 'customer'] },
  { id: 'consultations', titleEn: 'Consultations', titleRu: 'Консультации', path: '/admin/consultations', icon: MessageSquare, group: 'navigation', keywords: ['request', 'inquiry'] },
  { id: 'tickets', titleEn: 'Support Tickets', titleRu: 'Тикеты поддержки', path: '/admin/tickets', icon: ClipboardList, group: 'navigation', keywords: ['support', 'issue', 'help'] },
  { id: 'moderation', titleEn: 'Content Moderation', titleRu: 'Модерация контента', path: '/admin/moderation', icon: FileText, group: 'navigation', keywords: ['review', 'approve'] },
  { id: 'quick-listings', titleEn: 'Quick Listings', titleRu: 'Быстрые листинги', path: '/admin/quick-listings', icon: ClipboardList, group: 'navigation', keywords: ['fast', 'add'] },
  { id: 'operations', titleEn: 'Operations Hub', titleRu: 'Центр операций', path: '/admin/operations', icon: Building2, group: 'navigation', keywords: ['hub', 'center'] },
  
  // Analytics
  { id: 'analytics', titleEn: 'Analytics Overview', titleRu: 'Обзор аналитики', path: '/admin/control', icon: BarChart3, group: 'navigation', keywords: ['stats', 'metrics', 'data'] },
  { id: 'acquisition', titleEn: 'Acquisition Metrics', titleRu: 'Метрики привлечения', path: '/admin/acquisition-metrics', icon: Flag, group: 'navigation', keywords: ['marketing', 'growth'] },
  
  // Finance
  { id: 'finance', titleEn: 'Finance Dashboard', titleRu: 'Финансовая панель', path: '/admin/control', icon: DollarSign, group: 'navigation', keywords: ['money', 'revenue', 'payments'] },
  
  // System
  { id: 'providers', titleEn: 'Providers', titleRu: 'Провайдеры', path: '/admin/providers', icon: Users, group: 'navigation', keywords: ['vendor', 'partner', 'business'] },
  { id: 'services', titleEn: 'Services', titleRu: 'Услуги', path: '/admin/services', icon: Package, group: 'navigation', keywords: ['product', 'offering'] },
  { id: 'uno-team', titleEn: 'myUNO Team', titleRu: 'Команда myUNO', path: '/admin/uno-team', icon: Users, group: 'navigation', keywords: ['staff', 'employee'] },
  { id: 'cities', titleEn: 'Cities', titleRu: 'Города', path: '/admin/cities', icon: Globe, group: 'navigation', keywords: ['location', 'region'] },
  { id: 'lookups', titleEn: 'Lookup Tables', titleRu: 'Справочники', path: '/admin/lookups', icon: Settings, group: 'navigation', keywords: ['config', 'dictionary'] },
  { id: 'partner-applications', titleEn: 'Partner Applications', titleRu: 'Заявки партнеров', path: '/admin/partner-applications', icon: FileText, group: 'navigation', keywords: ['application', 'request'] },
];

// Quick actions
const quickActions: CommandItem[] = [
  { id: 'add-provider', titleEn: 'Add New Provider', titleRu: 'Добавить провайдера', path: '/admin/providers?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new'] },
  { id: 'add-property', titleEn: 'Add New Property', titleRu: 'Добавить недвижимость', path: '/admin/properties?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new', 'villa'] },
  { id: 'add-tour', titleEn: 'Add New Tour', titleRu: 'Добавить тур', path: '/admin/tours?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new'] },
  { id: 'view-orders', titleEn: 'View Recent Orders', titleRu: 'Последние заказы', path: '/admin/leads', icon: ShoppingCart, group: 'actions', keywords: ['bookings', 'sales'] },
  { id: 'search-providers', titleEn: 'Search Providers', titleRu: 'Поиск провайдеров', path: '/admin/providers', icon: Search, group: 'search', keywords: ['find', 'lookup'] },
];

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const handleSelect = useCallback((path: string) => {
    onOpenChange(false);
    navigate(path);
  }, [navigate, onOpenChange]);

  const allItems = [...navigationItems, ...quickActions];

  // Group items for display
  const navigationGroup = navigationItems;
  const actionsGroup = quickActions.filter(item => item.group === 'actions');

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder={isRussian ? 'Введите команду или поиск...' : 'Type a command or search...'} 
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          {isRussian ? 'Ничего не найдено.' : 'No results found.'}
        </CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading={isRussian ? 'Быстрые действия' : 'Quick Actions'}>
          {actionsGroup.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.titleEn} ${item.titleRu} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => handleSelect(item.path)}
              className="flex items-center gap-3 py-3 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{isRussian ? item.titleRu : item.titleEn}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading={isRussian ? 'Навигация' : 'Navigation'}>
          {navigationGroup.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.titleEn} ${item.titleRu} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => handleSelect(item.path)}
              className="flex items-center gap-3 py-2 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{isRussian ? item.titleRu : item.titleEn}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {item.path}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Hook for managing command palette state with keyboard shortcut
export function useAdminCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}
