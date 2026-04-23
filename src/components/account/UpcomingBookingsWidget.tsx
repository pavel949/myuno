import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Calendar, Clock, MapPin, ChevronRight, Package } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ORDER_TYPE_ICONS: Record<string, string> = {
  tour: '🏝️',
  beauty: '💆',
  cleaning: '🧹',
  event: '🎫',
  yacht: '🚤',
  vehicle: '🚗',
  activity: '🎯',
  service: '⚡',
  food: '🍽️',
  flowers: '💐',
  medical: '🏥',
  education: '📚',
  babysitter: '👶',
  property: '🏠',
};

export function UpcomingBookingsWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { orders, isLoading } = useOrders();

  // Filter and sort upcoming bookings
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return orders
      .filter(order => 
        ['pending', 'confirmed', 'in_progress'].includes(order.status) &&
        order.start_at &&
        new Date(order.start_at) >= now
      )
      .sort((a, b) => 
        new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime()
      )
      .slice(0, 3);
  }, [orders]);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return isRu ? 'Сегодня' : 'Today';
    if (isTomorrow(date)) return isRu ? 'Завтра' : 'Tomorrow';
    return format(date, 'd MMM', { locale });
  };

  const getTimeUntil = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { 
      addSuffix: false, 
      locale 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isRu ? 'Предстоящие' : 'Upcoming'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-none" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (upcomingBookings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isRu ? 'Предстоящие' : 'Upcoming'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isRu ? 'Нет предстоящих бронирований' : 'No upcoming bookings'}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/discover')}
              className="mt-2"
            >
              {isRu ? 'Найти услуги' : 'Browse services'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isRu ? 'Предстоящие' : 'Upcoming'}
          </CardTitle>
          {orders.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bookings')}
              className="h-7 text-xs text-muted-foreground"
            >
              {isRu ? 'Все' : 'View all'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingBookings.map(booking => {
          const icon = ORDER_TYPE_ICONS[booking.order_type] || '📦';
          const firstItem = booking.order_items?.[0];
          const title = firstItem?.item_name || booking.order_type;
          const isUrgent = booking.start_at && isToday(new Date(booking.start_at));

          return (
            <button
              key={booking.id}
              onClick={() => navigate(`/bookings/${booking.id}`)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-none text-left transition-colors",
                "hover:bg-muted/50 active:scale-[0.98]",
                isUrgent && "bg-primary/5 border border-primary/20"
              )}
            >
              {(() => { const BookingIcon = resolveIcon(icon); return <BookingIcon className="w-6 h-6 text-primary" />; })()}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className={cn(isUrgent && "text-primary font-medium")}>
                    {booking.start_at && getDateLabel(booking.start_at)}
                  </span>
                  {booking.start_at && (
                    <>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(booking.start_at), 'HH:mm')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {booking.start_at && (
                    <span className="text-primary">
                      {isRu ? 'через ' : 'in '}
                      {getTimeUntil(booking.start_at)}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
