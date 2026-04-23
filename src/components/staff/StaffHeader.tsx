import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
  '/staff': { en: 'Dashboard', ru: 'Обзор' },
  '/staff/tasks': { en: 'Tasks', ru: 'Задания' },
  '/staff/calendar': { en: 'Calendar', ru: 'Календарь' },
  '/staff/reviews': { en: 'Reviews', ru: 'Отзывы' },
  '/staff/settings': { en: 'Settings', ru: 'Настройки' },
};

export function StaffHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: { path: string; label: string; isLast: boolean }[] = [];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    const labels = routeLabels[currentPath];
    const label = labels
      ? (isRu ? labels.ru : labels.en)
      : segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ path: currentPath, label, isLast });
  });

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background/95 px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="h-4 w-px bg-border mx-1" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={bc.path}>
              {i > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {bc.isLast ? (
                  <BreadcrumbPage>{bc.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigate(bc.path)}
                  >
                    {bc.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
