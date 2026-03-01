import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FinanceCategorySettings } from '@/components/mc/settings/FinanceCategorySettings';
import { Settings, DollarSign, Target, Wrench } from 'lucide-react';
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
            <Settings className="h-3.5 w-3.5" />
            {isRu ? 'Общие' : 'General'}
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
        </TabsList>

        <TabsContent value="general">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {isRu ? 'Общие настройки' : 'General Settings'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Валюта, язык отчётов, часовой пояс — скоро.'
                : 'Currency, report language, timezone — coming soon.'}
            </p>
          </div>
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
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {isRu ? 'Настройки операций' : 'Operations Settings'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Шаблоны чек-листов, настройки задач — скоро.'
                : 'Checklist templates, task settings — coming soon.'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
