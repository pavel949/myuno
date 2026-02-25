import { lazy, Suspense, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const OverviewTab = lazy(() => import('@/pages/owner/OwnerRevenueDashboard'));
const ReportsTab = lazy(() => import('@/pages/owner/ReportsPage'));
const BudgetTab = lazy(() => import('@/pages/owner/BudgetPage'));

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<'overview' | 'reports' | 'budget'>('overview');

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Аналитика и отчёты' : 'Analytics & Reports'}
        subtitle={isRu ? 'Метрики, отчёты и бюджетирование' : 'Metrics, reports and budgeting'}
        showBack
        fallbackPath="/owner"
      />

      <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="mb-5">
        <TabsList>
          <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="reports">{isRu ? 'Отчёты' : 'Reports'}</TabsTrigger>
          <TabsTrigger value="budget">{isRu ? 'Бюджет' : 'Budget'}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'budget' && <BudgetTab />}
      </Suspense>
    </PageContainer>
  );
}
