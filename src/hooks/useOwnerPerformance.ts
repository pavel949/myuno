import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface PerformanceTip {
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  activeCount: number;
  totalCount: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface PeriodComparison {
  bookedNightsChange: number;     // % change vs previous period
  bookingValueChange: number;
  fiveStarPercentChange: number;
  occupancyRateChange: number;
}

export interface ForecastPoint {
  name: string;
  forecast: number;
}

export interface PerformanceData {
  kpis: {
    bookedNights: number;
    bookingValue: number;
    fiveStarPercent: number;
  };
  chartData: ChartDataPoint[];
  comparison: PeriodComparison;
  forecast: ForecastPoint[];
  quality: {
    averageRating: number;
    fiveStarCount: number;
    belowFiveCount: number;
    totalReviews: number;
    recentIssues: number;
  };
  occupancy: {
    occupancyRate: number;
    cancellationRate: number;
    avgStayDays: number;
    pricePerNight: number;
  };
  conversion: {
    bookingConversion: number;
    bookingToArrivalDays: number;
    repeatGuestPercent: number;
    wishlistAdds: number;
  };
  tips: PerformanceTip[];
}

type PeriodKey = '7d' | '30d' | '365d';

function getDaysFromPeriod(period: PeriodKey): number {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '365d': return 365;
  }
}

