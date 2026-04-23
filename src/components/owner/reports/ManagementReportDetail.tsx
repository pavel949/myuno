import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, TrendingDown, Wrench, Home, DollarSign,
  BarChart3, ClipboardList, Star, Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import { PropertyReport } from '@/hooks/usePropertyReports';

interface ManagementReportDetailProps {
  report: PropertyReport;
}

export function ManagementReportDetail({ report }: ManagementReportDetailProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const formatCurrency = (amount: number) =>
    `฿${Number(amount || 0).toLocaleString()}`;

  const data = (report.data || {}) as Record<string, any>;
  const income = (data.income || {}) as Record<string, any>;
  const expenses = (data.expenses || {}) as Record<string, any>;
  const occupancy = (data.occupancy || {}) as Record<string, any>;
  const maintenance = (data.maintenance || []) as any[];
  const bookings = (data.bookings || []) as any[];
  const netIncome = Number(data.net_income || 0);
  const mgmtCommission = Number(data.management_commission || 0);
  const ownerNetIncome = Number(data.owner_net_income ?? netIncome);
  const recommendations = (data.recommendations || []) as string[];
  const highlights = (data.highlights || []) as string[];

  const incomeCategories = Object.entries(income.by_category || {}) as [string, number][];
  const expenseCategories = Object.entries(expenses.by_category || {}) as [string, number][];
  const occupancyRate = Number(occupancy.rate || 0);

  return (
    <div className="space-y-5">
      {/* Period */}
      <p className="text-xs text-muted-foreground">
        {format(new Date(report.period_start), 'dd MMMM', { locale: isRu ? ruLocale : enUS })}
        {' — '}
        {format(new Date(report.period_end), 'dd MMMM yyyy', { locale: isRu ? ruLocale : enUS })}
      </p>

      {/* KPI: Occupancy */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isRu ? 'Заполняемость' : 'Occupancy'}
          </span>
          <Badge variant="secondary">{occupancyRate}%</Badge>
        </div>
        <Progress value={occupancyRate} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {occupancy.nights_booked || 0} {isRu ? 'ночей из' : 'nights of'} {occupancy.total_nights || 0} •{' '}
          {occupancy.bookings_count || 0} {isRu ? 'броней' : 'bookings'}
        </p>
      </div>

      <Separator />

      {/* Financial summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-none bg-success/5 border border-success/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">{isRu ? 'Доход' : 'Income'}</span>
          </div>
          <p className="text-base font-bold text-success">{formatCurrency(income.total || 0)}</p>
        </div>
        <div className="rounded-none bg-destructive/5 border border-destructive/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</span>
          </div>
          <p className="text-base font-bold text-destructive">{formatCurrency(expenses.total || 0)}</p>
        </div>
      </div>

      {/* Commission & owner net */}
      {mgmtCommission > 0 && (
        <div className="rounded-none bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              {isRu ? 'Комиссия УК' : 'Mgmt Commission'}
            </span>
            <span className="font-medium text-destructive">−{formatCurrency(mgmtCommission)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{isRu ? 'Доход собственника' : 'Owner Net Income'}</span>
            <span className={`font-bold ${ownerNetIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
              {ownerNetIncome >= 0 ? '+' : ''}{formatCurrency(ownerNetIncome)}
            </span>
          </div>
        </div>
      )}

      {/* Net income if no commission breakdown */}
      {mgmtCommission === 0 && (
        <div className={`rounded-none p-3 text-center ${netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Чистый доход' : 'Net Income'}</p>
          <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
            {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
          </p>
        </div>
      )}

      {/* Income breakdown */}
      {incomeCategories.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-success" />
              {isRu ? 'Источники дохода' : 'Income Sources'}
            </h3>
            <div className="space-y-1.5">
              {incomeCategories.sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="text-sm capitalize">{cat.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-success">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Expense breakdown */}
      {expenseCategories.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-destructive" />
              {isRu ? 'Структура расходов' : 'Expense Breakdown'}
            </h3>
            <div className="space-y-1.5">
              {expenseCategories.sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="text-sm capitalize">{cat.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-destructive">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Maintenance / works done */}
      {maintenance.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              {isRu ? 'Работы и обслуживание' : 'Maintenance & Works'}
            </h3>
            <div className="space-y-2">
              {maintenance.map((m, i) => (
                <div key={i} className="flex items-start justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm capitalize">{m.type?.replace(/_/g, ' ')}</p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground">{m.description.substring(0, 60)}</p>
                    )}
                    {m.date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(m.date), 'dd MMM', { locale: isRu ? ruLocale : enUS })}
                      </p>
                    )}
                  </div>
                  {m.cost > 0 && (
                    <span className="text-sm font-medium text-destructive shrink-0 ml-2">
                      {formatCurrency(m.cost)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bookings summary */}
      {bookings.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Home className="h-4 w-4 text-primary" />
              {isRu ? `Бронирования (${bookings.length})` : `Bookings (${bookings.length})`}
            </h3>
            <div className="space-y-1.5">
              {bookings.slice(0, 5).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm">{b.guest_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.check_in ? format(new Date(b.check_in), 'dd MMM', { locale: isRu ? ruLocale : enUS }) : '—'}
                      {' → '}
                      {b.check_out ? format(new Date(b.check_out), 'dd MMM', { locale: isRu ? ruLocale : enUS }) : '—'}
                      {b.source && (
                        <span className="ml-1.5 text-primary">• {b.source}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(b.total_amount)}</span>
                </div>
              ))}
              {bookings.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{bookings.length - 5} {isRu ? 'ещё' : 'more'}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Booking Sources breakdown */}
      {bookings.length > 0 && (() => {
        const sourceCounts: Record<string, { count: number; revenue: number }> = {};
        bookings.forEach((b: any) => {
          const src = b.source || 'direct';
          if (!sourceCounts[src]) sourceCounts[src] = { count: 0, revenue: 0 };
          sourceCounts[src].count++;
          sourceCounts[src].revenue += Number(b.total_amount || 0);
        });
        const entries = Object.entries(sourceCounts).sort(([, a], [, b]) => b.revenue - a.revenue);
        return (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                {isRu ? 'Источники бронирований' : 'Booking Sources'}
              </h3>
              <div className="space-y-1.5">
                {entries.map(([src, data]) => (
                  <div key={src} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize">{src.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{data.count}</Badge>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(data.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Highlights */}
      {highlights.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-warning" />
              {isRu ? 'Ключевые события' : 'Highlights'}
            </h3>
            <ul className="space-y-1">
              {highlights.map((h, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              {isRu ? 'Рекомендации' : 'Recommendations'}
            </h3>
            <ul className="space-y-1">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
