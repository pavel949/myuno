import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAcquisitionMetrics } from '@/hooks/useAcquisitionMetrics';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AcquisitionMetrics() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles();
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  const [period, setPeriod] = useState(30);
  const admitted = !authLoading && !rolesLoading && Boolean(user) && hasRole('admin');
  const query = useAcquisitionMetrics(period, admitted, user?.id);
  const number = (value: number | null) => value === null ? '—' : value.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US');

  if (authLoading || rolesLoading) return <Skeleton className="h-64" />;
  if (!admitted) return <Navigate to={APP_ROUTES.HOME} replace />;

  return (
    <section className="min-w-0 space-y-6 p-4 md:p-6" aria-label={t('Acquisition metrics', 'Показатели привлечения')}>
      <h2 className="text-2xl font-display">{t('Acquisition by channel', 'Привлечение по каналам')}</h2>
      <div className="flex flex-wrap gap-2" aria-label={t('Period', 'Период')}>
        {[7, 30, 90].map(days => (
          <Button key={days} size="sm" variant={period === days ? 'default' : 'outline'}
            aria-pressed={period === days} onClick={() => setPeriod(days)}>
            {days} {t('days', 'дней')}
          </Button>
        ))}
      </div>
      {query.isLoading ? <Skeleton className="h-64" /> : query.isError ? (
        <div role="alert" className="space-y-3 text-destructive">
          <p>{t('Could not load acquisition metrics.', 'Не удалось загрузить показатели привлечения.')}</p>
          <Button variant="outline" onClick={() => query.refetch()}>{t('Retry', 'Повторить')}</Button>
        </div>
      ) : query.data && query.data.rowCount > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {t('Latest channel record', 'Последняя запись по каналам')}: {query.data.latestDate}
          </p>
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader><TableRow>
                {[t('Channel', 'Канал'), t('Impressions', 'Показы'), t('Clicks', 'Клики'),
                  t('Leads', 'Заявки'), t('Signups', 'Регистрации'), t('Recorded conversions', 'Учтённые конверсии')]
                  .map((label, index) => <TableHead key={label} className={index ? 'whitespace-nowrap text-right' : 'whitespace-nowrap'}>{label}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>{query.data.channels.map(row => <TableRow key={row.channel}>
                <TableCell>{row.channel}</TableCell>
                {[row.impressions, row.clicks, row.leads, row.signups, row.conversions].map((value, index) =>
                  <TableCell key={index} className="whitespace-nowrap text-right font-mono tabular-nums">{number(value)}</TableCell>)}
              </TableRow>)}</TableBody>
            </Table>
          </div>
        </>
      ) : <p role="status" className="text-muted-foreground">{t('No channel metrics recorded for this period.', 'За выбранный период показатели каналов не записаны.')}</p>}
    </section>
  );
}
