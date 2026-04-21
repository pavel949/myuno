/**
 * /me/payments — MePayments
 * Universal payment tracker: "К оплате" + "История".
 * Sourced from public.orders via useMyPayments. Phase B will extend to
 * utilities/tax/visa fees per plan.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, History, ChevronRight } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState, PageSection } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyPayments, type MyPaymentRow } from '@/hooks/useMyPayments';

function PaymentRow({ row, due }: { row: MyPaymentRow; due: boolean }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {row.orderType}
          {row.orderNumber ? ` · ${row.orderNumber}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-GB')}
          {row.vertical ? ` · ${row.vertical}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-sm font-semibold">
          {row.amount.toLocaleString()} {row.currency}
        </p>
        <Badge variant={due ? 'destructive' : 'secondary'} className="mt-0.5 text-[10px] font-normal">
          {row.status}
        </Badge>
      </div>
      {due && (
        <Button asChild size="sm" className="ml-2">
          <Link to={`/orders/${row.orderId}/tracking`}>
            {isRu ? 'Оплатить' : 'Pay'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function MePayments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useMyPayments();

  return (
    <MeShellLayout title={isRu ? 'Платежи' : 'Payments'}>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isRu ? 'Платежи' : 'Payments'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Все ваши платежи в одном месте.' : 'All your payments in one place.'}
          </p>
        </header>

        {data && data.totalDue > 0 && (
          <Card variant="elevated" className="bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{isRu ? 'К оплате' : 'Due now'}</p>
                <p className="font-mono text-xl font-bold">
                  {data.totalDue.toLocaleString()} {data.currency}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <LoadingState />
        ) : !data || (data.dueNow.length === 0 && data.history.length === 0) ? (
          <EmptyState
            icon={Wallet}
            title={isRu ? 'Платежей нет' : 'No payments'}
            description={isRu ? 'Здесь появятся ваши платежи.' : 'Your payments will appear here.'}
          />
        ) : (
          <>
            {data.dueNow.length > 0 && (
              <PageSection title={isRu ? 'К оплате' : 'Due now'} icon={CreditCard}>
                <Card variant="content">
                  <CardContent className="p-4">
                    {data.dueNow.map((r) => <PaymentRow key={r.id} row={r} due />)}
                  </CardContent>
                </Card>
              </PageSection>
            )}
            {data.history.length > 0 && (
              <PageSection title={isRu ? 'История' : 'History'} icon={History}>
                <Card variant="content">
                  <CardContent className="p-4">
                    {data.history.map((r) => <PaymentRow key={r.id} row={r} due={false} />)}
                  </CardContent>
                </Card>
              </PageSection>
            )}
          </>
        )}
      </div>
    </MeShellLayout>
  );
}
