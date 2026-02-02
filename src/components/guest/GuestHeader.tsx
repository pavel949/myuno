import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Home, HelpCircle } from 'lucide-react';
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
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { RoleContextSwitcher } from '@/components/uno/RoleContextSwitcher';

const routeLabels: Record<string, { en: string; ru: string }> = {
  '/my-stay': { en: 'Dashboard', ru: 'Обзор' },
  '/bookings': { en: 'My Bookings', ru: 'Мои бронирования' },
  '/guest/messages': { en: 'Messages', ru: 'Сообщения' },
  '/guest/guidebook': { en: 'Guidebook', ru: 'Гайдбук' },
  '/guest/area': { en: 'Area Guide', ru: 'Район' },
  '/guest/rules': { en: 'House Rules', ru: 'Правила' },
  '/guest/reviews': { en: 'My Reviews', ru: 'Мои отзывы' },
  '/guest/check-in': { en: 'Check-in', ru: 'Заезд' },
  '/cleaning': { en: 'Cleaning', ru: 'Уборка' },
  '/transport': { en: 'Transport', ru: 'Транспорт' },
  '/delivery': { en: 'Delivery', ru: 'Доставка' },
  '/profile/settings': { en: 'Settings', ru: 'Настройки' },
};

export function GuestHeader() {
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
    : (isRussian ? 'Мой визит' : 'My Stay');

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger data-sidebar="trigger" className="-ml-1" />
      
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/my-stay')}
              className="flex items-center gap-1 cursor-pointer hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
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
        <RoleContextSwitcher compact />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/support')}
          title={isRussian ? 'Поддержка' : 'Support'}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        <CurrencySwitcher size="sm" />
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
