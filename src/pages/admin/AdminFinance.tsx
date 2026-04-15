import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ds';
import { DollarSign, BarChart3, Rocket, Wallet } from 'lucide-react';
import { ControlFinanceTab } from '@/components/admin/control/ControlFinanceTab';
import { ControlAnalyticsTab } from '@/components/admin/control/ControlAnalyticsTab';
import { AdminPromotionsTab } from '@/components/admin/finance/AdminPromotionsTab';
import { ReconciliationStatus } from '@/components/admin/finance/ReconciliationStatus';
import { ManualPaymentForm } from '@/components/admin/finance/ManualPaymentForm';
import { PayoutManager } from '@/components/admin/PayoutManager';

export default function AdminFinance() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title={isRu ? 'Финансы' : 'Finance'}
          subtitle={isRu ? 'Транзакции, комиссии и аналитика доходов' : 'Transactions, commissions and revenue analytics'}
          icon={DollarSign}
          size="lg"
        />
        <div className="flex items-center gap-2">
          <ReconciliationStatus compact />
          <ManualPaymentForm />
        </div>
      </div>

      <Tabs defaultValue="finance" className="w-full">
        <TabsList>
          <TabsTrigger value="finance" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            {isRu ? 'Транзакции' : 'Transactions'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {isRu ? 'Аналитика' : 'Analytics'}
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5">
            <Rocket className="h-4 w-4" />
            {isRu ? 'Промо' : 'Promotions'}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            {isRu ? 'Выплаты' : 'Payouts'}
          </TabsTrigger>
        </TabsList>

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
    </div>
  );
}
