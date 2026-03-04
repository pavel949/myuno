import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, HelpCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { CompanySwitcher } from '@/components/owner/CompanySwitcher';
import { useActiveCompany } from '@/hooks/useActiveCompany';

const companyRoleLabels: Record<string, { en: string; ru: string }> = {
  director: { en: 'Director', ru: 'Директор' },
  admin: { en: 'Admin', ru: 'Администратор' },
  manager: { en: 'Manager', ru: 'Управляющий' },
  accountant: { en: 'Accountant', ru: 'Бухгалтер' },
  staff: { en: 'Staff', ru: 'Сотрудник' },
};

const routeLabels: Record<string, { en: string; ru: string }> = {
  '/mc': { en: 'Dashboard', ru: 'Обзор' },
  '/mc/properties': { en: 'Properties', ru: 'Объекты' },
  '/mc/properties/new': { en: 'Add Property', ru: 'Добавить объект' },
  '/mc/calendar': { en: 'Calendar', ru: 'Календарь' },
  '/mc/messages': { en: 'Messages', ru: 'Сообщения' },
  '/mc/financials': { en: 'Transactions', ru: 'Транзакции' },
  '/mc/finance': { en: 'Finance', ru: 'Финансы' },
  '/mc/contacts': { en: 'Contacts', ru: 'Контакты' },
  '/mc/sales': { en: 'Sales Pipeline', ru: 'Воронка продаж' },
  '/mc/tasks': { en: 'Tasks', ru: 'Задачи' },
  '/mc/crm-dashboard': { en: 'CRM Dashboard', ru: 'CRM Обзор' },
  '/mc/staff': { en: 'Staff', ru: 'Сотрудники' },
  '/mc/operations': { en: 'Operations', ru: 'Операции' },
  '/mc/channels': { en: 'Channels', ru: 'Каналы' },
  '/mc/inventory': { en: 'Inventory', ru: 'Инвентарь' },
  '/mc/vendors': { en: 'Vendors', ru: 'Поставщики' },
  '/mc/reports': { en: 'Reports', ru: 'Отчёты' },
  '/mc/invoices': { en: 'Invoices', ru: 'Инвойсы' },
  '/mc/budget': { en: 'Budget', ru: 'Бюджет' },
  '/mc/owners': { en: 'Owners', ru: 'Собственники' },
  '/mc/marketing': { en: 'Marketing', ru: 'Маркетинг' },
  '/mc/documents': { en: 'Documents', ru: 'Документы' },
  '/mc/rates': { en: 'Rates', ru: 'Тарифы' },
  '/mc/subscription': { en: 'Subscription', ru: 'Подписка' },
};

export function MCHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { unreadCount } = useNotificationActions();
  const { activeCompany } = useActiveCompany();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: { path: string; label: string; isLast: boolean }[] = [];
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    const routeLabel = routeLabels[currentPath];
    if (routeLabel) {
      breadcrumbs.push({ path: currentPath, label: isRussian ? routeLabel.ru : routeLabel.en, isLast });
    }
  });

  const currentRoute = routeLabels[location.pathname];
  const pageTitle = currentRoute
    ? (isRussian ? currentRoute.ru : currentRoute.en)
    : (isRussian ? 'Управление' : 'Management');

  const companyRole = activeCompany?.role;
  const roleLabel = companyRole && companyRoleLabels[companyRole]
    ? (isRussian ? companyRoleLabels[companyRole].ru : companyRoleLabels[companyRole].en)
    : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger data-sidebar="trigger" className="-ml-1" />

      <div className="hidden md:flex items-center gap-2">
        <CompanySwitcher />
        {roleLabel && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {roleLabel}
          </span>
        )}
      </div>

      <div className="hidden md:block h-5 w-px bg-border" />

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/mc')} className="flex items-center gap-1 cursor-pointer hover:text-foreground">
              <span>{isRussian ? 'Панель УК' : 'MC Dashboard'}</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.slice(1).map((crumb) => (
            <React.Fragment key={crumb.path}>
              <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink onClick={() => navigate(crumb.path)} className="cursor-pointer hover:text-foreground">
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="md:hidden flex-1 min-w-0 overflow-hidden">
        <h1 className="font-semibold text-sm leading-tight truncate">{pageTitle}</h1>
        {roleLabel && <span className="text-[10px] text-muted-foreground">{roleLabel}</span>}
      </div>

      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => navigate('/mc/support-chat')} title={isRussian ? 'Поддержка' : 'Support'}>
          <HelpCircle className="h-4 w-4" />
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          <CurrencySwitcher size="sm" />
          <ThemeSwitcher />
        </div>
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
