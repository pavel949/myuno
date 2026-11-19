import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { subDays } from 'date-fns';
import { BarChart3, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { bangkokTodayDate, civilStaySpan, toBangkokDateKey } from '@/lib/hotelDates';

const REPORTABLE_BOOKING_STATUSES = new Set(['confirmed', 'active', 'checked_in', 'checked_out', 'completed']);

export default function OwnerPortfolio() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useOwnerProperties();
  const { bookings, isLoading: bookingsLoading, error: bookingsError } = useAllPropertyBookings();

  const propertyMetrics = useMemo(() => {
    // Report distinct booked nights in the past 30 completed Phuket dates.
    // Booking data is not proof of actual occupancy or earned income.
    const start = subDays(bangkokTodayDate(), 30);
    return (properties ?? []).map(property => {
      const occupiedDates = new Set<number>();
      if (!bookingsError && !bookingsLoading && bookings) {
        for (const booking of bookings) {
          if (booking.property_id !== property.id || !booking.status ||
              !REPORTABLE_BOOKING_STATUSES.has(booking.status)) continue;
          const checkIn = toBangkokDateKey(booking.check_in);
          const checkOut = toBangkokDateKey(booking.check_out);
          if (!checkIn || !checkOut) continue;
          const span = civilStaySpan({ check_in: checkIn, check_out: checkOut }, start, 30);
          if (!span) continue;
          for (let day = span.startOffset; day < span.endOffset; day++) occupiedDates.add(day);
        }
      }
      return {
        id: property.id,
        title: isRu && property.title_ru ? property.title_ru : property.title,
        coverImage: property.cover_image,
        bookedNights: bookingsError || bookingsLoading || !bookings ? null : occupiedDates.size,
      };
    }).sort((a, b) => (b.bookedNights ?? -1) - (a.bookedNights ?? -1));
  }, [properties, bookings, bookingsError, bookingsLoading, isRu]);

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      <PageHeader
        title={isRu ? 'Аналитика портфеля' : 'Portfolio Analytics'}
        subtitle={isRu ? 'Недвижимость и бронирования' : 'Properties and bookings'}
      />
      <Card className="mb-6">
        <CardContent className="space-y-2 p-4">
          <h2 className="font-semibold">{isRu ? 'Финансовые результаты не сверены' : 'Financial results are not reconciled'}</h2>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Записи по объектам не подтверждают поступления, прибыль или доходность.'
              : 'Property records do not establish receipts, profit, or return on investment.'}
          </p>
          <Link to="/mc/financials" className="inline-block text-sm font-medium text-primary underline">
            {isRu ? 'Открыть записи операций' : 'Open transaction records'}
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            {isRu ? 'Сравнение объектов' : 'Property comparison'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Забронированные ночи за последние 30 завершённых дней, время Пхукета.' : 'Booked nights over the last 30 completed days, Phuket time.'}
          </p>
        </CardHeader>
        <CardContent>
          {propertiesLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : propertiesError ? (
            <p role="alert" className="text-sm text-muted-foreground">
              {isRu ? 'Не удалось загрузить объекты.' : 'Could not load properties.'}
            </p>
          ) : propertyMetrics.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {isRu ? 'Нет объектов для анализа' : 'No properties to analyze'}
            </p>
          ) : (
            <div className="space-y-3">
              {propertyMetrics.map(property => (
                <Link key={property.id} to={`/mc/properties/${property.id}`}
                  className="flex flex-wrap items-center gap-3 border bg-card p-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {property.coverImage ? (
                    <img src={property.coverImage} alt="" className="h-12 w-16 shrink-0 object-cover" />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center bg-muted">
                      <Home className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">{property.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {property.bookedNights === null
                        ? bookingsLoading
                          ? (isRu ? 'Загрузка бронирований…' : 'Loading bookings…')
                          : (isRu ? 'Данные бронирований недоступны' : 'Booking data unavailable')
                        : isRu ? `Ночей: ${property.bookedNights} из 30` : `Nights: ${property.bookedNights} of 30`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
