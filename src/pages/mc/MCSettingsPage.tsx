import { APP_ROUTES } from '@/lib/config/routes';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FinanceCategorySettings } from '@/components/mc/settings/FinanceCategorySettings';
import { CompanyProfileSettings } from '@/components/mc/settings/CompanyProfileSettings';
import { OperatingSpaceSettings } from '@/components/mc/settings/OperatingSpaceSettings';
import { DataBackupSettings } from '@/components/mc/settings/DataBackupSettings';
import { Settings, DollarSign, Target, Wrench, Building2, HardDrive } from 'lucide-react';
import React, { Suspense } from 'react';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const PipelineSettingsContent = React.lazy(() => import('@/pages/owner/PipelineSettingsPage'));

export default function MCSettingsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany, isLoading: companyLoading, isError: companyError, refetch: refetchCompany } = useActiveCompany();

  const sections = [
    { id: 'rules', icon: DollarSign, title: isRu ? 'Правила и тарифы' : 'Rules and rates', desc: isRu ? 'Тарифы аренды и условия управления' : 'Rental rates and management terms' },
    {
      id: 'profile',
      icon: Building2,
      title: isRu ? 'Профиль компании' : 'Company Profile',
      desc: isRu ? 'Бренд, контакты, юридические данные' : 'Branding, contacts, legal details',
    },
    {
      id: 'spaces',
      icon: Building2,
      title: isRu ? 'Рабочие пространства' : 'Operating spaces',
      desc: isRu ? 'Пространства, объекты и участники компании' : 'Company spaces, properties and members',
    },
    {
      id: 'finance',
      icon: DollarSign,
      title: isRu ? 'Финансы' : 'Finance',
      desc: isRu ? 'Категории доходов и расходов' : 'Income & expense categories',
    },
    {
      id: 'crm',
      icon: Target,
      title: 'CRM',
      desc: isRu ? 'Этапы сделок, типы контактов, источники' : 'Deal stages, contact types, sources',
    },
    {
      id: 'operations',
      icon: Wrench,
      title: isRu ? 'Операции' : 'Operations',
      desc: isRu ? 'Задачи и сообщения гостям' : 'Tasks and guest communication',
    },
    {
      id: 'data',
      icon: HardDrive,
      title: isRu ? 'Данные и бэкап' : 'Data & Backup',
      desc: isRu ? 'Экспорт данных, автоматический бэкап' : 'Data export, automatic backups',
    },
  ];

  const sectionIds = new Set(sections.map(section => section.id));
  const expandedSections = searchParams.getAll('tab').filter(id => sectionIds.has(id));
  const handleSectionsChange = (values: string[]) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    values.filter(id => sectionIds.has(id)).forEach(id => next.append('tab', id));
    setSearchParams(next, { replace: true });
  };

  if (companyError) return (
    <div role="alert" className="p-4 md:p-6 space-y-3">
      <p className="text-destructive">{isRu ? 'Не удалось загрузить компанию' : 'Could not load company'}</p>
      <Button variant="outline" onClick={() => refetchCompany()}>{isRu ? 'Повторить' : 'Retry'}</Button>
    </div>
  );
  if (companyLoading) return <LoadingState />;
  if (!activeCompany) return (
    <div className="p-4 md:p-6 space-y-3">
      <h1 className="text-xl font-bold">{isRu ? 'Настройки компании' : 'Company settings'}</h1>
      <p className="text-muted-foreground">{isRu ? 'Компания пока не выбрана. Создайте компанию, чтобы настроить её рабочее пространство.' : 'No company selected yet. Create a company to configure its workspace.'}</p>
      <Button asChild><Link to="/mc/onboarding">{isRu ? 'Создать компанию' : 'Create company'}</Link></Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isRu ? 'Настройки' : 'Settings'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Настройте систему под вашу компанию' : 'Customize the system for your company'}
          </p>
        </div>
      </div>

      <Accordion type="multiple" value={expandedSections} onValueChange={handleSectionsChange} className="space-y-3">
        {sections.map(({ id, icon: Icon, title, desc }) => (
          <AccordionItem
            key={id}
            value={id}
            className="border border-border/60 rounded-none bg-card px-4 data-[state=open]:shadow-sm transition-shadow"
          >
            <AccordionTrigger className="hover:no-underline py-4 gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-none bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground font-normal">{desc}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 pt-1">
              {id === 'rules' && <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild><Link to={APP_ROUTES.MC_RATES}>{isRu ? 'Тарифы аренды' : 'Rental rates'}</Link></Button>
                <Button variant="outline" asChild><Link to={APP_ROUTES.MC_MANAGEMENT_TERMS}>{isRu ? 'Условия управления' : 'Management terms'}</Link></Button>
              </div>}
              {id === 'profile' && <CompanyProfileSettings />}
              {id === 'spaces' && <OperatingSpaceSettings />}
              {id === 'finance' && <FinanceCategorySettings />}
              {id === 'crm' && (
                <Suspense fallback={<LoadingState />}>
                  <PipelineSettingsContent />
                </Suspense>
              )}
              {id === 'operations' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Откройте задачи или настройте сообщения в соответствующем разделе.' : 'Open operational tasks or configure guest messages in the relevant section.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild><Link to="/mc/operations">{isRu ? 'Задачи по объектам' : 'Operational tasks'}</Link></Button>
                    <Button variant="outline" asChild><Link to="/mc/auto-messaging">{isRu ? 'Автоматические сообщения' : 'Automatic messages'}</Link></Button>
                    <Button variant="outline" asChild><Link to="/mc/message-templates">{isRu ? 'Шаблоны сообщений' : 'Message templates'}</Link></Button>
                  </div>
                </div>
              )}
              {id === 'data' && <DataBackupSettings />}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

