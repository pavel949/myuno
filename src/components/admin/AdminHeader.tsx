import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { RoleContextSwitcher } from '@/components/uno/RoleContextSwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminNotificationsDropdown } from './AdminNotificationsDropdown';

interface AdminHeaderProps {
  onOpenCommandPalette?: () => void;
}

// Route to breadcrumb mapping
const routeLabels: Record<string, { en: string; ru: string }> = {
  '/admin': { en: 'Dashboard', ru: 'Панель управления' },
  '/admin/catalog': { en: 'Catalog', ru: 'Каталог' },
  '/admin/control': { en: 'Control', ru: 'Управление' },
  '/admin/operations': { en: 'Operations', ru: 'Операции' },
  '/admin/intake': { en: 'Intake', ru: 'Приём' },
  '/admin/ai-agents': { en: 'AI Agents', ru: 'AI Агенты' },
  '/admin/providers': { en: 'Providers', ru: 'Провайдеры' },
  '/admin/services': { en: 'Services', ru: 'Услуги' },
  '/admin/yachts': { en: 'Boat Charters', ru: 'Чартер' },
  '/admin/activities': { en: 'Activities', ru: 'Активности' },
  '/admin/properties': { en: 'Properties', ru: 'Недвижимость' },
  '/admin/projects': { en: 'Projects', ru: 'Проекты / ЖК' },
  '/admin/investments': { en: 'Investments', ru: 'Инвестиции' },
  '/admin/developers': { en: 'Developers', ru: 'Застройщики' },
  '/admin/pm-companies': { en: 'PM Companies', ru: 'УК' },
  '/admin/restaurants': { en: 'Restaurants', ru: 'Рестораны' },
  '/admin/salons': { en: 'Salons', ru: 'Салоны' },
  '/admin/clinics': { en: 'Clinics', ru: 'Клиники' },
  '/admin/gyms': { en: 'Gyms', ru: 'Фитнес' },
  '/admin/vehicles': { en: 'Transport', ru: 'Транспорт' },
  '/admin/events': { en: 'Events', ru: 'События' },
  '/admin/education': { en: 'Education', ru: 'Образование' },
  '/admin/legal': { en: 'Legal', ru: 'Юридические' },
  '/admin/pets': { en: 'Pets', ru: 'Питомцы' },
  '/admin/cleaning': { en: 'Cleaning', ru: 'Уборка' },
  '/admin/babysitters': { en: 'Babysitters', ru: 'Няни' },
  '/admin/flowers': { en: 'Flowers', ru: 'Цветы' },
  '/admin/pharmacies': { en: 'Pharmacies', ru: 'Аптеки' },
  '/admin/stores': { en: 'Stores', ru: 'Магазины' },
  '/admin/insurance': { en: 'Insurance', ru: 'Страхование' },
  '/admin/water-activities': { en: 'Water Activities', ru: 'Водные активности' },
  '/admin/experiences': { en: 'Experiences', ru: 'Экскурсии' },
  '/admin/consultations': { en: 'Consultations', ru: 'Консультации' },
  '/admin/tickets': { en: 'Tickets', ru: 'Тикеты' },
  '/admin/acquisition-metrics': { en: 'Acquisition', ru: 'Привлечение' },
  '/admin/vendor-prospects': { en: 'Vendor Prospects', ru: 'Поиск вендоров' },
  '/admin/marketing': { en: 'Marketing', ru: 'Маркетинг' },
  '/admin/contracts': { en: 'Contracts', ru: 'Контракты' },
  '/admin/uno-team': { en: 'UNO Team', ru: 'Команда UNO' },
  '/admin/cities': { en: 'Cities', ru: 'Города' },
  '/admin/taxonomy': { en: 'Taxonomy', ru: 'Таксономии' },
  '/admin/life-situations': { en: 'LifeOS', ru: 'LifeOS' },
  '/admin/translations': { en: 'Translations', ru: 'Переводы' },
  '/admin/location-knowledge': { en: 'Locations', ru: 'Локации' },
  '/admin/data-import': { en: 'Data Import', ru: 'Импорт данных' },
  '/admin/partner-applications': { en: 'Partner Apps', ru: 'Заявки партнеров' },
};

export function AdminHeader({ onOpenCommandPalette }: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  // Check if we can go back (not on main dashboard)
  const canGoBack = location.pathname !== '/admin';
  
  // Build breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: { path: string; label: string; isLast: boolean }[] = [];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    const routeLabel = routeLabels[currentPath];
    
    if (routeLabel) {
      breadcrumbs.push({
        path: currentPath,
        label: isRussian ? routeLabel.ru : routeLabel.en,
        isLast,
      });
    }
  });

  // Current page title
  const currentRoute = routeLabels[location.pathname];
  const pageTitle = currentRoute 
    ? (isRussian ? currentRoute.ru : currentRoute.en) 
    : 'Admin';

  const handleGoBack = () => {
    // If we have browser history, use it
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback to dashboard
      navigate('/admin');
    }
  };

  const handleGoForward = () => {
    navigate(1);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Sidebar trigger */}
      <SidebarTrigger data-sidebar="trigger" className="-ml-1" />
      
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleGoBack}
              disabled={!canGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isRussian ? 'Назад' : 'Back'}
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleGoForward}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isRussian ? 'Вперёд' : 'Forward'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border hidden sm:block" />
      
      {/* Breadcrumbs - Desktop */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1 cursor-pointer hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    onClick={() => navigate(crumb.path)}
                    className="cursor-pointer hover:text-foreground"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile: Show current page with back hint */}
      <div className="md:hidden flex items-center gap-2 min-w-0">
        {canGoBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-muted-foreground"
            onClick={() => navigate('/admin')}
          >
            <Home className="h-3.5 w-3.5" />
          </Button>
        )}
        <span className="font-semibold text-sm truncate">{pageTitle}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search - Opens Command Palette */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden lg:flex items-center gap-2 w-64 h-9 px-3 rounded-md bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">{isRussian ? 'Поиск...' : 'Search...'}</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <RoleContextSwitcher compact />
        <ThemeSwitcher />
        <LanguageSwitcher />
        <AdminNotificationsDropdown />
      </div>
    </header>
  );
}