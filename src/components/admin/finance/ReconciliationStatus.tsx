import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLedgerReconciliation } from '@/hooks/useLedgerReconciliation';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';

interface ReconciliationStatusProps {
  days?: number;
  compact?: boolean;
}

export function ReconciliationStatus({ days = 30, compact = false }: ReconciliationStatusProps) {
  const { language, t } = useLanguage();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { data, isLoading, isError, isFetching, refetch } = useLedgerReconciliation(days);

  if (isLoading) {
    return (
      <div role="status">
        <span className="sr-only">{t('admin.finance.recon.loading')}</span>
        <div aria-hidden="true">
          {compact ? <Skeleton className="h-6 w-24" /> : <ContentSkeleton variant="card" count={1} />}
        </div>
      </div>
    );
  }

  if (isError) {
    return compact ? (
      <Badge variant="outline" className="gap-1 text-warning">
        <AlertTriangle className="size-3" aria-hidden="true" />
        {local('Сверка недоступна', 'Reconciliation unavailable', 'ไม่สามารถกระทบยอดได้')}
      </Badge>
    ) : <QueryRecovery onRetry={refetch} isRetrying={isFetching} />;
  }

  if (!data || data.totalOrders === 0) {
    return compact ? null : (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        {t('admin.finance.recon.noData')}
      </Badge>
    );
  }

  const Icon = data.isHealthy ? CheckCircle2 : AlertTriangle;
  const statusTone = data.isHealthy ? 'text-success' : 'text-destructive';
  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1', statusTone, data.isHealthy ? 'border-success/20 bg-success/10' : 'border-destructive/20 bg-destructive/10')}
      >
        <Icon className="size-3" aria-hidden="true" />
        {data.isHealthy
          ? t('admin.finance.recon.ok')
          : `${data.missingLedger + data.amountMismatch} ${t('admin.finance.recon.issues')}`}
      </Badge>
    );
  }

  const metrics = [
    { label: local('Проверено заказов', 'Orders checked', 'คำสั่งซื้อที่ตรวจสอบ'), value: data.totalOrders },
    { label: local('Совпадения', 'Matched orders', 'คำสั่งซื้อที่ตรงกัน'), value: data.matchedOrders },
    { label: local('Нет записи в реестре', 'Missing ledger entries', 'รายการบัญชีที่ขาดหาย'), value: data.missingLedger },
    { label: local('Расхождения в суммах', 'Amount differences', 'ส่วนต่างของยอดเงิน'), value: data.amountMismatch },
  ];
  const number = new Intl.NumberFormat(language);
  return (
    <Card>
      <CardHeader>
        <h3 className={cn('flex items-start gap-2 text-body font-semibold', statusTone)}>
          <Icon className="size-5 shrink-0" aria-hidden="true" />
          {t(data.isHealthy ? 'admin.finance.recon.passed' : 'admin.finance.recon.issuesFound')}
        </h3>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(({ label, value }) => (
            <div key={label} className="min-w-0 rounded-[var(--bible-radius-control)] border border-border p-3">
              <dt className="text-body-sm text-muted-foreground">{label}</dt>
              <dd className="font-display text-h4 tabular-nums">{number.format(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
