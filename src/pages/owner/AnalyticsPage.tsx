import { lazy, Suspense, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageShell, PageHeader, PageTabs, LoadingState } from '@/components/page';

const OverviewTab = lazy(() => import('@/pages/owner/OwnerRevenueDashboard'));
const ReportsTab = lazy(() => import('@/pages/owner/ReportsPage'));
const BudgetTab = lazy(() => import('@/pages/owner/BudgetPage'));

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<'overview' | 'reports' | 'budget'>('overview');

  return (
    <PageShell width="wide">
      <PageHeader
        title={isRu ? 'Аналитика и отчёты' : 'Analytics & Reports'}
        subtitle={isRu ? 'Метрики, отчёты и бюджетирование' : 'Metrics, reports and budgeting'}
        showBack
        fallbackPath="/owner"
      />

      <PageTabs<typeof tab>
        tabs={[
          { value: 'overview', label: isRu ? 'Обзор' : 'Overview' },
          { value: 'reports', label: isRu ? 'Отчёты' : 'Reports' },
          { value: 'budget', label: isRu ? 'Бюджет' : 'Budget' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Suspense fallback={<LoadingState variant="skeleton" layout="cards" rows={6} />}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'budget' && <BudgetTab />}
      </Suspense>
    </PageShell>
  );
}
