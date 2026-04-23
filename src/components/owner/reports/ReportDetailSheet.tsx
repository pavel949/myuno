import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, Building2, Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import { PropertyReport } from '@/hooks/usePropertyReports';
import { ManagementReportDetail } from './ManagementReportDetail';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/hooks/usePropertyFinancials';

interface ReportDetailSheetProps {
  report: PropertyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionSlot?: React.ReactNode;
}

export function ReportDetailSheet({ report, open, onOpenChange, actionSlot }: ReportDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!report) return null;

  const formatCurrency = (amount: number) => {
    return `฿${Number(amount || 0).toLocaleString()}`;
  };

  const localizeCat = (key: string) => {
    const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    const found = all.find(c => c.value === key);
    if (found) return isRu ? found.labelRu : found.labelEn;
    return key.replace(/_/g, ' ');
  };

  const data = (report.data || {}) as Record<string, any>;
  const income = (data.income || {}) as Record<string, any>;
  const expenses = (data.expenses || {}) as Record<string, any>;
  const netIncome = Number(data.net_income || 0);

  const incomeCategories = Object.entries(income.by_category || {}) as [string, number][];
  const expenseCategories = Object.entries(expenses.by_category || {}) as [string, number][];

  // Management reports get their own detailed template
  const isManagementReport = report.report_type === 'management';
  const isOwnerStatement = report.report_type === 'owner_statement';
  const isPnl = report.report_type === 'pnl';
  const mgmtCommission = Number(data.management_commission || 0);
  const ownerPayout = Number(data.owner_payout || netIncome - mgmtCommission);
  const expenseRatio = Number(data.expense_ratio || (income.total ? Math.round((expenses.total / income.total) * 100) : 0));
  const grossProfit = Number(data.gross_profit || income.total);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isManagementReport
              ? (isRu ? 'Управленческий отчёт' : 'Management Report')
              : (isRu ? 'Отчёт' : 'Report')}
          </SheetTitle>
        </SheetHeader>

        {/* Property & period */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{report.property?.title || (isRu ? 'Объект' : 'Property')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(report.period_start), 'dd MMMM', { locale: isRu ? ruLocale : enUS })}
              {' — '}
              {format(new Date(report.period_end), 'dd MMMM yyyy', { locale: isRu ? ruLocale : enUS })}
            </span>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Management reports get their own detailed template */}
        {isManagementReport ? (
          <ManagementReportDetail report={report} />
        ) : isPnl ? (
          /* P&L inline view */
          <div className="space-y-4">
            <div className="rounded-none p-4 bg-muted/50 space-y-3">
              <div className="flex justify-between text-sm">
                <span>{isRu ? 'Выручка' : 'Revenue'}</span>
                <span className="font-bold text-success">{formatCurrency(income.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{isRu ? 'Себестоимость' : 'Cost of Services'}</span>
                <span className="text-destructive">-{formatCurrency((income.total || 0) - grossProfit)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>{isRu ? 'Валовая прибыль' : 'Gross Profit'}</span>
                <span className={grossProfit >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(grossProfit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{isRu ? 'Операционные расходы' : 'Operating Expenses'}</span>
                <span className="text-destructive">-{formatCurrency(Number(data.operating_expenses || 0))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{isRu ? 'Операционная прибыль' : 'Operating Income'}</span>
                <span className={netIncome >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(netIncome)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-none bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{isRu ? 'Коэфф. расходов' : 'Expense Ratio'}</p>
                <p className="text-lg font-bold">{expenseRatio}%</p>
              </div>
              <div className="rounded-none bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{isRu ? 'Маржа' : 'Margin'}</p>
                <p className="text-lg font-bold">{income.total ? Math.round((netIncome / income.total) * 100) : 0}%</p>
              </div>
            </div>
            {expenseCategories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{isRu ? 'Структура расходов' : 'Expense Breakdown'}</h3>
                <div className="space-y-1.5">
                  {expenseCategories.sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                      <span>{localizeCat(cat)}</span>
                      <span className="text-destructive">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isOwnerStatement ? (
          /* Owner Statement inline view */
          <div className="space-y-4">
            <div className={`rounded-none p-4 text-center ${ownerPayout >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-xs text-muted-foreground mb-1">{isRu ? 'К выплате собственнику' : 'Net Payout to Owner'}</p>
              <p className={`text-3xl font-bold ${ownerPayout >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(ownerPayout)}
              </p>
            </div>
            <div className="rounded-none bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isRu ? 'Общий доход' : 'Total Revenue'}</span>
                <span className="font-bold text-success">{formatCurrency(income.total || 0)}</span>
              </div>
              <Separator />
              {expenseCategories.sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{localizeCat(cat)}</span>
                  <span className="text-destructive">-{formatCurrency(amount)}</span>
                </div>
              ))}
              {mgmtCommission > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isRu ? 'Комиссия УК' : 'Mgmt Commission'}</span>
                  <span className="text-destructive">-{formatCurrency(mgmtCommission)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{isRu ? 'Итого к выплате' : 'Net Payout'}</span>
                <span className={ownerPayout >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(ownerPayout)}</span>
              </div>
            </div>
            {data.occupancy !== undefined && (
              <div className="rounded-none bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isRu ? 'Заполняемость' : 'Occupancy'}</span>
                  <Badge variant="secondary">{Math.round(data.occupancy?.rate || 0)}%</Badge>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Net income hero */}
            <div className={`rounded-none p-4 mb-4 text-center ${netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Чистый доход' : 'Net Income'}</p>
              <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
              </p>
            </div>

            {/* Income vs Expenses summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-none bg-success/5 border border-success/20 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Доходы' : 'Income'}</span>
                </div>
                <p className="text-lg font-bold text-success">{formatCurrency(income.total || 0)}</p>
              </div>
              <div className="rounded-none bg-destructive/5 border border-destructive/20 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</span>
                </div>
                <p className="text-lg font-bold text-destructive">{formatCurrency(expenses.total || 0)}</p>
              </div>
            </div>

            {/* Income breakdown */}
            {incomeCategories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {isRu ? 'Источники дохода' : 'Income Sources'}
                </h3>
                <div className="space-y-2">
                  {incomeCategories.sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                      <span className="text-sm">{localizeCat(cat)}</span>
                      <span className="text-sm font-medium text-success">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense breakdown */}
            {expenseCategories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  {isRu ? 'Структура расходов' : 'Expense Breakdown'}
                </h3>
                <div className="space-y-2">
                  {expenseCategories.sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                      <span className="text-sm">{localizeCat(cat)}</span>
                      <span className="text-sm font-medium text-destructive">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Occupancy if available */}
            {data.occupancy !== undefined && (
              <div className="rounded-none bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isRu ? 'Заполняемость' : 'Occupancy'}</span>
                  <Badge variant="secondary">{Math.round(data.occupancy?.rate || 0)}%</Badge>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action slot (e.g. "Proceed to Send" button) */}
        {actionSlot && (
          <div className="pt-4 border-t mt-4">
            {actionSlot}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

