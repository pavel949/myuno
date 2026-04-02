import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FinanceCategorySettings } from '@/components/mc/settings/FinanceCategorySettings';
import { CompanyProfileSettings } from '@/components/mc/settings/CompanyProfileSettings';
import { DataBackupSettings } from '@/components/mc/settings/DataBackupSettings';
import { AutomationRulesBuilder } from '@/components/mc/settings/AutomationRulesBuilder';
import { Settings, DollarSign, Target, Wrench, Building2, HardDrive, Zap } from 'lucide-react';
import React, { Suspense } from 'react';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const PipelineSettingsContent = React.lazy(() => import('@/pages/owner/PipelineSettingsPage'));

export default function MCSettingsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sections = [
    {
      id: 'profile',
      icon: Building2,
      title: isRu ? 'Профиль компании' : 'Company Profile',
      desc: isRu ? 'Бренд, контакты, юридические данные' : 'Branding, contacts, legal details',
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
      desc: isRu ? 'Шаблоны чек-листов, настройки задач' : 'Checklist templates, task settings',
    },
    {
      id: 'data',
      icon: HardDrive,
      title: isRu ? 'Данные и бэкап' : 'Data & Backup',
      desc: isRu ? 'Экспорт данных, автоматический бэкап' : 'Data export, automatic backups',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
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

      <Accordion type="multiple" className="space-y-3">
        {sections.map(({ id, icon: Icon, title, desc }) => (
          <AccordionItem
            key={id}
            value={id}
            className="border border-border/60 rounded-xl bg-card px-4 data-[state=open]:shadow-sm transition-shadow"
          >
            <AccordionTrigger className="hover:no-underline py-4 gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground font-normal">{desc}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 pt-1">
              {id === 'profile' && <CompanyProfileSettings />}
              {id === 'finance' && <FinanceCategorySettings />}
              {id === 'crm' && (
                <Suspense fallback={<LoadingState />}>
                  <PipelineSettingsContent />
                </Suspense>
              )}
              {id === 'operations' && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Шаблоны чек-листов, настройки задач — скоро' : 'Checklist templates, task settings — coming soon'}
                  </p>
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
