import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Layers, MoreHorizontal, Inbox,
  Users, Building, Building2, FileText, Target, Megaphone,
  MapPin, BookOpen, Languages, FileEdit, Scale,
  Brain, Bot,
  Cog, Sparkles, FolderTree, Database, TestTube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface NavItem {
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
}

interface NavSection {
  title: string;
  titleRu: string;
  items: NavItem[];
}

const mainItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', labelRu: 'Дашборд', path: '/admin' },
  { icon: Package, label: 'Catalog', labelRu: 'Каталог', path: '/admin/catalog' },
  { icon: Layers, label: 'Operations', labelRu: 'Операции', path: '/admin/operations' },
  { icon: Inbox, label: 'Intake', labelRu: 'Приём', path: '/admin/intake' },
];

const moreSections: NavSection[] = [
  {
    title: 'Business',
    titleRu: 'Бизнес',
    items: [
      { icon: Users, label: 'Providers', labelRu: 'Провайдеры', path: '/admin/providers' },
      { icon: Building, label: 'PM Companies', labelRu: 'УК', path: '/admin/pm-companies' },
      { icon: Building2, label: 'MC Dashboard', labelRu: 'УК Обзор', path: '/admin/mc-dashboard' },
      { icon: FileText, label: 'Contracts', labelRu: 'Контракты', path: '/admin/contracts' },
      { icon: Target, label: 'CRM', labelRu: 'CRM', path: '/admin/crm' },
      { icon: Target, label: 'Prospects', labelRu: 'Привлечение', path: '/admin/vendor-prospects' },
      { icon: Megaphone, label: 'Marketing', labelRu: 'Маркетинг', path: '/admin/marketing' },
    ],
  },
  {
    title: 'Content',
    titleRu: 'Контент',
    items: [
      { icon: MapPin, label: 'Cities', labelRu: 'Города', path: '/admin/cities' },
      { icon: BookOpen, label: 'Knowledge', labelRu: 'База знаний', path: '/admin/location-knowledge' },
      { icon: Languages, label: 'Translations', labelRu: 'Переводы', path: '/admin/translations' },
      { icon: FileEdit, label: 'Vendor Content', labelRu: 'Контент', path: '/admin/vendor-content' },
      { icon: Scale, label: 'Legal Docs', labelRu: 'Юр. доки', path: '/admin/legal-documents' },
    ],
  },
  {
    title: 'AI & Automation',
    titleRu: 'AI',
    items: [
      { icon: Brain, label: 'AI Center', labelRu: 'AI Центр', path: '/admin/ai-ops' },
      { icon: Bot, label: 'AI Agents', labelRu: 'AI Агенты', path: '/admin/ai-agents' },
    ],
  },
  {
    title: 'System',
    titleRu: 'Система',
    items: [
      { icon: Cog, label: 'Control', labelRu: 'Управление', path: '/admin/control' },
      { icon: Sparkles, label: 'LifeOS', labelRu: 'LifeOS', path: '/admin/life-situations' },
      { icon: FolderTree, label: 'Taxonomy', labelRu: 'Таксономии', path: '/admin/taxonomy' },
      { icon: Database, label: 'Data Import', labelRu: 'Импорт', path: '/admin/data-import' },
      { icon: Users, label: 'UNO Team', labelRu: 'Команда', path: '/admin/uno-team' },
      { icon: TestTube, label: 'QA Tests', labelRu: 'QA Тесты', path: '/admin/qa-test-runner' },
    ],
  },
];

const allMoreItems = moreSections.flatMap(s => s.items);

export function AdminMobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const isMoreActive = allMoreItems.some(item => isActive(item.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[56px] min-h-[48px] rounded-xl transition-all",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-[10px] font-medium">
                {isRussian ? item.labelRu : item.label}
              </span>
            </button>
          );
        })}

        {/* More button with Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[56px] min-h-[48px] rounded-xl transition-all",
                isMoreActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "text-primary")} />
              <span className="text-[10px] font-medium">
                {isRussian ? 'Ещё' : 'More'}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{isRussian ? 'Все разделы' : 'All Sections'}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 space-y-5 max-h-[60vh] overflow-y-auto">
              {moreSections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {isRussian ? section.titleRu : section.title}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all min-h-[72px]",
                            active 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[10px] font-medium text-center leading-tight">
                            {isRussian ? item.labelRu : item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
