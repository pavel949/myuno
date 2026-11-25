import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, BarChart3, Rocket, Wallet, ListChecks } from 'lucide-react';
import { ControlFinanceTab } from '@/components/admin/control/ControlFinanceTab';
import { ControlAnalyticsTab } from '@/components/admin/control/ControlAnalyticsTab';
import { AdminPromotionsTab } from '@/components/admin/finance/AdminPromotionsTab';
import { ReconciliationStatus } from '@/components/admin/finance/ReconciliationStatus';
import { ManualPaymentForm } from '@/components/admin/finance/ManualPaymentForm';
import { PayoutManager } from '@/components/admin/PayoutManager';
import { PayoutRunPanel } from '@/components/admin/finance/PayoutRunPanel';
import { PageShell, PageHeader } from '@/components/page';

export default function AdminFinance() {
  const { t, language } = useLanguage();

  return (
    <PageShell width="wide">
      <PageHeader
        title={t('admin.finance.title')}
        subtitle={t('admin.finance.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <ReconciliationStatus compact />
            <ManualPaymentForm />
          </div>
        }
      />

      <Tabs defaultValue="run" className="w-full">
        <TabsList>
          <TabsTrigger value="run" className="gap-1.5">
            <ListChecks className="h-4 w-4" />
            {language === 'ru' ? 'Выплаты и сверка' : 'Payouts & reconciliation'}
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            {t('admin.finance.tabs.transactions')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t('admin.finance.tabs.analytics')}
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5">
            <Rocket className="h-4 w-4" />
            {t('admin.finance.tabs.promotions')}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            {t('admin.finance.tabs.payouts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-4">
          <PayoutRunPanel />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <ControlFinanceTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <ControlAnalyticsTab />
        </TabsContent>
        <TabsContent value="promotions" className="mt-4">
          <AdminPromotionsTab />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutManager />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
