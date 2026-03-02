import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FinanceCategorySettings } from '@/components/mc/settings/FinanceCategorySettings';
import { CompanyProfileSettings } from '@/components/mc/settings/CompanyProfileSettings';
import { DataBackupSettings } from '@/components/mc/settings/DataBackupSettings';
import { Settings, DollarSign, Target, Wrench, Building2, HardDrive } from 'lucide-react';
import React, { Suspense } from 'react';
import { LoadingState } from '@/components/uno/LoadingSpinner';

// Lazy load CRM settings (existing PipelineSettingsPage content)
const PipelineSettingsContent = React.lazy(() => import('@/pages/owner/PipelineSettingsPage'));

export default function MCSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const activeTab = searchParams.get('tab') || 'general';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="general" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {isRu ? 'Профиль' : 'Profile'}
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            {isRu ? 'Финансы' : 'Finance'}
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            {isRu ? 'Операции' : 'Operations'}
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5">
            <HardDrive className="h-3.5 w-3.5" />
            {isRu ? 'Данные' : 'Data'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <CompanyProfileSettings />
        </TabsContent>

        <TabsContent value="finance">
          <div className="rounded-xl border border-border bg-card p-6">
            <FinanceCategorySettings />
          </div>
        </TabsContent>

        <TabsContent value="crm">
          <Suspense fallback={<LoadingState />}>
            <PipelineSettingsContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="operations">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isRu ? 'Настройки операций' : 'Operations Settings'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Шаблоны чек-листов, настройки задач — скоро' : 'Checklist templates, task settings — coming soon'}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <DataBackupSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
