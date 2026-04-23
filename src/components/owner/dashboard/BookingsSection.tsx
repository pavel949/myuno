import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CalendarDays, Link2 } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BookingsSectionProps {
  activeOrders: any[];
  upcomingOrders: any[];
}

export function BookingsSection({ activeOrders, upcomingOrders }: BookingsSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Бронирования' : 'Bookings'}
        </CardTitle>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate('/mc/channels')}
          >
            <Link2 className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Каналы' : 'Channels'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate('/mc/calendar')}
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Календарь' : 'Calendar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Active (current guests) */}
        {activeOrders.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {isRu ? 'Сейчас проживают' : 'Currently staying'}
            </p>
            <div className="space-y-2">
              {activeOrders.slice(0, 2).map((order) => {
                const guestName = (order.metadata as any)?.guest_name || (isRu ? 'Гость' : 'Guest');
                return (
                  <div 
                    key={order.id}
                    className="flex items-center gap-3 p-2.5 rounded-none bg-success/10 border border-success/20"
                  >
                    <div className="p-1.5 rounded-full bg-success/20">
                      <Users className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.[0]?.product_name || order.order_number} • 
                        {isRu ? ' до ' : ' until '}
                        {order.end_at && format(new Date(order.end_at), 'd MMM', { locale: isRu ? ru : undefined })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                      {isRu ? 'Активно' : 'Active'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingOrders.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {isRu ? 'Предстоящие' : 'Upcoming'}
            </p>
            <div className="space-y-2">
              {upcomingOrders.slice(0, 3).map((order) => {
                const checkIn = order.start_at ? new Date(order.start_at) : new Date();
                const daysUntil = differenceInDays(checkIn, new Date());
                const guestName = (order.metadata as any)?.guest_name || (isRu ? 'Гость' : 'Guest');
                
                return (
                  <div 
                    key={order.id}
                    className="flex items-center gap-3 p-2.5 rounded-none bg-muted/50"
                  >
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.[0]?.product_name || order.order_number} • 
                        {format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isToday(checkIn) ? (isRu ? 'Сегодня' : 'Today') :
                       isTomorrow(checkIn) ? (isRu ? 'Завтра' : 'Tomorrow') :
                       `${daysUntil} ${isRu ? 'дн' : 'd'}`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
