import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, HelpCircle, Building2, Users } from 'lucide-react';
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
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { CompanySwitcher } from './CompanySwitcher';
import { useActiveCompany } from '@/hooks/useActiveCompany';

// Company role labels
const companyRoleLabels: Record<string, { en: string; ru: string }> = {
  director: { en: 'Director', ru: 'Директор' },
  admin: { en: 'Admin', ru: 'Администратор' },
  manager: { en: 'Manager', ru: 'Управляющий' },
  accountant: { en: 'Accountant', ru: 'Бухгалтер' },
  staff: { en: 'Staff', ru: 'Сотрудник' },
};

// Route to breadcrumb mapping
const routeLabels: Record<string, { en: string; ru: string }> = {
  '/owner': { en: 'Dashboard', ru: 'Обзор' },
  '/owner/properties': { en: 'My Properties', ru: 'Мои объекты' },
  '/owner/properties/new': { en: 'Add Property', ru: 'Добавить объект' },
  '/owner/calendar': { en: 'Calendar', ru: 'Календарь' },
  '/owner/messages': { en: 'Messages', ru: 'Сообщения' },
  '/owner/operations': { en: 'Tasks', ru: 'Задачи' },
  '/owner/financials': { en: 'Financials', ru: 'Финансы' },
  '/owner/financials/new': { en: 'New Entry', ru: 'Новая запись' },
  '/owner/expenses/quick': { en: 'Quick Expense', ru: 'Быстрый расход' },
  '/owner/income/quick': { en: 'Record Income', ru: 'Записать доход' },
  '/owner/portfolio': { en: 'Portfolio', ru: 'Портфолио' },
  '/owner/reviews': { en: 'Reviews', ru: 'Отзывы' },
  '/owner/superhost': { en: 'Superhost', ru: 'Суперхозяин' },
  '/owner/channels': { en: 'Channel Manager', ru: 'Каналы' },
  '/owner/full-management': { en: 'Full Management', ru: 'Полное управление' },
  '/owner/service-request': { en: 'Service Request', ru: 'Заявка на услугу' },
  '/owner/inspection': { en: 'Inspection', ru: 'Осмотр' },
  '/owner/support-chat': { en: 'Support', ru: 'Поддержка' },
  '/owner/message-templates': { en: 'Templates', ru: 'Шаблоны' },
  '/owner/guide': { en: 'Guide', ru: 'Руководство' },
  '/owner/vendors': { en: 'Vendor Directory', ru: 'Поставщики' },
  '/owner/inventory': { en: 'Inventory', ru: 'Инвентарь' },
  '/owner/documents': { en: 'Document Templates', ru: 'Шаблоны документов' },
  '/owner/marketing': { en: 'Marketing', ru: 'Маркетинг' },
  '/owner/vault': { en: 'File Vault', ru: 'Хранилище файлов' },
  '/owner/contacts/import': { en: 'Import Contacts', ru: 'Импорт контактов' },
  '/owner/modules': { en: 'All Modules', ru: 'Все модули' },
};

export function OwnerHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { roles } = useUserRoles();
  const { unreadCount } = useNotificationActions();
  const { activeCompany } = useActiveCompany();
  
  const isPropertyManager = roles?.some(r => r.role === 'property_manager');
  const isOwner = roles?.some(r => r.role === 'owner' || r.role === 'property_owner');
  const RoleIcon = isOwner ? Building2 : (isPropertyManager ? Users : Building2);
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
    : (isRussian ? 'Мой дом' : 'My Home');

  const companyRole = activeCompany?.role;
  const roleLabel = companyRole && companyRoleLabels[companyRole]
    ? (isRussian ? companyRoleLabels[companyRole].ru : companyRoleLabels[companyRole].en)
    : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Sidebar trigger */}
      <SidebarTrigger data-sidebar="trigger" className="-ml-1" />
      
      {/* Company switcher + role badge */}
      <div className="hidden md:flex items-center gap-2">
        <CompanySwitcher />
        {roleLabel && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {roleLabel}
          </span>
        )}
      </div>
      
      {/* Separator */}
      <div className="hidden md:block h-5 w-px bg-border" />
      
      {/* Breadcrumbs */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/owner')}
              className="flex items-center gap-1 cursor-pointer hover:text-foreground"
            >
              <span>{isRussian ? 'Панель' : 'Dashboard'}</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.slice(1).map((crumb) => (
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

      {/* Mobile: page title + role */}
      <div className="md:hidden flex-1 min-w-0 overflow-hidden">
        <h1 className="font-semibold text-sm leading-tight truncate">{pageTitle}</h1>
        {roleLabel && (
          <span className="text-[10px] text-muted-foreground">
            {roleLabel}
          </span>
        )}
      </div>

      {/* Spacer — desktop only, mobile title is flex-1 */}
      <div className="hidden md:block flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <RoleContextSwitcher compact />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/owner/support-chat')}
          title={isRussian ? 'Поддержка' : 'Support'}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        {/* Hide currency/theme on mobile to save space */}
        <div className="hidden sm:flex items-center gap-1">
          <CurrencySwitcher size="sm" />
          <ThemeSwitcher />
        </div>
        <LanguageSwitcher />
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => navigate('/notifications')}
        >
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
