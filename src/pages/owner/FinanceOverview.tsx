import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMcFinanceOverview } from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Minus, Receipt, FileText, Target, LineChart, ChevronRight,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

export default function FinanceOverview() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const lang = language === 'th' ? 'th' : isRu ? 'ru' : 'en';
  const locale = { ru: 'ru-RU', en: 'en-GB', th: 'th-TH' }[lang];
  const { months, asOf, isLoading, isError, retry } = useMcFinanceOverview();
  const current = months?.[months.length - 1];
  const omitted = months?.some(month => month.omittedRecords > 0);
  const t = {
    ru: {
      title: 'Финансы', subtitle: 'Учёт операций управляющей компании',
      actual: 'Фактические поступления и расходы', unreconciled: 'Не сверено',
      actualNote: 'На этом экране нет сверки с оплатами. Суммы ниже показывают записи учёта, а не движение денег или прибыль.',
      recordedIncome: 'Начисления без сверки', recordedExpenses: 'Расходы по записям',
      recordedNote: 'По датам операций до указанной даты включительно, время Пхукета.',
      noEntries: 'За этот месяц записей нет', noScope: 'Нет доступных финансовых данных для выбранной компании.',
      error: 'Не удалось загрузить записи учёта.', retry: 'Повторить',
      chart: 'Записи учёта по месяцам', months: '6 мес. · THB',
      chartNote: 'Только суммы в батах. Это не отчёт о прибыли или движении денег.',
      omitted: 'Некоторые суммы не включены: валюта или сумма в записи не указана корректно.',
      transactions: 'Транзакции', reports: 'Отчёты', budget: 'Бюджет',
      planning: 'Финансовое планирование', invoices: 'Инвойсы',
      addExpense: 'Добавить расход', addIncome: 'Добавить доход', sections: 'Разделы',
    },
    en: {
      title: 'Finance', subtitle: 'Management company transaction records',
      actual: 'Actual cash in and out', unreconciled: 'Not reconciled',
      actualNote: 'This screen does not reconcile payments. The amounts below are records, not cash flows or profit.',
      recordedIncome: 'Unreconciled accruals', recordedExpenses: 'Recorded expenses',
      recordedNote: 'Based on transaction dates through the date shown, Phuket time.',
      noEntries: 'No records this month', noScope: 'No financial data is accessible for the selected company.',
      error: 'Could not load transaction records.', retry: 'Retry',
      chart: 'Transaction records by month', months: '6 mo. · THB',
      chartNote: 'Thai baht only. This is not a profit or cash-flow report.',
      omitted: 'Some amounts were excluded because the recorded currency or amount is invalid.',
      transactions: 'Transactions', reports: 'Reports', budget: 'Budget',
      planning: 'Financial planning', invoices: 'Invoices',
      addExpense: 'Add expense', addIncome: 'Add income', sections: 'Sections',
    },
    th: {
      title: 'การเงิน', subtitle: 'รายการบันทึกของบริษัทจัดการ',
      actual: 'เงินรับและเงินจ่ายจริง', unreconciled: 'ยังไม่ได้กระทบยอด',
      actualNote: 'หน้านี้ยังไม่ได้กระทบยอดกับการชำระเงิน ยอดด้านล่างเป็นรายการบันทึก ไม่ใช่กระแสเงินสดหรือกำไร',
      recordedIncome: 'รายได้ค้างรับที่ยังไม่กระทบยอด', recordedExpenses: 'ค่าใช้จ่ายตามรายการบันทึก',
      recordedNote: 'อิงวันที่ทำรายการจนถึงวันที่แสดง ตามเวลาภูเก็ต',
      noEntries: 'ไม่มีรายการในเดือนนี้', noScope: 'ไม่มีข้อมูลการเงินที่เข้าถึงได้สำหรับบริษัทที่เลือก',
      error: 'โหลดรายการบันทึกไม่สำเร็จ', retry: 'ลองอีกครั้ง',
      chart: 'รายการบันทึกรายเดือน', months: '6 เดือน · THB',
      chartNote: 'แสดงเฉพาะเงินบาท ไม่ใช่รายงานกำไรหรือกระแสเงินสด',
      omitted: 'ไม่รวมบางรายการเนื่องจากสกุลเงินหรือจำนวนเงินไม่ถูกต้อง',
      transactions: 'รายการธุรกรรม', reports: 'รายงาน', budget: 'งบประมาณ',
      planning: 'วางแผนการเงิน', invoices: 'ใบแจ้งหนี้',
      addExpense: 'เพิ่มค่าใช้จ่าย', addIncome: 'เพิ่มรายรับ', sections: 'เมนูการเงิน',
    },
  }[lang];

  const fmt = (value: number, currency = 'THB', compact = false) => new Intl.NumberFormat(locale, {
    style: 'currency', currency,
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
  }).format(value);
  const dateLabel = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
      .format(new Date(`${day}T00:00:00Z`));

  const chartData = (months ?? []).map(month => {
    const thb = month.byCurrency.find(row => row.currency === 'THB');
    return {
      label: dateLabel(month.start, { month: 'short' }),
      income: thb?.recordedIncome ?? null,
      expenses: thb?.recordedExpenses ?? null,
    };
  });

  // Quick navigation cards
  const quickLinks = [
    { icon: Receipt, label: t.transactions, path: '/mc/financials', color: 'text-primary' },
    { icon: FileText, label: t.reports, path: '/mc/reports', color: 'text-info' },
    { icon: Target, label: t.budget, path: '/mc/budget', color: 'text-warning' },
    { icon: LineChart, label: t.planning, path: APP_ROUTES.MC_FINANCE_PLANNING, color: 'text-success dark:text-success' },
    { icon: Receipt, label: t.invoices, path: '/mc/invoices', color: 'text-muted-foreground' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        showBack
        fallbackPath="/owner"
      />

      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <h2 className="font-semibold">{t.actual}</h2>
          <Badge variant="secondary">{t.unreconciled}</Badge>
          <p className="text-sm text-muted-foreground">{t.actualNote}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : isError ? (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          {t.error}
          <Button variant="outline" size="sm" onClick={() => void retry()}>{t.retry}</Button>
        </div>
      ) : !current ? (
        <p className="mb-6 text-sm text-muted-foreground">{t.noScope}</p>
      ) : (
        <section aria-label={dateLabel(asOf, { month: 'long', year: 'numeric' })} className="mb-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {dateLabel(asOf, { day: 'numeric', month: 'long', year: 'numeric' })}. {t.recordedNote}
          </p>
          {!current.byCurrency.length ? (
            !current.omittedRecords && <p className="text-sm text-muted-foreground">{t.noEntries}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(['recordedIncome', 'recordedExpenses'] as const).map(field => (
                <Card key={field}>
                  <CardContent className="space-y-2 p-4">
                    <h2 className="text-sm font-medium">{t[field]}</h2>
                    {current.byCurrency.every(row => row[field] === null)
                      ? <p className="text-sm text-muted-foreground">{t.noEntries}</p>
                      : current.byCurrency.map(row => {
                        const value = row[field];
                        return value === null ? null : (
                          <p key={row.currency} className="break-words text-lg font-semibold tabular-nums">
                            {fmt(value, row.currency)}
                          </p>
                        );
                      })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {omitted && <p className="text-sm text-muted-foreground">{t.omitted}</p>}
        </section>
      )}

      {/* Quick Actions */}
      <div className="grid gap-2 mb-6 sm:grid-cols-2">
        <Button
          className="w-full"
          variant="default"
          onClick={() => navigate('/mc/quick-expense')}
        >
          <Minus className="h-4 w-4 mr-2" />
          {t.addExpense}
        </Button>
        <Button
          className="w-full border-success text-success hover:bg-success/10"
          variant="outline"
          onClick={() => navigate('/mc/income/quick')}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.addIncome}
        </Button>
      </div>

      {/* Revenue Chart */}
      {chartData.some(month => month.income !== null || month.expenses !== null) && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {t.chart}
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                {t.months}
              </Badge>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{t.chartNote}</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, 'THB', true)} width={64} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      fmt(value),
                      name === 'income' ? t.recordedIncome : t.recordedExpenses,
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          {t.sections}
        </h2>
        <div className="divide-y rounded-none border overflow-hidden">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors "
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", link.color)} />
                <span className="flex-1 text-sm font-medium text-left">{link.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </button>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
