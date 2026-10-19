import { pickLang } from '@/lib/i18n/pickLang';
import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FinanceCategorySettings } from '@/components/mc/settings/FinanceCategorySettings';
import { CompanyProfileSettings } from '@/components/mc/settings/CompanyProfileSettings';
import { DataBackupSettings } from '@/components/mc/settings/DataBackupSettings';
import { Settings, DollarSign, Target, Wrench, Building2, HardDrive } from 'lucide-react';
import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const PipelineSettingsContent = React.lazy(() => import('@/pages/owner/PipelineSettingsPage'));

export default function MCSettingsPage() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedSections = ['profile', 'finance', 'crm', 'operations', 'data'];
  const openSections = searchParams.getAll('tab').filter(id => allowedSections.includes(id));
  const setOpenSections = (ids: string[]) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    ids.filter(id => allowedSections.includes(id)).forEach(id => next.append('tab', id));
    setSearchParams(next);
  };

  const sections = [
    {
      id: 'profile',
      icon: Building2,
      title: pickLang(language, {"en": "Company Profile", "ru": "Профиль компании", "th": "ข้อมูลบริษัท"}),
      desc: pickLang(language, {"en": "Branding, contacts, legal details", "ru": "Бренд, контакты, юридические данные", "th": "แบรนด์ ข้อมูลติดต่อ และข้อมูลทางกฎหมาย"}),
    },
    {
      id: 'finance',
      icon: DollarSign,
      title: pickLang(language, {"en": "Finance", "ru": "Финансы", "th": "การเงิน"}),
      desc: pickLang(language, {"en": "Income & expense categories", "ru": "Категории доходов и расходов", "th": "หมวดหมู่รายรับและรายจ่าย"}),
    },
    {
      id: 'crm',
      icon: Target,
      title: 'CRM',
      desc: pickLang(language, {"en": "Deal stages, contact types, sources", "ru": "Этапы сделок, типы контактов, источники", "th": "ขั้นตอนการขาย ประเภทผู้ติดต่อ และแหล่งที่มา"}),
    },
    {
      id: 'operations',
      icon: Wrench,
      title: pickLang(language, {"en": "Operations", "ru": "Операции", "th": "การดำเนินงาน"}),
      desc: pickLang(language, {"en": "Checklist templates, task settings", "ru": "Шаблоны чек-листов, настройки задач", "th": "แม่แบบรายการตรวจสอบและการตั้งค่างาน"}),
    },
    {
      id: 'data',
      icon: HardDrive,
      title: pickLang(language, {"en": "Data & Backup", "ru": "Данные и бэкап", "th": "ข้อมูลและการสำรองข้อมูล"}),
      desc: pickLang(language, {"en": "Data export, automatic backups", "ru": "Экспорт данных, автоматический бэкап", "th": "การส่งออกข้อมูลและการสำรองข้อมูลอัตโนมัติ"}),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {pickLang(language, {"en": "Settings", "ru": "Настройки", "th": "การตั้งค่า"})}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pickLang(language, {"en": "Customize the system for your company", "ru": "Настройте систему под вашу компанию", "th": "ปรับแต่งระบบให้เหมาะกับบริษัทของคุณ"})}
          </p>
        </div>
      </div>

      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">
        {sections.map(({ id, icon: Icon, title, desc }) => (
          <AccordionItem
            key={id}
            value={id}
            className="border border-border/60 rounded-none bg-card px-4 data-[state=open]:shadow-sm transition-shadow"
          >
            <AccordionTrigger className="hover:no-underline py-4 gap-3">
              <div className="flex min-w-0 items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-none bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground font-normal">{desc}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 pt-1">
              {id === 'profile' && <CompanyProfileSettings />}
              {id === 'finance' && <FinanceCategorySettings />}
              {id === 'crm' && (
                <Suspense fallback={<LoadingState message={pickLang(language, { en: 'Loading...', ru: 'Загрузка...', th: 'กำลังโหลด...' })} />}>
                  <PipelineSettingsContent />
                </Suspense>
              )}
              {id === 'operations' && (
                <div className="flex items-center gap-3 p-4 rounded-none bg-muted/30">
                  <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {pickLang(language, {"en": "Checklist templates, task settings — coming soon", "ru": "Шаблоны чек-листов, настройки задач — скоро", "th": "แม่แบบรายการตรวจสอบและการตั้งค่างานจะพร้อมใช้งานเร็ว ๆ นี้"})}
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
