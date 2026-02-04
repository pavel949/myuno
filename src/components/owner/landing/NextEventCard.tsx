import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Key, LogOut, Calendar, ChevronRight, Users } from 'lucide-react';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function NextEventCard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { upcomingBookings, activeBookings, isLoading } = useAllPropertyBookings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  // Determine next event: check-out from active or check-in from upcoming
  const nextCheckOut = activeBookings?.[0];
  const nextCheckIn = upcomingBookings?.[0];

  // Determine which event is closest
  let nextEvent: 'check_in' | 'check_out' | null = null;
  let booking: typeof nextCheckIn = null;
  let eventDate: Date | null = null;

  if (nextCheckOut && nextCheckIn) {
    const checkOutDate = new Date(nextCheckOut.check_out);
    const checkInDate = new Date(nextCheckIn.check_in);
    if (checkOutDate <= checkInDate) {
      nextEvent = 'check_out';
      booking = nextCheckOut;
      eventDate = checkOutDate;
    } else {
      nextEvent = 'check_in';
      booking = nextCheckIn;
      eventDate = checkInDate;
    }
  } else if (nextCheckOut) {
    nextEvent = 'check_out';
    booking = nextCheckOut;
    eventDate = new Date(nextCheckOut.check_out);
  } else if (nextCheckIn) {
    nextEvent = 'check_in';
    booking = nextCheckIn;
    eventDate = new Date(nextCheckIn.check_in);
  }

  if (!booking || !eventDate) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Нет предстоящих событий' : 'No upcoming events'}
          </p>
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => navigate('/owner/calendar')}
            className="mt-2"
          >
            {isRu ? 'Открыть календарь' : 'Open Calendar'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysUntil = differenceInDays(eventDate, new Date());
  const isEventToday = isToday(eventDate);
  const isEventTomorrow = isTomorrow(eventDate);

  const getTimeLabel = () => {
    if (isEventToday) return isRu ? 'Сегодня' : 'Today';
    if (isEventTomorrow) return isRu ? 'Завтра' : 'Tomorrow';
    if (daysUntil < 7) {
      return isRu ? `Через ${daysUntil} дн.` : `In ${daysUntil} days`;
    }
    return format(eventDate, 'd MMM', { locale: isRu ? ru : undefined });
  };

  const isCheckIn = nextEvent === 'check_in';
  const EventIcon = isCheckIn ? Key : LogOut;
  const eventLabel = isCheckIn 
    ? (isRu ? 'Заезд' : 'Check-in')
    : (isRu ? 'Выезд' : 'Check-out');

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
        isEventToday ? 'border-warning bg-warning/5' : ''
      }`}
      onClick={() => navigate(`/owner/bookings/${booking.id}`)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isCheckIn ? 'bg-success/20' : 'bg-warning/20'}`}>
              <EventIcon className={`h-4 w-4 ${isCheckIn ? 'text-success' : 'text-warning'}`} />
            </div>
            <div>
              <span className="text-sm font-medium">{eventLabel}</span>
              <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                isEventToday 
                  ? 'bg-warning text-warning-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getTimeLabel()}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Property & Guest */}
        <div className="space-y-2">
          <p className="font-medium text-sm line-clamp-1">
            {booking.owner_properties?.title || 'Unknown Property'}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{booking.guest_name || (isRu ? 'Гость' : 'Guest')}</span>
            {booking.guests_count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {booking.guests_count}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {isEventToday && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
              {isRu ? 'Подготовить' : 'Prepare'}
            </Button>
            <Button size="sm" className="flex-1 h-8 text-xs">
              {isRu ? 'Детали' : 'Details'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