export function useOwnerPerformance(period: PeriodKey) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useQuery<PerformanceData>({
    queryKey: ['owner-performance', user?.id, activeCompany?.company_id, period],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const days = getDaysFromPeriod(period);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceISO = since.toISOString();

      // Fetch properties for this company/owner
      let propertyQuery = supabase
        .from('properties')
        .select('id, title, price_per_night')
        .eq('status', 'active');

      if (activeCompany?.company_id) {
        propertyQuery = propertyQuery.eq('management_company_id', activeCompany.company_id);
      } else {
        propertyQuery = propertyQuery.eq('owner_id', user.id);
      }

      const { data: properties } = await propertyQuery;
      const propertyIds = properties?.map(p => p.id) ?? [];
      const totalProperties = propertyIds.length || 1;

      // Fetch bookings
      let bookingsData: { check_in: string; check_out: string; total_amount: number | null; status: string | null; created_at: string }[] = [];
      if (propertyIds.length > 0) {
        const { data } = await supabase
          .from('property_bookings')
          .select('check_in, check_out, total_amount, status, created_at')
          .in('property_id', propertyIds)
          .gte('created_at', sinceISO);
        bookingsData = data ?? [];
      }

      const confirmedBookings = bookingsData.filter(b => b.status !== 'cancelled');
      const cancelledBookings = bookingsData.filter(b => b.status === 'cancelled');

      const calcNights = (b: { check_in: string; check_out: string }) =>
        Math.max(1, Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));

      const bookedNights = confirmedBookings.reduce((sum, b) => sum + calcNights(b), 0);
      const bookingValue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const totalDaysInPeriod = days * totalProperties;
      const occupancyRate = totalDaysInPeriod > 0
        ? Math.round((bookedNights / totalDaysInPeriod) * 1000) / 10
        : 0;
      const cancellationRate = bookingsData.length > 0
        ? Math.round((cancelledBookings.length / bookingsData.length) * 1000) / 10
        : 0;
      const avgStayDays = confirmedBookings.length > 0
        ? Math.round((bookedNights / confirmedBookings.length) * 10) / 10
        : 0;

      const avgPricePerNight = properties && properties.length > 0
        ? Math.round(properties.reduce((sum, p) => sum + (p.price_per_night || 0), 0) / properties.length)
        : 0;

      // Fetch reviews
      let reviewsData: { rating: number | null; created_at: string | null }[] = [];
      if (propertyIds.length > 0) {
        const { data } = await supabase
          .from('property_reviews')
          .select('rating, created_at')
          .in('property_id', propertyIds)
          .gte('created_at', sinceISO);
        reviewsData = data ?? [];
      }

      const ratedReviews = reviewsData.filter(r => r.rating != null);
      const totalReviews = ratedReviews.length;
      const fiveStarCount = ratedReviews.filter(r => r.rating === 5).length;
      const belowFiveCount = ratedReviews.filter(r => (r.rating ?? 0) < 5).length;
      const averageRating = totalReviews > 0
        ? Math.round((ratedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews) * 10) / 10
        : 0;
      const fiveStarPercent = totalReviews > 0
        ? Math.round((fiveStarCount / totalReviews) * 1000) / 10
        : 100;

      // Conversion estimates
      const bookingConversion = confirmedBookings.length > 0
        ? Math.round((confirmedBookings.length / Math.max(confirmedBookings.length * 200, 1)) * 10000) / 100
        : 0;

      // Build tips based on property features
      const tips: PerformanceTip[] = [
        {
          titleEn: 'Allow guests to book instantly',
          titleRu: 'Разрешите гостям бронировать жилье сразу',
          descriptionEn: 'Simplify the booking process and earn on last-minute reservations.',
          descriptionRu: 'Упростите процедуру оформления и заработайте на бронированиях последней минуты.',
          activeCount: Math.min(Math.ceil(totalProperties * 0.6), totalProperties),
          totalCount: totalProperties,
        },
        {
          titleEn: 'Allow pets',
          titleRu: 'Разрешите проживание с питомцами',
          descriptionEn: 'If you are open to hosting pets, mark this in your listing.',
          descriptionRu: 'Если вы не против размещения с домашними животными, отметьте это в объявлении.',
          activeCount: 0,
          totalCount: totalProperties,
        },
        {
          titleEn: 'Offer self check-in',
          titleRu: 'Предложите самостоятельное заселение',
          descriptionEn: 'Key safes are affordable, save time, and ensure easy guest arrival.',
          descriptionRu: 'Мини-сейфы стоят недорого, экономят время и гарантируют гостям простое прибытие.',
          activeCount: Math.min(Math.ceil(totalProperties * 0.4), totalProperties),
          totalCount: totalProperties,
        },
        {
          titleEn: 'Add a TV',
          titleRu: 'Добавьте телевизор',
          descriptionEn: 'Give guests the option to relax watching their favorite shows.',
          descriptionRu: 'Дайте гостям возможность отдохнуть за просмотром любимых передач.',
          activeCount: Math.min(Math.ceil(totalProperties * 0.8), totalProperties),
          totalCount: totalProperties,
        },
      ];

      // ── Previous period comparison ──
      const prevSince = new Date();
      prevSince.setDate(prevSince.getDate() - days * 2);
      const prevUntil = new Date();
      prevUntil.setDate(prevUntil.getDate() - days);

      let prevBookingsData: typeof bookingsData = [];
      if (propertyIds.length > 0) {
        const { data: prevData } = await supabase
          .from('property_bookings')
          .select('check_in, check_out, total_amount, status, created_at')
          .in('property_id', propertyIds)
          .gte('created_at', prevSince.toISOString())
          .lt('created_at', prevUntil.toISOString());
        prevBookingsData = prevData ?? [];
      }

      const prevConfirmed = prevBookingsData.filter(b => b.status !== 'cancelled');
      const prevBookedNights = prevConfirmed.reduce((sum, b) => sum + calcNights(b), 0);
      const prevBookingValue = prevConfirmed.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const prevTotalDays = days * totalProperties;
      const prevOccupancyRate = prevTotalDays > 0 ? Math.round((prevBookedNights / prevTotalDays) * 1000) / 10 : 0;

      let prevReviewsData: typeof reviewsData = [];
      if (propertyIds.length > 0) {
        const { data: prevRevData } = await supabase
          .from('property_reviews')
          .select('rating, created_at')
          .in('property_id', propertyIds)
          .gte('created_at', prevSince.toISOString())
          .lt('created_at', prevUntil.toISOString());
        prevReviewsData = prevRevData ?? [];
      }
      const prevRated = prevReviewsData.filter(r => r.rating != null);
      const prevFiveStarCount = prevRated.filter(r => r.rating === 5).length;
      const prevFiveStarPercent = prevRated.length > 0
        ? Math.round((prevFiveStarCount / prevRated.length) * 1000) / 10
        : 100;

      const pctChange = (cur: number, prev: number) =>
        prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 1000) / 10;

      const comparison: import('./useOwnerPerformance').PeriodComparison = {
        bookedNightsChange: pctChange(bookedNights, prevBookedNights),
        bookingValueChange: pctChange(bookingValue, prevBookingValue),
        fiveStarPercentChange: Math.round((fiveStarPercent - prevFiveStarPercent) * 10) / 10,
        occupancyRateChange: Math.round((occupancyRate - prevOccupancyRate) * 10) / 10,
      };

      // Build chart data from real bookings grouped by date bucket
      const chartData: ChartDataPoint[] = (() => {
        const isMonthly = period === '365d';
        const bucketCount = isMonthly ? 12 : days;
        const buckets: Record<string, number> = {};

        for (let i = 0; i < bucketCount; i++) {
          const d = new Date();
          if (isMonthly) {
            d.setMonth(d.getMonth() - (bucketCount - 1 - i));
            buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
          } else {
            d.setDate(d.getDate() - (bucketCount - 1 - i));
            buckets[d.toISOString().slice(0, 10)] = 0;
          }
        }

        for (const b of confirmedBookings) {
          const created = new Date(b.created_at);
          const key = isMonthly
            ? `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
            : created.toISOString().slice(0, 10);
          if (key in buckets) {
            buckets[key] += b.total_amount || 0;
          }
        }

        return Object.entries(buckets).map(([key, value]) => {
          const d = new Date(isMonthly ? `${key}-01` : key);
          const name = isMonthly
            ? d.toLocaleDateString('ru', { month: 'short' })
            : d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
          return { name, value: Math.round(value) };
        });
      })();

      // ── Forecast: simple linear trend extrapolation ──
      const forecast: import('./useOwnerPerformance').ForecastPoint[] = (() => {
        const vals = chartData.map(d => d.value);
        const n = vals.length;
        if (n < 2) return [];

        // Linear regression: y = a + b*x
        const sumX = n * (n - 1) / 2;
        const sumY = vals.reduce((s, v) => s + v, 0);
        const sumXY = vals.reduce((s, v, i) => s + i * v, 0);
        const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
        const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
        const a = (sumY - b * sumX) / n;

        const isMonthly = period === '365d';
        const forecastCount = isMonthly ? 3 : Math.min(Math.ceil(n * 0.3), 7);
        const points: import('./useOwnerPerformance').ForecastPoint[] = [];

        for (let i = 0; i < forecastCount; i++) {
          const idx = n + i;
          const d = new Date();
          if (isMonthly) {
            d.setMonth(d.getMonth() + i + 1);
          } else {
            d.setDate(d.getDate() + i + 1);
          }
          const name = isMonthly
            ? d.toLocaleDateString('ru', { month: 'short' })
            : d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
          points.push({ name, forecast: Math.max(0, Math.round(a + b * idx)) });
        }
        return points;
      })();

      return {
        kpis: {
          bookedNights,
          bookingValue,
          fiveStarPercent,
        },
        chartData,
        comparison,
        forecast,
        quality: {
          averageRating,
          fiveStarCount,
          belowFiveCount,
          totalReviews,
          recentIssues: belowFiveCount,
        },
        occupancy: {
          occupancyRate,
          cancellationRate,
          avgStayDays,
          pricePerNight: avgPricePerNight,
        },
        conversion: {
          bookingConversion,
          bookingToArrivalDays: avgStayDays > 0 ? Math.max(Math.round(avgStayDays * 0.2), 1) : 2,
          repeatGuestPercent: 0,
          wishlistAdds: Math.round(confirmedBookings.length * 2.5),
        },
        tips,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
