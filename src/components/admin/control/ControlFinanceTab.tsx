import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Building2,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTHB } from '@/lib/finance/formatters';
import {
  usePlatformFinanceKpis,
  type PlatformFinancePeriod,
} from '@/hooks/usePlatformFinanceKpis';
import { cn } from '@/lib/utils';

const PERIODS: { value: PlatformFinancePeriod; labelRu: string; labelEn: string }[] = [
  { value: '7d', labelRu: '7 дней', labelEn: '7 days' },
  { value: '30d', labelRu: '30 дней', labelEn: '30 days' },
  { value: '90d', labelRu: '90 дней', labelEn: '90 days' },
  { value: 'mtd', labelRu: 'С начала месяца', labelEn: 'Month to date' },
  { value: 'ytd', labelRu: 'С начала года', labelEn: 'Year to date' },
  { value: 'all', labelRu: 'Всё время', labelEn: 'All time' },
];

export function ControlFinanceTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [period, setPeriod] = useState<PlatformFinancePeriod>('30d');
  const { gmv, subscriptions, isLoading, isError, error, refetch } = usePlatformFinanceKpis(period);

  const t = (ru: string, en: string) => (isRu ? ru : en);

  const metrics = gmv
    ? [
        {
          label: t('Оборот (GMV)', 'Gross volume (GMV)'),
          hint: t(
            'Сумма заказов со статусами confirmed / in_progress / completed',
            'Sum of order totals (confirmed, in progress, completed)',
          ),
          value: formatTHB(gmv.gmv),
          icon: DollarSign,
          color: 'text-success',
        },
        {
          label: t('Доход платформы', 'Platform take'),
          hint: t(
            'Комиссия платформы + сервисный сбор (concierge), те же заказы',
            'Platform fee + concierge fee on the same orders',
          ),
          value: formatTHB(gmv.platform_take ?? gmv.total_commission),
          icon: Wallet,
          color: 'text-primary',
        },
        {
          label: t('Выплаты партнёрам', 'Vendor payouts'),
          hint: t('Сумма vendor_payout_amount по учтённым заказам', 'Sum of vendor_payout_amount'),
          value: formatTHB(gmv.total_vendor_payouts),
          icon: TrendingUp,
          color: 'text-info',
        },
        {
          label: t('Заказы (все статусы в периоде)', 'Orders in period'),
          hint: t(
            'Все неудалённые заказы за период (включая черновики и отмены)',
            'All non-deleted orders in range (any status)',
          ),
          value: String(gmv.total_orders),
          icon: CreditCard,
          color: 'text-muted-foreground',
        },
      ]
    : [];

  const secondary = gmv
    ? [
        {
          label: t('Средний чек', 'Avg order value'),
          value: formatTHB(gmv.avg_order_value),
        },
        {
          label: t('Только комиссия', 'Commission only'),
          value: formatTHB(gmv.total_commission),
        },
        {
          label: t('Concierge / сервис', 'Concierge / service'),
          value: formatTHB(gmv.total_concierge_fee ?? 0),
        },
        {
          label: t('Активных подписок (B2B)', 'Active vendor subscriptions'),
          value: subscriptions ? String(subscriptions.activeCount) : '—',
        },
        {
          label: t('Оценка MRR (по тарифам)', 'Est. MRR (plan list prices)'),
          value: subscriptions ? formatTHB(subscriptions.estimatedMrrThb) : '—',
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="h-4 w-4 shrink-0" />
          <span>
            {t(
              'Экономика платформы: заказы + подписки провайдеров',
              'Platform economics: marketplace orders + vendor subscriptions',
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as PlatformFinancePeriod)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {isRu ? p.labelRu : p.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label={t('Обновить', 'Refresh')}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error instanceof Error ? error.message : t('Ошибка загрузки', 'Failed to load')}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !gmv
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-16 animate-pulse rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))
          : metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <metric.icon className={cn('h-5 w-5', metric.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold truncate">{metric.value}</p>
                      <p className="text-sm text-muted-foreground leading-tight">{metric.label}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                        {metric.hint}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {secondary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {secondary.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
            >
              <p className="text-muted-foreground text-xs">{row.label}</p>
              <p className="font-semibold">{row.value}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('По вертикалям (GMV)', 'By vertical (GMV)')}
          </CardTitle>
          <CardDescription>
            {t(
              'Источник: таблица orders, RPC get_gmv_summary. Подписки: vendor_subscriptions × subscription_plans.',
              'Source: orders via get_gmv_summary. Subscriptions: vendor_subscriptions × subscription_plans.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!gmv?.by_vertical?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('Нет заказов в выбранном периоде', 'No orders in the selected period')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Вертикаль', 'Vertical')}</TableHead>
                  <TableHead className="text-right">{t('Заказы', 'Orders')}</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                  <TableHead className="text-right">{t('Комиссия', 'Commission')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gmv.by_vertical.map((row) => (
                  <TableRow key={row.vertical}>
                    <TableCell className="font-medium">{row.vertical}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">{formatTHB(row.gmv)}</TableCell>
                    <TableCell className="text-right">{formatTHB(row.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
