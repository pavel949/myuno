import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  LogIn, LogOut, AlertTriangle, CalendarCheck,
  User, ChevronRight, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayEvent {
  id: string;
  type: 'check_in' | 'check_out' | 'check_in_tomorrow' | 'check_out_tomorrow';
  guestName: string;
  propertyName: string;
  propertyId: string;
  bookingId: string;
  date: Date;
}

export function TodayBriefingWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { allProperties: properties, isLoading: propertiesLoading } = useMyProperties();
  const { upcomingBookings, activeBookings, isLoading: bookingsLoading } = useAllPropertyBookings();

  const events = useMemo<TodayEvent[]>(() => {
    if (!properties?.length) return [];
    const allBookings = [...(upcomingBookings || []), ...(activeBookings || [])];
    const result: TodayEvent[] = [];

    for (const booking of allBookings) {
      const property = properties.find(p => p.property_id === booking.property_id);
      const pName = property
        ? (isRu ? property.title_ru : property.title) || property.title
        : isRu ? 'Объект' : 'Property';
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);

      if (isToday(checkIn)) {
        result.push({
          id: `ci-${booking.id}`, type: 'check_in',
          guestName: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          propertyName: pName, propertyId: booking.property_id,
          bookingId: booking.id, date: checkIn,
        });
      } else if (isTomorrow(checkIn)) {
        result.push({
          id: `ci-tm-${booking.id}`, type: 'check_in_tomorrow',
          guestName: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          propertyName: pName, propertyId: booking.property_id,
          bookingId: booking.id, date: checkIn,
        });
      }

      if (isToday(checkOut)) {
        result.push({
          id: `co-${booking.id}`, type: 'check_out',
          guestName: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          propertyName: pName, propertyId: booking.property_id,
          bookingId: booking.id, date: checkOut,
        });
      } else if (isTomorrow(checkOut)) {
        result.push({
          id: `co-tm-${booking.id}`, type: 'check_out_tomorrow',
          guestName: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          propertyName: pName, propertyId: booking.property_id,
          bookingId: booking.id, date: checkOut,
        });
      }
    }

    // Sort: today first, then tomorrow; check-outs before check-ins
    const priority: Record<TodayEvent['type'], number> = {
      check_out: 0, check_in: 1, check_out_tomorrow: 2, check_in_tomorrow: 3,
    };
    return result.sort((a, b) => priority[a.type] - priority[b.type]);
  }, [upcomingBookings, activeBookings, properties, isRu]);

  const isLoading = propertiesLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  const todayEvents = events.filter(e => e.type === 'check_in' || e.type === 'check_out');
  const tomorrowEvents = events.filter(e => e.type === 'check_in_tomorrow' || e.type === 'check_out_tomorrow');

  if (events.length === 0) {
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-[15px]">
            {isRu ? 'Сегодня' : 'Today'}
          </h3>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            {isRu ? 'Нет заездов и выездов на сегодня и завтра' : 'No check-ins or check-outs today or tomorrow'}
          </CardContent>
        </Card>
      </section>
    );
  }

  const typeConfig = {
    check_in: {
      icon: LogIn, color: 'text-success', bg: 'bg-success/10',
      border: 'border-l-success',
      label: isRu ? 'Заезд сегодня' : 'Check-in today',
    },
    check_out: {
      icon: LogOut, color: 'text-warning', bg: 'bg-warning/10',
      border: 'border-l-warning',
      label: isRu ? 'Выезд сегодня' : 'Check-out today',
    },
    check_in_tomorrow: {
      icon: LogIn, color: 'text-info', bg: 'bg-info/10',
      border: 'border-l-info',
      label: isRu ? 'Заезд завтра' : 'Check-in tomorrow',
    },
    check_out_tomorrow: {
      icon: LogOut, color: 'text-accent-amber', bg: 'bg-accent-amber/10',
      border: 'border-l-accent-amber',
      label: isRu ? 'Выезд завтра' : 'Check-out tomorrow',
    },
  };

  const renderEvent = (event: TodayEvent) => {
    const cfg = typeConfig[event.type];
    const Icon = cfg.icon;

    return (
      <Card
        key={event.id}
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow border-l-4',
          cfg.border
        )}
        onClick={() => navigate(`/mc/bookings/${event.bookingId}`)}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className={cn('p-2 rounded-lg shrink-0', cfg.bg)}>
            <Icon className={cn('h-4 w-4', cfg.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">{event.guestName}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Home className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{event.propertyName}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {cfg.label}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-3">
      {todayEvents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-[15px] flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              {isRu ? 'Сегодня' : 'Today'}
              <Badge variant="secondary" className="text-xs">{todayEvents.length}</Badge>
            </h3>
          </div>
          <div className="space-y-2">
            {todayEvents.map(renderEvent)}
          </div>
        </div>
      )}

      {tomorrowEvents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              {isRu ? 'Завтра' : 'Tomorrow'}
            </h4>
            <Badge variant="outline" className="text-[10px]">{tomorrowEvents.length}</Badge>
          </div>
          <div className="space-y-2">
            {tomorrowEvents.map(renderEvent)}
          </div>
        </div>
      )}
    </section>
  );
}
