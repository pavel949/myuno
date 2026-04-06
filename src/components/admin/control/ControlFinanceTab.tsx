import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { useAdminFinance, getVerticalLabel } from '@/hooks/useAdminFinance';
import { cn } from '@/lib/utils';

export function ControlFinanceTab() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const { summary, byVertical, isLoading } = useAdminFinance(30);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-40" /></CardContent></Card>
      </div>
    );
  }

  const gmv = summary?.totalGmv || 0;
  const platformRev = summary?.platformRevenue || 0;
  const vendorPay = summary?.vendorPayouts || 0;
  const pendingPay = summary?.pendingPayouts || 0;
  const takeRate = summary?.averageTakeRate || 0;
  const orderCount = summary?.orderCount || 0;
  const netIncome = platformRev + (summary?.subscriptionRevenue || 0);

  const metrics = [
    {
      label: isRu ? 'Оборот (GMV)' : 'GMV',
      value: formatPrice(gmv),
      icon: DollarSign,
      color: 'text-foreground',
      sub: `${orderCount} ${isRu ? 'заказов' : 'orders'}`,
    },
    {
      label: isRu ? 'Доход платформы' : 'Platform Revenue',
      value: formatPrice(platformRev),
      icon: TrendingUp,
      color: 'text-success',
      sub: `${takeRate.toFixed(1)}% ${isRu ? 'комиссия' : 'take rate'}`,
    },
    {
      label: isRu ? 'Выплаты вендорам' : 'Vendor Payouts',
      value: formatPrice(vendorPay),
      icon: CreditCard,
      color: 'text-info',
      sub: pendingPay > 0
        ? `${formatPrice(pendingPay)} ${isRu ? 'ожидает' : 'pending'}`
        : (isRu ? 'Всё выплачено' : 'All paid'),
    },
    {
      label: isRu ? 'Чистый доход' : 'Net Income',
      value: formatPrice(netIncome),
      icon: Wallet,
      color: netIncome >= 0 ? 'text-success' : 'text-destructive',
      sub: isRu ? 'за 30 дней' : 'last 30 days',
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <metric.icon className={cn("h-5 w-5", metric.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold truncate">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-[10px] text-muted-foreground/70">{metric.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by Vertical */}
      {byVertical.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {isRu ? 'Доход по вертикалям' : 'Revenue by Vertical'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byVertical.map((v) => {
              const pct = gmv > 0 ? (v.gmv / gmv) * 100 : 0;
              return (
                <div key={v.vertical} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {getVerticalLabel(v.vertical, language)}
                      </span>
                      <span className="text-sm text-muted-foreground shrink-0 ml-2">
                        {formatPrice(v.gmv)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {v.orderCount} {isRu ? 'заказов' : 'orders'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {isRu ? 'Комиссия' : 'Fee'}: {formatPrice(v.platformRevenue)} ({v.takeRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {byVertical.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isRu
              ? 'Нет подтверждённых заказов за последние 30 дней'
              : 'No confirmed orders in the last 30 days'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
