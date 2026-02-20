import { useEffect, useState } from 'react';
import { DollarSign, TrendingDown, Percent, CalendarCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { OwnerKPICard } from '@/components/owner/OwnerKPICard';

interface KPIData {
  revenue: number;
  expenses: number;
  margin: number;
  occupancyRate: number;
  revenuePrev: number;
  expensesPrev: number;
}

export function BusinessKPIWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchKPI() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

      const [incomeRes, expenseRes, incomePrevRes, expensePrevRes, bookingsRes] = await Promise.all([
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'income')
          .gte('transaction_date', startOfMonth)
          .lte('transaction_date', endOfMonth),
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startOfMonth)
          .lte('transaction_date', endOfMonth),
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'income')
          .gte('transaction_date', startOfPrevMonth)
          .lte('transaction_date', endOfPrevMonth),
        supabase
          .from('property_financials')
          .select('amount')
          .eq('owner_id', user!.id)
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startOfPrevMonth)
          .lte('transaction_date', endOfPrevMonth),
        supabase
          .from('property_bookings')
          .select('check_in, check_out')
          .eq('owner_id', user!.id)
          .in('status', ['confirmed', 'checked_in', 'completed'])
          .lte('check_in', endOfMonth)
          .gte('check_out', startOfMonth),
      ]);

      const sum = (rows: { amount: number }[] | null) =>
        (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0);

      const revenue = sum(incomeRes.data as any);
      const expenses = sum(expenseRes.data as any);
      const revenuePrev = sum(incomePrevRes.data as any);
      const expensesPrev = sum(expensePrevRes.data as any);
      const margin = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;

      // Calculate occupancy: booked nights / total possible nights this month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      let bookedNights = 0;
      for (const b of (bookingsRes.data || [])) {
        const ci = new Date(Math.max(new Date(b.check_in).getTime(), new Date(startOfMonth).getTime()));
        const co = new Date(Math.min(new Date(b.check_out).getTime(), new Date(endOfMonth).getTime()));
        const nights = Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
        bookedNights += nights;
      }

      // Get property count for occupancy denominator
      const { count: propCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user!.id);

      const totalNights = (propCount || 1) * daysInMonth;
      const occupancyRate = Math.min(100, Math.round((bookedNights / totalNights) * 100));

      setData({ revenue, expenses, margin, occupancyRate, revenuePrev, expensesPrev });
      setLoading(false);
    }

    fetchKPI();
  }, [user]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const revChange = data ? pctChange(data.revenue, data.revenuePrev) : 0;
  const expChange = data ? pctChange(data.expenses, data.expensesPrev) : 0;

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <OwnerKPICard
        title={isRu ? 'Доход' : 'Revenue'}
        value={`฿${fmt(data?.revenue ?? 0)}`}
        icon={DollarSign}
        iconColor="text-success"
        change={revChange}
        trend={revChange >= 0 ? 'up' : 'down'}
        changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
        href="/owner/financials"
        loading={loading}
      />
      <OwnerKPICard
        title={isRu ? 'Расходы' : 'Expenses'}
        value={`฿${fmt(data?.expenses ?? 0)}`}
        icon={TrendingDown}
        iconColor="text-destructive"
        change={expChange}
        trend={expChange <= 0 ? 'up' : 'down'}
        changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
        href="/owner/financials"
        loading={loading}
      />
      <OwnerKPICard
        title={isRu ? 'Маржа' : 'Margin'}
        value={`${data?.margin ?? 0}%`}
        icon={Percent}
        iconColor="text-primary"
        trend={data && data.margin >= 30 ? 'up' : data && data.margin >= 0 ? 'neutral' : 'down'}
        href="/owner/financials"
        loading={loading}
      />
      <OwnerKPICard
        title={isRu ? 'Загрузка' : 'Occupancy'}
        value={`${data?.occupancyRate ?? 0}%`}
        icon={CalendarCheck}
        iconColor="text-accent-foreground"
        trend={data && data.occupancyRate >= 70 ? 'up' : data && data.occupancyRate >= 40 ? 'neutral' : 'down'}
        href="/owner/calendar"
        loading={loading}
      />
    </div>
  );
}
