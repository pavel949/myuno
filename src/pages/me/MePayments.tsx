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
import { CancelOrderAction } from '@/components/orders/CancelOrderAction';
import { pickLang } from '@/lib/i18n/pickLang';

function PaymentRow({ row, due }: { row: MyPaymentRow; due: boolean }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <div className="flex flex-wrap items-center gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="h-9 w-9 rounded-none bg-muted flex items-center justify-center shrink-0">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {row.orderType}
          {row.orderNumber ? ` · ${row.orderNumber}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {Number.isNaN(new Date(row.createdAt).getTime()) ? pickLang(language, { ru: 'Дата неизвестна', en: 'Date unavailable', th: 'ไม่ทราบวันที่' }) : new Date(row.createdAt).toLocaleDateString(isRu ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB')}
          {row.vertical ? ` · ${row.vertical}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">{pickLang(language, { ru: "Сумма заказа", en: "Order amount", th: "ยอดคำสั่งซื้อ" })}</p>
        <p className="font-mono text-sm font-semibold">
          {row.amount.toLocaleString()} {row.currency}
        </p>
        <Badge variant={due ? 'destructive' : 'secondary'} className="mt-0.5 text-[10px] font-normal">
          {row.status}
        </Badge>
      </div>
      {due && (
        <div className="flex flex-wrap items-center gap-2"><Button asChild size="sm">
          <Link to={`/orders/${row.orderId}/tracking`}>
            {isRu ? 'Оплатить' : 'Pay'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button><CancelOrderAction orderId={row.orderId} status={row.status} /></div>
      )}
    </div>
  );
}

export default function MePayments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading, isError, refetch } = useMyPayments();

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

        {data && !isError && data.totalDue !== null && data.totalDue > 0 && (
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
        ) : isError ? <div role="alert" className="space-y-2">
          <p>{pickLang(language, { ru: 'Не удалось загрузить платежи. Баланс и история недоступны.', en: 'Payments could not be loaded. Balance and history are unavailable.', th: 'โหลดการชำระเงินไม่สำเร็จ ยอดเงินและประวัติยังไม่พร้อมใช้งาน' })}</p>
          <Button variant="outline" onClick={() => void refetch()}>{pickLang(language, { ru: 'Повторить', en: 'Retry', th: 'ลองอีกครั้ง' })}</Button>
        </div> : !data || (data.dueNow.length === 0 && data.history.length === 0) ? (
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
              <PageSection title={pickLang(language, { ru: 'История заказов', en: 'Order activity', th: 'ประวัติคำสั่งซื้อ' })} icon={History}>
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
