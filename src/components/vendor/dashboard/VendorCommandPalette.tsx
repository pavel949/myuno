/**
 * VendorCommandPalette - Global Search (⌘K / Ctrl+K)
 * Benchmark: Shopify Admin, Linear, Notion
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Package, 
  BarChart3, 
  DollarSign, 
  Settings,
  Search,
  Store,
  Ship,
  Car,
  Plus,
  FileText,
  Users,
  Bell,
  HelpCircle,
  Sparkles,
  Stethoscope,
  GraduationCap,
  UtensilsCrossed,
  Flower2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  titleEn: string;
  titleRu: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  group: 'navigation' | 'actions' | 'verticals' | 'settings';
}

interface VendorCommandPaletteProps {
  triggerClassName?: string;
}

export function VendorCommandPalette({ triggerClassName }: VendorCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Register keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'dashboard', titleEn: 'Dashboard', titleRu: 'Обзор', icon: LayoutDashboard, action: () => navigate('/vendor'), keywords: ['home', 'main', 'главная'], group: 'navigation' },
    { id: 'bookings', titleEn: 'Bookings', titleRu: 'Заказы', icon: CalendarDays, action: () => navigate(APP_ROUTES.VENDOR_BOOKINGS), keywords: ['orders', 'заказы'], group: 'navigation' },
    { id: 'services', titleEn: 'Services', titleRu: 'Услуги', icon: Package, action: () => navigate(APP_ROUTES.VENDOR_SERVICES), keywords: ['products', 'товары'], group: 'navigation' },
    { id: 'analytics', titleEn: 'Analytics', titleRu: 'Аналитика', icon: BarChart3, action: () => navigate(APP_ROUTES.VENDOR_ANALYTICS), keywords: ['stats', 'статистика'], group: 'navigation' },
    { id: 'payouts', titleEn: 'Payouts', titleRu: 'Выплаты', icon: DollarSign, action: () => navigate(APP_ROUTES.VENDOR_PAYOUTS), keywords: ['money', 'деньги'], group: 'navigation' },
    
    // Quick Actions
    { id: 'new-product', titleEn: 'Create New Product', titleRu: 'Создать товар', icon: Plus, action: () => navigate('/vendor/products/new'), keywords: ['add', 'добавить'], group: 'actions' },
    { id: 'new-service', titleEn: 'Create New Service', titleRu: 'Создать услугу', icon: Plus, action: () => navigate('/vendor/services/new'), keywords: ['add', 'добавить'], group: 'actions' },
    { id: 'view-orders', titleEn: 'View Pending Orders', titleRu: 'Ожидающие заказы', icon: FileText, action: () => navigate('/vendor/bookings?status=pending'), keywords: ['pending'], group: 'actions' },
    { id: 'customers', titleEn: 'Customers', titleRu: 'Клиенты', icon: Users, action: () => navigate('/vendor/customers'), keywords: ['clients', 'клиенты'], group: 'actions' },
    
    // Verticals
    { id: 'properties', titleEn: 'Properties', titleRu: 'Недвижимость', icon: Store, action: () => navigate('/vendor/properties'), keywords: ['real estate'], group: 'verticals' },
    { id: 'yachts', titleEn: 'Boat Charters', titleRu: 'Чартер', icon: Ship, action: () => navigate('/vendor/yachts'), keywords: ['boats', 'yachts'], group: 'verticals' },
    { id: 'transport', titleEn: 'Transport', titleRu: 'Транспорт', icon: Car, action: () => navigate('/vendor/transport'), keywords: ['cars', 'авто'], group: 'verticals' },
    { id: 'beauty', titleEn: 'Beauty', titleRu: 'Красота', icon: Sparkles, action: () => navigate('/vendor/beauty'), keywords: ['spa', 'салон'], group: 'verticals' },
    { id: 'clinics', titleEn: 'Clinics', titleRu: 'Клиники', icon: Stethoscope, action: () => navigate('/vendor/clinics'), keywords: ['medical', 'медицина'], group: 'verticals' },
    { id: 'restaurants', titleEn: 'Restaurants', titleRu: 'Рестораны', icon: UtensilsCrossed, action: () => navigate('/vendor/restaurants'), keywords: ['food', 'еда'], group: 'verticals' },
    { id: 'education', titleEn: 'Education', titleRu: 'Образование', icon: GraduationCap, action: () => navigate('/vendor/education'), keywords: ['courses', 'курсы'], group: 'verticals' },
    { id: 'flowers', titleEn: 'Flowers', titleRu: 'Цветы', icon: Flower2, action: () => navigate('/vendor/flowers'), keywords: ['bouquets'], group: 'verticals' },
    
    // Settings
    { id: 'settings', titleEn: 'Settings', titleRu: 'Настройки', icon: Settings, action: () => navigate('/vendor/settings'), keywords: ['config', 'конфигурация'], group: 'settings' },
    { id: 'notifications', titleEn: 'Notifications', titleRu: 'Уведомления', icon: Bell, action: () => navigate('/notifications'), keywords: ['alerts'], group: 'settings' },
    { id: 'help', titleEn: 'Help & Support', titleRu: 'Помощь', icon: HelpCircle, action: () => navigate('/support'), keywords: ['faq', 'поддержка'], group: 'settings' },
  ], [navigate]);

  const groupLabels = {
    navigation: { en: 'Navigation', ru: 'Навигация' },
    actions: { en: 'Quick Actions', ru: 'Быстрые действия' },
    verticals: { en: 'Verticals', ru: 'Вертикали' },
    settings: { en: 'Settings', ru: 'Настройки' },
  };

  const handleSelect = (command: CommandItem) => {
    setOpen(false);
    command.action();
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64",
          triggerClassName
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">{isRu ? 'Поиск...' : 'Search...'}</span>
        <span className="inline-flex lg:hidden">{isRu ? 'Поиск' : 'Search'}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={isRu ? 'Введите команду или поиск...' : 'Type a command or search...'} />
        <CommandList>
          <CommandEmpty>
            {isRu ? 'Ничего не найдено.' : 'No results found.'}
          </CommandEmpty>

          {(['navigation', 'actions', 'verticals', 'settings'] as const).map((group) => {
            const groupCommands = commands.filter(c => c.group === group);
            if (groupCommands.length === 0) return null;
            
            return (
              <React.Fragment key={group}>
                <CommandGroup heading={isRu ? groupLabels[group].ru : groupLabels[group].en}>
                  {groupCommands.map((command) => (
                    <CommandItem
                      key={command.id}
                      value={`${command.titleEn} ${command.titleRu} ${command.keywords?.join(' ') || ''}`}
                      onSelect={() => handleSelect(command)}
                    >
                      <command.icon className="mr-2 h-4 w-4" />
                      <span>{isRu ? command.titleRu : command.titleEn}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {group !== 'settings' && <CommandSeparator />}
              </React.Fragment>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
