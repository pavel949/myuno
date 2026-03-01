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
  Layers,
  Inbox,
  Users,
  Building,
  Building2,
  FileText,
  Target,
  Megaphone,
  MapPin,
  BookOpen,
  Languages,
  FileEdit,
  Scale,
  Brain,
  Bot,
  Cog,
  Sparkles,
  FolderTree,
  Database,
  TestTube,
  Plus,
  Search,
  ShoppingCart,
} from 'lucide-react';

interface CmdItem {
  id: string;
  titleEn: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  group: 'core' | 'business' | 'content' | 'ai' | 'system' | 'actions';
  keywords?: string[];
}

const navigationItems: CmdItem[] = [
  // Core
  { id: 'dashboard', titleEn: 'Dashboard', titleRu: 'Дашборд', path: '/admin', icon: LayoutDashboard, group: 'core', keywords: ['home', 'main', 'overview'] },
  { id: 'catalog', titleEn: 'Unified Catalog', titleRu: 'Каталог', path: '/admin/catalog', icon: Package, group: 'core', keywords: ['listings', 'verticals', 'yachts', 'salons', 'properties', 'flowers', 'clinics', 'restaurants'] },
  { id: 'operations', titleEn: 'Operations', titleRu: 'Операции', path: '/admin/operations', icon: Layers, group: 'core', keywords: ['orders', 'tickets', 'moderation', 'leads'] },
  { id: 'intake', titleEn: 'Intake', titleRu: 'Приём', path: '/admin/intake', icon: Inbox, group: 'core', keywords: ['incoming', 'applications'] },

  // Business
  { id: 'providers', titleEn: 'Providers', titleRu: 'Провайдеры', path: '/admin/providers', icon: Users, group: 'business', keywords: ['vendor', 'partner', 'business'] },
  { id: 'pm-companies', titleEn: 'PM Companies', titleRu: 'УК (справочник)', path: '/admin/pm-companies', icon: Building, group: 'business', keywords: ['management company'] },
  { id: 'mc-dashboard', titleEn: 'MC Dashboard', titleRu: 'УК — Обзор', path: '/admin/mc-dashboard', icon: Building2, group: 'business', keywords: ['management overview'] },
  { id: 'contracts', titleEn: 'Contracts', titleRu: 'Контракты', path: '/admin/contracts', icon: FileText, group: 'business', keywords: ['agreement', 'deal'] },
  { id: 'crm', titleEn: 'CRM Hub', titleRu: 'CRM', path: '/admin/crm', icon: Target, group: 'business', keywords: ['crm', 'leads', 'acquisition', 'prospects', 'funnel'] },
  { id: 'vendor-prospects', titleEn: 'Vendor Prospects', titleRu: 'Привлечение', path: '/admin/vendor-prospects', icon: Target, group: 'business', keywords: ['acquisition', 'lead'] },
  { id: 'marketing', titleEn: 'Marketing', titleRu: 'Маркетинг', path: '/admin/marketing', icon: Megaphone, group: 'business', keywords: ['mcc', 'campaign'] },

  // Content
  { id: 'cities', titleEn: 'Cities & Locations', titleRu: 'Города', path: '/admin/cities', icon: MapPin, group: 'content', keywords: ['location', 'region', 'area'] },
  { id: 'location-knowledge', titleEn: 'Location Knowledge', titleRu: 'База знаний', path: '/admin/location-knowledge', icon: BookOpen, group: 'content', keywords: ['guide', 'info'] },
  { id: 'translations', titleEn: 'Translations', titleRu: 'Переводы', path: '/admin/translations', icon: Languages, group: 'content', keywords: ['i18n', 'language'] },
  { id: 'vendor-content', titleEn: 'Vendor Content', titleRu: 'Контент вендоров', path: '/admin/vendor-content', icon: FileEdit, group: 'content', keywords: ['description', 'photos'] },
  { id: 'legal-documents', titleEn: 'Legal Documents', titleRu: 'Юр. документы', path: '/admin/legal-documents', icon: Scale, group: 'content', keywords: ['terms', 'policy', 'contract'] },

  // AI
  { id: 'ai-ops', titleEn: 'AI Command Center', titleRu: 'AI Центр', path: '/admin/ai-ops', icon: Brain, group: 'ai', keywords: ['automation', 'intelligence'] },
  { id: 'ai-agents', titleEn: 'AI Agents', titleRu: 'AI Агенты', path: '/admin/ai-agents', icon: Bot, group: 'ai', keywords: ['chatbot', 'assistant'] },

  // System
  { id: 'control', titleEn: 'Control Center', titleRu: 'Управление', path: '/admin/control', icon: Cog, group: 'system', keywords: ['users', 'roles', 'finance', 'settings', 'analytics'] },
  { id: 'lifeos', titleEn: 'LifeOS', titleRu: 'LifeOS', path: '/admin/life-situations', icon: Sparkles, group: 'system', keywords: ['situations', 'tourist', 'resident'] },
  { id: 'taxonomy', titleEn: 'Taxonomy', titleRu: 'Таксономии', path: '/admin/taxonomy', icon: FolderTree, group: 'system', keywords: ['categories', 'tags'] },
  { id: 'data-import', titleEn: 'Data Import', titleRu: 'Импорт данных', path: '/admin/data-import', icon: Database, group: 'system', keywords: ['csv', 'upload', 'migration'] },
  { id: 'uno-team', titleEn: 'UNO Team', titleRu: 'Команда UNO', path: '/admin/uno-team', icon: Users, group: 'system', keywords: ['staff', 'employee'] },
  { id: 'qa-test-runner', titleEn: 'QA Test Runner', titleRu: 'QA Тесты', path: '/admin/qa-test-runner', icon: TestTube, group: 'system', keywords: ['test', 'quality'] },
];

const quickActions: CmdItem[] = [
  { id: 'add-provider', titleEn: 'Add New Provider', titleRu: 'Добавить провайдера', path: '/admin/providers?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new'] },
  { id: 'add-listing', titleEn: 'Add Listing to Catalog', titleRu: 'Добавить в каталог', path: '/admin/catalog?action=add', icon: Plus, group: 'actions', keywords: ['create', 'new', 'listing'] },
  { id: 'view-orders', titleEn: 'View Recent Orders', titleRu: 'Последние заказы', path: '/admin/operations', icon: ShoppingCart, group: 'actions', keywords: ['bookings', 'sales'] },
  { id: 'search-providers', titleEn: 'Search Providers', titleRu: 'Поиск провайдеров', path: '/admin/providers', icon: Search, group: 'actions', keywords: ['find', 'lookup'] },
];

const groupLabels: Record<string, { en: string; ru: string }> = {
  core: { en: 'Core', ru: 'Ядро' },
  business: { en: 'Business', ru: 'Бизнес' },
  content: { en: 'Content', ru: 'Контент' },
  ai: { en: 'AI & Automation', ru: 'AI и автоматизация' },
  system: { en: 'System', ru: 'Система' },
};

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

  const actionsGroup = quickActions;
  const groupIds = ['core', 'business', 'content', 'ai', 'system'] as const;

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

        {/* Grouped Navigation */}
        {groupIds.map((gid) => {
          const items = navigationItems.filter(i => i.group === gid);
          if (!items.length) return null;
          const label = groupLabels[gid];
          return (
            <React.Fragment key={gid}>
              <CommandGroup heading={isRussian ? label.ru : label.en}>
                {items.map((item) => (
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
            </React.Fragment>
          );
        })}
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
