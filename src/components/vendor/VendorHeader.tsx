import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Store, HelpCircle } from 'lucide-react';
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

const routeLabels: Record<string, { en: string; ru: string }> = {
  '/vendor': { en: 'Dashboard', ru: 'Обзор' },
  '/vendor/bookings': { en: 'Bookings', ru: 'Заказы' },
  '/vendor/services': { en: 'Services', ru: 'Услуги' },
  '/vendor/analytics': { en: 'Analytics', ru: 'Аналитика' },
  '/vendor/payouts': { en: 'Payouts', ru: 'Выплаты' },
  '/vendor/subscription': { en: 'Subscription', ru: 'Подписка' },
  '/vendor/properties': { en: 'Properties', ru: 'Недвижимость' },
  '/vendor/yachts': { en: 'Yachts', ru: 'Яхты' },
  '/vendor/transport': { en: 'Transport', ru: 'Транспорт' },
  '/vendor/tours': { en: 'Tours', ru: 'Туры' },
  '/vendor/activities': { en: 'Activities', ru: 'Активности' },
  '/vendor/beauty': { en: 'Beauty', ru: 'Красота' },
  '/vendor/fitness': { en: 'Fitness', ru: 'Фитнес' },
  '/vendor/clinics': { en: 'Clinics', ru: 'Клиники' },
  '/vendor/restaurants': { en: 'Restaurants', ru: 'Рестораны' },
  '/vendor/events': { en: 'Events', ru: 'Мероприятия' },
  '/vendor/education': { en: 'Education', ru: 'Образование' },
  '/vendor/legal': { en: 'Legal', ru: 'Юридические' },
  '/vendor/pets': { en: 'Pets', ru: 'Питомцы' },
  '/vendor/cleaning': { en: 'Cleaning', ru: 'Клининг' },
  '/vendor/babysitters': { en: 'Babysitters', ru: 'Няни' },
  '/vendor/flowers': { en: 'Flowers', ru: 'Цветы' },
};

export function VendorHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
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

  const currentRoute = routeLabels[location.pathname];
  const pageTitle = currentRoute 
    ? (isRussian ? currentRoute.ru : currentRoute.en) 
    : (isRussian ? 'Мой бизнес' : 'My Business');

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger data-sidebar="trigger" className="-ml-1" />
      
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/vendor')}
              className="flex items-center gap-1 cursor-pointer hover:text-foreground"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb) => (
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

      <h1 className="md:hidden font-semibold text-lg">{pageTitle}</h1>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/support')}
          title={isRussian ? 'Поддержка' : 'Support'}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
