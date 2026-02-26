import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  CalendarClock, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { 
  format, addMonths, startOfMonth, endOfMonth, 
  parseISO, isAfter, isBefore, addDays 
} from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { getAccessiblePropertyIds } from '@/lib/getAccessiblePropertyIds';

interface ForecastItem {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  label: string;
  source: 'booking' | 'recurring' | 'planned';
  status: 'confirmed' | 'expected' | 'pending';
  propertyTitle?: string;
}

interface MonthForecast {
  month: string;
  monthKey: string;
  income: number;
  expenses: number;
  net: number;
  items: ForecastItem[];
}

export function CashFlowForecast({ propertyId }: { propertyId?: string }) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Fetch upcoming bookings as projected income
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['forecast-bookings', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date();
      const threeMonthsLater = addMonths(now, 3);

      let propIds: string[] = [];
      if (propertyId) {
        propIds = [propertyId];
      } else {
        const result = await getAccessiblePropertyIds({ userId: user.id, activeCompanyId });
        propIds = result.allIds;
      }
      if (!propIds.length) return [];

      const { data, error } = await supabase
        .from('property_bookings')
        .select('id, check_in, check_out, total_amount, currency, status, property:properties(title_en, title_ru)')
        .in('property_id', propIds)
        .in('status', ['confirmed', 'active', 'pending'])
        .gte('check_in', now.toISOString().split('T')[0])
        .lte('check_in', threeMonthsLater.toISOString().split('T')[0])
        .order('check_in');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch recurring expenses
  const { data: recurringExpenses, isLoading: recurringLoading } = useQuery({
    queryKey: ['forecast-recurring', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      let propIds: string[] = [];
      if (propertyId) {
        propIds = [propertyId];
      } else {
        const result = await getAccessiblePropertyIds({ userId: user.id, activeCompanyId });
        propIds = result.allIds;
      }
      if (!propIds.length) return [];

      const { data, error } = await supabase
        .from('property_financials')
        .select('*, property:properties(title_en, title_ru)')
        .in('property_id', propIds)
        .eq('recurring', true)
        .not('recurring_interval', 'is', null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch planned (pending) transactions
  const { data: plannedTx, isLoading: plannedLoading } = useQuery({
    queryKey: ['forecast-planned', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date();
      const threeMonthsLater = addMonths(now, 3);

      let propIds: string[] = [];
      if (propertyId) {
        propIds = [propertyId];
      } else {
        const result = await getAccessiblePropertyIds({ userId: user.id, activeCompanyId });
        propIds = result.allIds;
      }
      if (!propIds.length) return [];

      const { data, error } = await supabase
        .from('property_financials')
        .select('*, property:properties(title_en, title_ru)')
        .in('property_id', propIds)
        .eq('status', 'pending')
        .gte('due_date', now.toISOString().split('T')[0])
        .lte('due_date', threeMonthsLater.toISOString().split('T')[0])
        .order('due_date');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const isLoading = bookingsLoading || recurringLoading || plannedLoading;

  // Build 3-month forecast
  const forecast = useMemo((): MonthForecast[] => {
    const now = new Date();
    const months: MonthForecast[] = [];

    for (let i = 0; i < 3; i++) {
      const monthDate = addMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const items: ForecastItem[] = [];

      // 1. Bookings → income
      (bookings || []).forEach(b => {
        const checkIn = parseISO(b.check_in);
        if (checkIn >= mStart && checkIn <= mEnd) {
          const prop = b.property as any;
          items.push({
            date: b.check_in,
            type: 'income',
            amount: Number(b.total_amount) || 0,
            label: isRu ? 'Поступление аренды' : 'Rental income',
            source: 'booking',
            status: b.status === 'confirmed' || b.status === 'active' ? 'confirmed' : 'expected',
            propertyTitle: isRu && prop?.title_ru ? prop.title_ru : prop?.title,
          });
        }
      });

      // 2. Recurring expenses → project into this month
      (recurringExpenses || []).forEach(tx => {
        const interval = tx.recurring_interval;
        const lastDate = parseISO(tx.transaction_date);
        const prop = tx.property as any;
        const lastMonth = lastDate.getMonth();

        // Calculate how many times this recurring expense appears in this month
        let occurrences = 0;
        if (interval === 'monthly') {
          occurrences = 1;
        } else if (interval === 'weekly') {
          // ~4 occurrences per month
          occurrences = 4;
        } else if (interval === 'quarterly') {
          // Include if this month aligns with the quarterly cycle
          const monthDiff = (monthDate.getFullYear() - lastDate.getFullYear()) * 12 + (monthDate.getMonth() - lastMonth);
          if (monthDiff >= 0 && monthDiff % 3 === 0) occurrences = 1;
        } else if (interval === 'annual') {
          // Include only if the month matches the original transaction month
          if (monthDate.getMonth() === lastMonth) occurrences = 1;
        }

        if (occurrences > 0) {
          const catLabel = tx.category ? tx.category.replace(/_/g, ' ') : '';
          items.push({
            date: format(mStart, 'yyyy-MM-dd'),
            type: tx.transaction_type === 'income' ? 'income' : 'expense',
            amount: (Number(tx.amount) || 0) * occurrences,
            label: (isRu ? tx.description_ru : tx.description) || catLabel || (isRu ? 'Повторяющийся расход' : 'Recurring expense'),
            source: 'recurring',
            status: 'expected',
            propertyTitle: isRu && prop?.title_ru ? prop.title_ru : prop?.title,
          });
        }
      });

      // 3. Planned pending transactions
      (plannedTx || []).forEach(tx => {
        const dueDate = tx.due_date ? parseISO(tx.due_date) : null;
        if (dueDate && dueDate >= mStart && dueDate <= mEnd) {
          const prop = tx.property as any;
          items.push({
            date: tx.due_date!,
            type: tx.transaction_type === 'income' ? 'income' : 'expense',
            amount: Number(tx.amount) || 0,
            label: (isRu ? tx.description_ru : tx.description) || (isRu ? 'Запланировано' : 'Planned'),
            source: 'planned',
            status: 'pending',
            propertyTitle: isRu && prop?.title_ru ? prop.title_ru : prop?.title,
          });
        }
      });

      const income = items.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
      const expenses = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);

      months.push({
        month: format(monthDate, 'LLLL', { locale: isRu ? ruLocale : undefined }),
        monthKey: format(monthDate, 'yyyy-MM'),
        income,
        expenses,
        net: income - expenses,
        items: items.sort((a, b) => a.date.localeCompare(b.date)),
      });
    }

    return months;
  }, [bookings, recurringExpenses, plannedTx, isRu]);

  const chartData = forecast.map(m => ({
    month: m.month,
    [isRu ? 'Доходы' : 'Income']: m.income,
    [isRu ? 'Расходы' : 'Expenses']: m.expenses,
    net: m.net,
  }));

  const totalNet = forecast.reduce((s, m) => s + m.net, 0);
  const totalIncome = forecast.reduce((s, m) => s + m.income, 0);

  const statusIcon = (status: ForecastItem['status']) => {
    if (status === 'confirmed') return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    if (status === 'pending') return <Clock className="h-3.5 w-3.5 text-warning" />;
    return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const sourceLabel = (source: ForecastItem['source']) => {
    if (source === 'booking') return isRu ? 'Бронирование' : 'Booking';
    if (source === 'recurring') return isRu ? 'Повтор' : 'Recurring';
    return isRu ? 'План' : 'Planned';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const hasData = forecast.some(m => m.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{isRu ? 'Ожид. доходы' : 'Exp. income'}</p>
            <p className="text-base font-bold text-success">
              ฿{(totalIncome / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground">{isRu ? '3 месяца' : '3 months'}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{isRu ? 'Ожид. расходы' : 'Exp. expenses'}</p>
            <p className="text-base font-bold text-destructive">
              ฿{(forecast.reduce((s, m) => s + m.expenses, 0) / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground">{isRu ? '3 месяца' : '3 months'}</p>
          </CardContent>
        </Card>
        <Card className={totalNet >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{isRu ? 'Чистый прогноз' : 'Net forecast'}</p>
            <p className={`text-base font-bold ${totalNet >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalNet >= 0 ? '+' : ''}฿{(totalNet / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground">{isRu ? '3 месяца' : '3 months'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      {hasData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              {isRu ? 'Прогноз на 3 месяца' : '3-Month Cash Flow Forecast'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="fIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `฿${v.toLocaleString()}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey={isRu ? 'Доходы' : 'Income'}
                    stroke="#22c55e"
                    fill="url(#fIncome)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey={isRu ? 'Расходы' : 'Expenses'}
                    stroke="#ef4444"
                    fill="url(#fExpense)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month-by-month breakdown */}
      {forecast.map((month) => (
        <Card key={month.monthKey}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm capitalize">{month.month}</CardTitle>
              <div className="flex gap-2 text-xs">
                <span className="text-success">+฿{(month.income / 1000).toFixed(1)}k</span>
                <span className="text-destructive">-฿{(month.expenses / 1000).toFixed(1)}k</span>
                <span className={`font-semibold ${month.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                  = {month.net >= 0 ? '+' : ''}฿{(month.net / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </CardHeader>
          {month.items.length > 0 ? (
            <CardContent className="pt-0 space-y-2">
              {month.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    item.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {item.type === 'income'
                      ? <TrendingUp className="h-3.5 w-3.5 text-success" />
                      : <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {statusIcon(item.status)}
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(item.date), 'd MMM', { locale: isRu ? ruLocale : undefined })}
                      </span>
                      {item.propertyTitle && (
                        <span className="text-[10px] text-muted-foreground truncate">· {item.propertyTitle}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${
                      item.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {sourceLabel(item.source)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          ) : (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground text-center py-3">
                {isRu ? 'Нет запланированных операций' : 'No planned operations'}
              </p>
            </CardContent>
          )}
        </Card>
      ))}

      {!hasData && (
        <Card>
          <CardContent className="py-10 text-center">
            <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">{isRu ? 'Нет данных для прогноза' : 'No forecast data yet'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRu
                ? 'Прогноз формируется из подтверждённых бронирований, повторяющихся операций и запланированных платежей'
                : 'Forecast is built from confirmed bookings, recurring transactions and planned payments'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
