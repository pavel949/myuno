import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Star, TrendingUp, TrendingDown, Calendar, ChevronRight, AlertCircle,
  BarChart3, Users, Clock, Heart, Percent, BedDouble,
  DollarSign, XCircle, Repeat, Eye, Lightbulb,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useOwnerPerformance } from '@/hooks/useOwnerPerformance';

type PeriodKey = '7d' | '30d' | '365d';

export default function OwnerPerformance() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const { data, isLoading } = useOwnerPerformance(period);

  const periodLabels: Record<PeriodKey, { en: string; ru: string }> = {
    '7d': { en: 'Last 7 days', ru: 'Последние 7 дней' },
    '30d': { en: 'Last 30 days', ru: 'Последние 30 дней' },
    '365d': { en: 'Last 365 days', ru: 'Последние 365 дней' },
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Показатели' : 'Performance'} showBack fallbackPath="/mc" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-none" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-none" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-none" />
          <Skeleton className="h-48 w-full rounded-none" />
        </div>
      </PageContainer>
    );
  }

  const kpis = data?.kpis ?? { bookedNights: 0, bookingValue: 0, fiveStarPercent: 100 };
  const chartData = data?.chartData ?? [];
  const cmp = data?.comparison ?? { bookedNightsChange: 0, bookingValueChange: 0, fiveStarPercentChange: 0, occupancyRateChange: 0 };
  const forecast = data?.forecast ?? [];
  const quality = data?.quality ?? { averageRating: 0, fiveStarCount: 0, belowFiveCount: 0, totalReviews: 0, recentIssues: 0 };
  const occupancy = data?.occupancy ?? { occupancyRate: 0, cancellationRate: 0, avgStayDays: 0, pricePerNight: 0 };
  const conversion = data?.conversion ?? { bookingConversion: 0, bookingToArrivalDays: 0, repeatGuestPercent: 0, wishlistAdds: 0 };
  const tips = data?.tips ?? [];

  // Chart data with forecast appended (null value for main, null forecast for existing)
  const combinedChartData = [
    ...chartData.map(d => ({ ...d, forecast: null as number | null })),
    // bridge: last real point repeated as first forecast point
    ...(forecast.length > 0 && chartData.length > 0
      ? [{ name: chartData[chartData.length - 1].name, value: null as number | null, forecast: chartData[chartData.length - 1].value }]
      : []),
    ...forecast.map(d => ({ name: d.name, value: null as number | null, forecast: d.forecast })),
  ];

  const ChangeBadge = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    if (value === 0) return null;
    const positive = value > 0;
    const Icon = positive ? TrendingUp : TrendingDown;
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', positive ? 'text-success' : 'text-red-500')}>
        <Icon className="w-3 h-3" />
        {positive ? '+' : ''}{value}{suffix}
      </span>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Показатели' : 'Performance'}
        showBack
        fallbackPath="/mc"
      />

      {/* Trends & Tips Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {isRu ? 'Тренды и советы' : 'Trends & Tips'}
          </h2>
          <Button
            variant="link"
            className="text-sm p-0 h-auto font-medium"
            onClick={() => navigate('/mc/trends')}
          >
            {isRu ? 'Показать всё' : 'Show all'}
          </Button>
        </div>

        {/* Horizontal scrollable tip cards — full text on hover (title); see all on /mc/trends */}
        {tips.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {tips.slice(0, 3).map((tip, index) => (
              <Card
                key={index}
                className="min-w-[280px] max-w-[320px] snap-start cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
                onClick={() => navigate('/mc/trends')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="font-semibold text-sm leading-tight min-w-0 flex-1 line-clamp-3"
                      title={isRu ? tip.titleRu : tip.titleEn}
                    >
                      {isRu ? tip.titleRu : tip.titleEn}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                  <p
                    className="text-xs text-muted-foreground mb-3 line-clamp-4"
                    title={isRu ? tip.descriptionRu : tip.descriptionEn}
                  >
                    {isRu ? tip.descriptionRu : tip.descriptionEn}
                  </p>
                  <div className="space-y-1.5">
                    <Progress
                      value={(tip.activeCount / tip.totalCount) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{isRu ? 'Число активных объявлений' : 'Active listings'}</span>
                      <span>{tip.activeCount}/{tip.totalCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground rounded-none border border-dashed px-4 py-6 text-center">
            {isRu
              ? 'Персональные советы появятся, когда накопится достаточно данных. Откройте раздел целиком — там может быть больше материалов.'
              : 'Personal tips will appear as we have more data. Open the full section for more.'}
          </p>
        )}
      </section>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="7d" className="flex-1 text-xs">
            {isRu ? 'Последние 7 дней' : 'Last 7 days'}
          </TabsTrigger>
          <TabsTrigger value="30d" className="flex-1 text-xs">
            {isRu ? 'Последние 30 дней' : 'Last 30 days'}
          </TabsTrigger>
          <TabsTrigger value="365d" className="flex-1 text-xs">
            {isRu ? 'Последние 365 дн.' : 'Last 365 days'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold">{kpis.bookedNights}</div>
          <ChangeBadge value={cmp.bookedNightsChange} />
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Забронированные ночи' : 'Booked nights'}
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{formatPrice(kpis.bookingValue)}</div>
          <ChangeBadge value={cmp.bookingValueChange} />
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Стоимость бронирования' : 'Booking value'}
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{kpis.fiveStarPercent}%</div>
          <ChangeBadge value={cmp.fiveStarPercentChange} suffix="pp" />
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? '5-звездочный рейтинг' : '5-star rating'}
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{isRu ? 'Динамика выручки' : 'Revenue Trend'}</h2>
            {forecast.length > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <TrendingUp className="w-3 h-3" />
                {isRu ? 'Прогноз' : 'Forecast'}
              </Badge>
            )}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatPrice(value),
                    name === 'forecast' ? (isRu ? 'Прогноз' : 'Forecast') : (isRu ? 'Выручка' : 'Revenue'),
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill="url(#colorForecast)"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quality Section */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="text-xl font-bold mb-4">{isRu ? 'Качество' : 'Quality'}</h2>

          {/* Overview */}
          <div className="border-t pt-4 mb-4">
            <h3 className="font-semibold mb-3">{isRu ? 'Обзор' : 'Overview'}</h3>
            <button
              className="flex items-center w-full gap-4 group"
              onClick={() => navigate('/mc/reviews-management')}
            >
              <div className="relative w-14 h-14 flex-shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary"
                  style={{
                    clipPath: quality.totalReviews > 0
                      ? `polygon(0 0, 100% 0, 100% 100%, 0 100%)`
                      : 'polygon(50% 50%, 50% 0, 50% 0)',
                  }}
                />
                <div className="absolute inset-2 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={cn(
                          'h-2 w-2',
                          s <= Math.round(quality.averageRating)
                            ? 'fill-primary text-primary'
                            : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">
                  {isRu ? '5-звездочные рейтинги' : '5-star ratings'}
                </p>
                <p className="text-xs text-muted-foreground uppercase">
                  {isRu ? 'ОБЩАЯ ОЦЕНКА' : 'OVERALL RATING'}{' '}
                  {quality.averageRating > 0 ? quality.averageRating.toFixed(1) : '-'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>

          {/* Ratings Breakdown */}
          <div className="border-t pt-4 mb-4">
            <h3 className="font-semibold mb-3">{isRu ? 'Оценки' : 'Ratings'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{quality.fiveStarCount}</div>
                <div>
                  <p className="text-sm">{isRu ? '5 звезд' : '5 stars'}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{quality.belowFiveCount}</div>
                <div>
                  <p className="text-sm">{isRu ? 'Меньше 5 звезд' : 'Below 5 stars'}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map(s => (
                      <Star key={s} className="h-3 w-3 fill-warning text-warning" />
                    ))}
                    <Star className="h-3 w-3 text-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Issues */}
          {quality.recentIssues > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">
                {isRu ? 'Проблемы с недавними поездками' : 'Recent trip issues'}
              </h3>
              <Button
                variant="link"
                className="text-sm p-0 h-auto text-primary"
                onClick={() => navigate('/mc/reviews-management')}
              >
                {isRu ? 'Посмотреть недавние проблемы' : 'View recent issues'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupancy & Rates */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{isRu ? 'Занятость и расценки' : 'Occupancy & Rates'}</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <div className="text-2xl font-bold">{occupancy.occupancyRate}%</div>
              <ChangeBadge value={cmp.occupancyRateChange} suffix="pp" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Показатель занятости' : 'Occupancy rate'}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">{occupancy.cancellationRate}%</div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Частота отмены бронирований' : 'Cancellation rate'}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {occupancy.avgStayDays} {isRu ? 'дн.' : 'd'}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Длительность проживания' : 'Average stay'}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatPrice(occupancy.pricePerNight)}</div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Цена за ночь' : 'Price per night'}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {isRu
              ? `Обновлено ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}.`
              : `Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`
            }
          </p>
        </CardContent>
      </Card>

      {/* Conversion */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{isRu ? 'Конверсия' : 'Conversion'}</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <div className="text-2xl font-bold">{conversion.bookingConversion}%</div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Конверсия в бронирования' : 'Booking conversion'}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {conversion.bookingToArrivalDays} {isRu ? 'дн.' : 'd'}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Время между бронированием и прибытием' : 'Booking to arrival'}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">{conversion.repeatGuestPercent}%</div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Постоянные гости' : 'Repeat guests'}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold">{conversion.wishlistAdds}</div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Добавления в вишлисты' : 'Wishlist saves'}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {isRu
              ? `Обновлено ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}.`
              : `Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`
            }
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
