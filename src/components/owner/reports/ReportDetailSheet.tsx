import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, TrendingDown, Building2, Calendar, 
  DollarSign, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import { PropertyReport } from '@/hooks/usePropertyReports';

interface ReportDetailSheetProps {
  report: PropertyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailSheet({ report, open, onOpenChange }: ReportDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!report) return null;

  const formatCurrency = (amount: number) => {
    return `฿${Number(amount || 0).toLocaleString()}`;
  };

  const data = (report.data || {}) as Record<string, any>;
  const income = (data.income || {}) as Record<string, any>;
  const expenses = (data.expenses || {}) as Record<string, any>;
  const netIncome = Number(data.net_income || 0);

  const incomeCategories = Object.entries(income.by_category || {}) as [string, number][];
  const expenseCategories = Object.entries(expenses.by_category || {}) as [string, number][];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isRu ? 'Отчёт' : 'Report'}
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

        {/* Net income hero */}
        <div className={`rounded-xl p-4 mb-4 text-center ${netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Чистый доход' : 'Net Income'}</p>
          <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
            {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
          </p>
        </div>

        {/* Income vs Expenses summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-success/5 border border-success/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Доходы' : 'Income'}</span>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(income.total || 0)}</p>
          </div>
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
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
                  <span className="text-sm capitalize">{cat.replace(/_/g, ' ')}</span>
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
                  <span className="text-sm capitalize">{cat.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-destructive">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occupancy if available */}
        {data.occupancy !== undefined && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isRu ? 'Заполняемость' : 'Occupancy'}</span>
              <Badge variant="secondary">{Math.round(data.occupancy || 0)}%</Badge>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
