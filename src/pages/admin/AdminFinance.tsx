import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, ClipboardCheck, DollarSign, Rocket, Wallet } from 'lucide-react';
import { ControlFinanceTab } from '@/components/admin/control/ControlFinanceTab';
import { ControlAnalyticsTab } from '@/components/admin/control/ControlAnalyticsTab';
import { AdminPromotionsTab } from '@/components/admin/finance/AdminPromotionsTab';
import { ReconciliationStatus } from '@/components/admin/finance/ReconciliationStatus';
import { ManualPaymentForm } from '@/components/admin/finance/ManualPaymentForm';
import { PayoutManager } from '@/components/admin/PayoutManager';
import { PageShell, PageHeader } from '@/components/page';
import { pickLang } from '@/lib/i18n/pickLang';

const financeTabs = new Set(['finance', 'payouts', 'reconciliation', 'analytics', 'promotions']);

export default function AdminFinance() {
  const { language, t } = useLanguage();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [search, setSearch] = useSearchParams();
  const requestedTab = search.get('tab');
  const activeTab = requestedTab && financeTabs.has(requestedTab) ? requestedTab : 'finance';
  const reconciliationTitle = local('Сверка', 'Reconciliation', 'กระทบยอด');
  const changeTab = (tab: string) => {
    if (!financeTabs.has(tab)) return;
    const next = new URLSearchParams(search);
    if (tab === 'finance') next.delete('tab');
    else next.set('tab', tab);
    setSearch(next, { replace: true });
  };

  return (
    <PageShell width="wide">
      <PageHeader
        title={local('Платежи и выплаты', 'Payments & payouts', 'การชำระเงินและการจ่ายเงิน')}
        subtitle={t('admin.finance.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReconciliationStatus compact />
            <ManualPaymentForm />
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
        <TabsList
          aria-label={local('Разделы финансов', 'Finance sections', 'ส่วนการเงิน')}
          className="flex h-auto w-full flex-wrap justify-start gap-1"
        >
          <TabsTrigger value="finance" className="min-h-11 gap-1.5">
            <DollarSign className="size-4" aria-hidden="true" />
            {t('admin.finance.tabs.transactions')}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="min-h-11 gap-1.5">
            <Wallet className="size-4" aria-hidden="true" />
            {t('admin.finance.tabs.payouts')}
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="min-h-11 gap-1.5">
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {reconciliationTitle}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="min-h-11 gap-1.5">
            <BarChart3 className="size-4" aria-hidden="true" />
            {t('admin.finance.tabs.analytics')}
          </TabsTrigger>
          <TabsTrigger value="promotions" className="min-h-11 gap-1.5">
            <Rocket className="size-4" aria-hidden="true" />
            {t('admin.finance.tabs.promotions')}
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
        <TabsContent value="reconciliation" className="mt-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-h3 font-display">{reconciliationTitle}</h2>
            <p className="text-body-sm text-muted-foreground">
              {local(
                'Сравнение подтверждённых и завершённых заказов за последние 30 дней с записями реестра.',
                'Confirmed and completed orders from the past 30 days are checked against their ledger entries.',
                'ตรวจสอบคำสั่งซื้อที่ยืนยันและเสร็จสิ้นในช่วง 30 วันที่ผ่านมากับรายการในบัญชีแยกประเภท',
              )}
            </p>
          </div>
          <ReconciliationStatus />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
