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
  Package,
  Users,
  Sparkles,
  DollarSign,
  Building2,
  Settings,
  Plus,
  Search,
  ShoppingCart,
  MapPin,
  Languages,
  FolderTree,
  Database,
  Brain,
  Bot,
  TestTube,
  FileText,
  Scale,
  FileEdit,
  Target,
  Megaphone,
  Building,
  Home,
  Ship,
  Utensils,
} from 'lucide-react';

interface CmdItem {
  id: string;
  titleEn: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  group: 'main' | 'tools' | 'actions';
  keywords?: string[];
}

const navigationItems: CmdItem[] = [
  // Main 7 sections
  { id: 'dashboard', titleEn: 'Dashboard', titleRu: 'Обзор', path: '/admin', icon: LayoutDashboard, group: 'main', keywords: ['home', 'overview'] },
  { id: 'users', titleEn: 'Users & Access', titleRu: 'Пользователи', path: '/admin/users', icon: Users, group: 'main', keywords: ['roles', 'rbac', 'staff', 'permissions'] },
  { id: 'catalog', titleEn: 'Catalog & Content', titleRu: 'Каталог', path: '/admin/catalog', icon: Package, group: 'main', keywords: ['listings', 'verticals', 'yachts', 'salons', 'properties', 'flowers', 'clinics', 'restaurants', 'moderation'] },
  { id: 'lifeos', titleEn: 'LifeOS', titleRu: 'LifeOS', path: '/admin/life-situations', icon: Sparkles, group: 'main', keywords: ['situations', 'tourist', 'resident', 'scenarios'] },
  { id: 'finance', titleEn: 'Finance', titleRu: 'Финансы', path: '/admin/finance', icon: DollarSign, group: 'main', keywords: ['revenue', 'transactions', 'payouts', 'stripe', 'subscriptions'] },
  { id: 'partners', titleEn: 'Partners & Providers', titleRu: 'Партнёры', path: '/admin/providers', icon: Building2, group: 'main', keywords: ['vendor', 'partner', 'verification'] },
  { id: 'settings', titleEn: 'System Settings', titleRu: 'Настройки', path: '/admin/settings', icon: Settings, group: 'main', keywords: ['config', 'system', 'audit', 'logs'] },

  // Tools (accessible via Cmd+K)
  { id: 'cities', titleEn: 'Cities & Regions', titleRu: 'Города', path: '/admin/cities', icon: MapPin, group: 'tools', keywords: ['location', 'region'] },
  { id: 'translations', titleEn: 'Translations', titleRu: 'Переводы', path: '/admin/translations', icon: Languages, group: 'tools', keywords: ['i18n'] },
  { id: 'taxonomy', titleEn: 'Taxonomy', titleRu: 'Таксономии', path: '/admin/taxonomy', icon: FolderTree, group: 'tools', keywords: ['categories', 'tags'] },
  { id: 'data-import', titleEn: 'Data Import', titleRu: 'Импорт данных', path: '/admin/data-import', icon: Database, group: 'tools', keywords: ['csv', 'upload'] },
  { id: 'ai-ops', titleEn: 'AI Command Center', titleRu: 'AI Центр', path: '/admin/ai-ops', icon: Brain, group: 'tools', keywords: ['automation'] },
  { id: 'ai-agents', titleEn: 'AI Agents', titleRu: 'AI Агенты', path: '/admin/ai-agents', icon: Bot, group: 'tools', keywords: ['chatbot'] },
  { id: 'official-news', titleEn: 'Official News Monitor', titleRu: 'Офиц. новости (монитор)', path: '/admin/official-news', icon: Bot, group: 'tools', keywords: ['news', 'firecrawl', 'aggregator', 'sync'] },
  { id: 'uno-team', titleEn: 'UNO Team', titleRu: 'Команда UNO', path: '/admin/uno-team', icon: Users, group: 'tools', keywords: ['staff'] },
  { id: 'qa', titleEn: 'QA Tests', titleRu: 'QA Тесты', path: '/admin/qa-test-runner', icon: TestTube, group: 'tools', keywords: ['test', 'quality'] },
  { id: 'operations', titleEn: 'Operations', titleRu: 'Операции', path: '/admin/operations', icon: ShoppingCart, group: 'tools', keywords: ['orders', 'tickets'] },
  { id: 'crm', titleEn: 'CRM', titleRu: 'CRM', path: '/admin/crm', icon: Target, group: 'tools', keywords: ['leads', 'funnel'] },
  { id: 'marketing', titleEn: 'Marketing', titleRu: 'Маркетинг', path: '/admin/marketing', icon: Megaphone, group: 'tools', keywords: ['campaign'] },
  { id: 'pm-companies', titleEn: 'PM Companies', titleRu: 'УК', path: '/admin/pm-companies', icon: Building, group: 'tools', keywords: ['management company'] },
  { id: 'mc-dashboard', titleEn: 'MC Dashboard', titleRu: 'УК Обзор', path: '/admin/mc-dashboard', icon: Building, group: 'tools', keywords: ['management overview'] },
  { id: 'properties', titleEn: 'Properties', titleRu: 'Недвижимость', path: '/admin/properties', icon: Home, group: 'tools', keywords: ['real estate'] },
  { id: 'yachts', titleEn: 'Boat Charters', titleRu: 'Чартер', path: '/admin/yachts', icon: Ship, group: 'tools', keywords: ['yachts', 'boats'] },
  { id: 'restaurants', titleEn: 'Restaurants', titleRu: 'Рестораны', path: '/admin/restaurants', icon: Utensils, group: 'tools', keywords: ['food'] },
  { id: 'legal-docs', titleEn: 'Legal Documents', titleRu: 'Юр. документы', path: '/admin/legal-documents', icon: Scale, group: 'tools', keywords: ['terms', 'policy'] },
  { id: 'vendor-content', titleEn: 'Vendor Content', titleRu: 'Контент вендоров', path: '/admin/vendor-content', icon: FileEdit, group: 'tools', keywords: ['description'] },
  { id: 'contracts', titleEn: 'Contracts', titleRu: 'Контракты', path: '/admin/contracts', icon: FileText, group: 'tools', keywords: ['agreement'] },
];

const quickActions: CmdItem[] = [
  { id: 'add-provider', titleEn: 'Add New Provider', titleRu: 'Добавить провайдера', path: '/admin/providers?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new'] },
  { id: 'add-listing', titleEn: 'Add Listing to Catalog', titleRu: 'Добавить в каталог', path: '/admin/catalog?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new', 'listing'] },
  { id: 'view-orders', titleEn: 'View Recent Orders', titleRu: 'Последние заказы', path: '/admin/operations', icon: ShoppingCart, group: 'actions', keywords: ['bookings', 'sales'] },
  { id: 'search-providers', titleEn: 'Search Providers', titleRu: 'Поиск провайдеров', path: '/admin/providers', icon: Search, group: 'actions', keywords: ['find', 'lookup'] },
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

  const mainItems = navigationItems.filter(i => i.group === 'main');
  const toolItems = navigationItems.filter(i => i.group === 'tools');

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
          {quickActions.map((item) => (
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

        {/* Main Navigation */}
        <CommandGroup heading={isRussian ? 'Навигация' : 'Navigation'}>
          {mainItems.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.titleEn} ${item.titleRu} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => handleSelect(item.path)}
              className="flex items-center gap-3 py-2 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{isRussian ? item.titleRu : item.titleEn}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Tools & Pages */}
        <CommandGroup heading={isRussian ? 'Инструменты' : 'Tools & Pages'}>
          {toolItems.map((item) => (
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
