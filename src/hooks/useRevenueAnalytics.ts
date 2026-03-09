import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { usePropertyFinancialsFull } from '@/hooks/usePropertyFinancials';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import {
  subDays, subMonths, differenceInDays, isWithinInterval,
  startOfMonth, endOfMonth, format, addMonths,
} from 'date-fns';

export interface MonthlyMetric {
  month: string;       // "2026-01"
  label: string;       // "Jan"
  income: number;
  expenses: number;
  netProfit: number;
  bookedNights: number;
  totalNights: number;
  occupancy: number;   // 0-100
  adr: number;         // Average Daily Rate
  revpar: number;      // Revenue Per Available Room-night
  bookingCount: number;
}

export interface PropertyRevenue {
  id: string;
  title: string;
  coverImage?: string | null;
  income: number;
  expenses: number;
  occupancy: number;
  adr: number;
  revpar: number;
  bookingCount: number;
}

export interface ForecastPoint {
  month: string;
  label: string;
  projected: number;
  lower: number;
  upper: number;
}

export function useRevenueAnalytics(monthsBack = 6) {
  const { user } = useAuth();
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  const { data: financials, isLoading: finLoading } = usePropertyFinancialsFull();
  const { bookings, isLoading: bookLoading } = useAllPropertyBookings();

  const isLoading = propsLoading || finLoading || bookLoading;

  /** Monthly breakdown for the last N months */
  const monthlyMetrics = useMemo<MonthlyMetric[]>(() => {
    if (!allProperties?.length || !financials || !bookings) return [];
    const propCount = allProperties.length;
    const months: MonthlyMetric[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const daysInMonth = differenceInDays(mEnd, mStart) + 1;
      const totalNights = daysInMonth * propCount;
      const monthStr = format(d, 'yyyy-MM');
      const label = format(d, 'MMM');

      // Financials
      const mFin = financials.filter(f => {
        const td = new Date(f.transaction_date);
        return td >= mStart && td <= mEnd;
      });
      const income = mFin
        .filter(f => f.transaction_type === 'income')
        .reduce((s, f) => s + Number(f.amount), 0);
      const expenses = mFin
        .filter(f => f.transaction_type === 'expense')
        .reduce((s, f) => s + Number(f.amount), 0);

      // Booked nights
      let bookedNights = 0;
      let bookingCount = 0;
      bookings.forEach(b => {
        if (b.status === 'cancelled') return;
        const ci = new Date(b.check_in);
        const co = new Date(b.check_out);
        if (co < mStart || ci > mEnd) return;
        bookingCount++;
        for (let day = new Date(Math.max(ci.getTime(), mStart.getTime()));
          day < new Date(Math.min(co.getTime(), mEnd.getTime() + 86400000));
          day.setDate(day.getDate() + 1)) {
          bookedNights++;
        }
      });

      const occupancy = totalNights > 0 ? (bookedNights / totalNights) * 100 : 0;
      const adr = bookedNights > 0 ? income / bookedNights : 0;
      const revpar = totalNights > 0 ? income / totalNights : 0;

      months.push({
        month: monthStr, label,
        income, expenses, netProfit: income - expenses,
        bookedNights, totalNights, occupancy, adr, revpar, bookingCount,
      });
    }
    return months;
  }, [allProperties, financials, bookings, monthsBack]);

  /** Per-property breakdown (last 30d) */
  const propertyRevenue = useMemo<PropertyRevenue[]>(() => {
    if (!allProperties?.length || !financials || !bookings) return [];
    const range = { start: subDays(new Date(), 30), end: new Date() };

    return allProperties.map(p => {
      const pId = p.property_id;
      const pFin = financials.filter(f => {
        if (f.property_id !== pId) return false;
        const td = new Date(f.transaction_date);
        return td >= range.start && td <= range.end;
      });
      const income = pFin.filter(f => f.transaction_type === 'income').reduce((s, f) => s + Number(f.amount), 0);
      const expenses = pFin.filter(f => f.transaction_type === 'expense').reduce((s, f) => s + Number(f.amount), 0);

      let bookedDays = 0;
      let count = 0;
      bookings.forEach(b => {
        if (b.property_id !== pId || b.status === 'cancelled') return;
        const ci = new Date(b.check_in);
        const co = new Date(b.check_out);
        if (co < range.start || ci > range.end) return;
        count++;
        for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
          if (isWithinInterval(d, range)) bookedDays++;
        }
      });

      const occupancy = Math.min((bookedDays / 30) * 100, 100);
      const adr = bookedDays > 0 ? income / bookedDays : 0;
      const revpar = income / 30;

      return {
        id: pId,
        title: p.title,
        coverImage: p.cover_image,
        income, expenses, occupancy, adr, revpar, bookingCount: count,
      };
    }).sort((a, b) => b.income - a.income);
  }, [allProperties, financials, bookings]);

  /** Simple 3-month forecast based on moving average */
  const forecast = useMemo<ForecastPoint[]>(() => {
    if (monthlyMetrics.length < 3) return [];
    const last3 = monthlyMetrics.slice(-3);
    const avgIncome = last3.reduce((s, m) => s + m.income, 0) / 3;
    const variance = Math.sqrt(
      last3.reduce((s, m) => s + Math.pow(m.income - avgIncome, 2), 0) / 3,
    );

    return [1, 2, 3].map(i => {
      const d = addMonths(new Date(), i);
      return {
        month: format(d, 'yyyy-MM'),
        label: format(d, 'MMM'),
        projected: Math.round(avgIncome),
        lower: Math.round(Math.max(0, avgIncome - variance * 1.2)),
        upper: Math.round(avgIncome + variance * 1.2),
      };
    });
  }, [monthlyMetrics]);

  /** Aggregate KPIs for current period */
  const kpi = useMemo(() => {
    const current = monthlyMetrics[monthlyMetrics.length - 1];
    const prev = monthlyMetrics[monthlyMetrics.length - 2];
    if (!current) return null;

    const revenueChange = prev && prev.income > 0
      ? ((current.income - prev.income) / prev.income) * 100
      : 0;
    const occupancyChange = prev ? current.occupancy - prev.occupancy : 0;

    return {
      income: current.income,
      expenses: current.expenses,
      netProfit: current.netProfit,
      occupancy: current.occupancy,
      adr: current.adr,
      revpar: current.revpar,
      bookedNights: current.bookedNights,
      totalNights: current.totalNights,
      revenueChange,
      occupancyChange,
    };
  }, [monthlyMetrics]);

  return { monthlyMetrics, propertyRevenue, forecast, kpi, isLoading };
}
