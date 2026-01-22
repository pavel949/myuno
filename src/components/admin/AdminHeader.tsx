import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, Home } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Route to breadcrumb mapping
const routeLabels: Record<string, { en: string; ru: string }> = {
  '/admin': { en: 'Dashboard', ru: 'Панель управления' },
  '/admin/analytics': { en: 'Analytics', ru: 'Аналитика' },
  '/admin/providers': { en: 'Providers', ru: 'Провайдеры' },
  '/admin/services': { en: 'Services', ru: 'Услуги' },
  '/admin/yachts': { en: 'Yachts', ru: 'Яхты' },
  '/admin/tours': { en: 'Tours', ru: 'Туры' },
  '/admin/activities': { en: 'Activities', ru: 'Активности' },
  '/admin/properties': { en: 'Properties', ru: 'Недвижимость' },
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
  '/admin/leads': { en: 'Leads', ru: 'Лиды' },
  '/admin/consultations': { en: 'Consultations', ru: 'Консультации' },
  '/admin/tickets': { en: 'Tickets', ru: 'Тикеты' },
  '/admin/moderation': { en: 'Moderation', ru: 'Модерация' },
  '/admin/operations': { en: 'Operations Hub', ru: 'Центр операций' },
  '/admin/acquisition-metrics': { en: 'Acquisition', ru: 'Привлечение' },
  '/admin/pitch-deck': { en: 'Pitch Deck', ru: 'Презентация' },
  '/admin/finance': { en: 'Finance', ru: 'Финансы' },
  '/admin/uno-team': { en: 'UNO Team', ru: 'Команда UNO' },
  '/admin/cities': { en: 'Cities', ru: 'Города' },
  '/admin/lookups': { en: 'Lookups', ru: 'Справочники' },
  '/admin/partner-applications': { en: 'Partner Apps', ru: 'Заявки партнеров' },
};

export function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Sidebar trigger */}
      <SidebarTrigger data-sidebar="trigger" className="-ml-1" />
      
      {/* Breadcrumbs */}
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

      {/* Mobile title */}
      <h1 className="md:hidden font-semibold text-lg">{pageTitle}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden lg:flex relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={isRussian ? 'Поиск...' : 'Search...'}
          className="pl-8 h-9 bg-muted/50 border-0 focus-visible:ring-1"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
}
