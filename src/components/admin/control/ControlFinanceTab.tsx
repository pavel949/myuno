import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, CreditCard, Wallet, BarChart3 } from 'lucide-react';
import { useAdminFinance, getVerticalLabel } from '@/hooks/useAdminFinance';
import { cn } from '@/lib/utils';

export function ControlFinanceTab() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
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

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground" role="status">
          {t('admin.finance.evidence.unavailable')}
        </CardContent>
      </Card>
    );
  }

  const gmv = summary?.totalGmv || 0;
  const platformRev = summary?.platformRevenue || 0;
  const vendorPay = summary?.vendorPayouts || 0;
  const pendingPay = summary?.pendingPayouts || 0;
  const takeRate = summary?.averageTakeRate || 0;
  const orderCount = summary?.orderCount || 0;
  const feesAndSubscriptions = platformRev + (summary?.subscriptionRevenue || 0);

  const metrics = [
    {
      label: t('admin.finance.evidence.orderTotal'),
      value: formatPrice(gmv),
      icon: DollarSign,
      color: 'text-foreground',
      sub: `${orderCount} ${t('admin.finance.kpi.orders')}`,
    },
    {
      label: t('admin.finance.evidence.orderFees'),
      value: formatPrice(platformRev),
      icon: TrendingUp,
      color: 'text-foreground',
      sub: `${takeRate.toFixed(1)}% ${t('admin.finance.kpi.takeRate')}`,
    },
    {
      label: t('admin.finance.evidence.vendorShare'),
      value: formatPrice(vendorPay),
      icon: CreditCard,
      color: 'text-info',
      sub: `${t('admin.finance.evidence.pendingBalance')}: ${formatPrice(pendingPay)}`,
    },
    {
      label: t('admin.finance.evidence.feesAndSubscriptions'),
      value: summary.subscriptionRevenueUnavailable
        ? t('admin.finance.evidence.unavailable')
        : formatPrice(feesAndSubscriptions),
      icon: Wallet,
      color: 'text-foreground',
      sub: t(summary.subscriptionRevenueUnavailable
        ? 'admin.finance.evidence.subscriptionsUnavailable'
        : 'admin.finance.evidence.beforeExpenses'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-none border bg-muted/30 p-4 space-y-1 text-sm" role="note">
        <p className="font-medium">{t('admin.finance.evidence.provisional30Days')}</p>
        <p className="text-muted-foreground">{t('admin.finance.evidence.orderSource')}</p>
        <p className="text-muted-foreground">{t('admin.finance.evidence.subscriptionSource')}</p>
        <p className="text-muted-foreground">{t('admin.finance.evidence.pendingSource')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-none bg-muted flex items-center justify-center">
                  <metric.icon className={cn("h-5 w-5", metric.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold break-words">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-[10px] text-muted-foreground/70">{metric.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {byVertical.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {t('admin.finance.evidence.ordersByVertical')}
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
                        {v.orderCount} {t('admin.finance.kpi.orders')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t('admin.finance.feeShort')}: {formatPrice(v.platformRevenue)} ({v.takeRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {byVertical.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('admin.finance.evidence.noBreakdown')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
