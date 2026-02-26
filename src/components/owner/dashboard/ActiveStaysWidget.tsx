import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Home, User, Calendar, ChevronRight, 
  MapPin, Phone, Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveStay {
  bookingId: string;
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  guestName: string;
  guestPhone?: string;
  guestsCount?: number;
  checkIn: Date;
  checkOut: Date;
  daysRemaining: number;
  totalNights: number;
}

export function ActiveStaysWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { allProperties: properties, isLoading: propertiesLoading } = useMyProperties();
  const { activeBookings, isLoading: bookingsLoading } = useAllPropertyBookings();
  
  const activeStays = useMemo<ActiveStay[]>(() => {
    if (!activeBookings || !properties?.length) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return activeBookings
      .map(booking => {
        const property = properties.find(p => p.property_id === booking.property_id);
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        
        return {
          bookingId: booking.id,
          propertyId: booking.property_id,
          propertyName: property 
            ? (isRu ? property.title_ru : property.title) || property.title
            : isRu ? 'Объект' : 'Property',
          propertyImage: property?.cover_image,
          guestName: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          guestPhone: booking.guest_phone,
          guestsCount: booking.guests_count,
          checkIn,
          checkOut,
          daysRemaining: Math.max(0, differenceInDays(checkOut, today)),
          totalNights: differenceInDays(checkOut, checkIn),
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [activeBookings, properties, isRu]);
  
  const isLoading = propertiesLoading || bookingsLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-28 w-64 rounded-xl shrink-0" />
          <Skeleton className="h-28 w-64 rounded-xl shrink-0" />
        </div>
      </div>
    );
  }
  
  if (activeStays.length === 0) {
    return null; // Don't show widget if no active stays
  }
  
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          {isRu ? 'Сейчас проживают' : 'Currently Staying'}
          <Badge variant="secondary" className="text-xs font-medium">
            {activeStays.length}
          </Badge>
        </h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-y snap-x snap-mandatory">
        {activeStays.map((stay) => (
          <Card 
            key={stay.bookingId}
            className="shrink-0 w-[85vw] max-w-[288px] snap-start touch-manipulation overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-success"
            onClick={() => navigate(`/owner/bookings/${stay.bookingId}`)}
          >
            <CardContent className="p-0">
              <div className="flex gap-3 p-3">
                {/* Property Image */}
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  {stay.propertyImage ? (
                    <img 
                      src={stay.propertyImage} 
                      alt={stay.propertyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* Guest Name */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{stay.guestName}</span>
                    {stay.guestsCount && stay.guestsCount > 1 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <Users className="h-2.5 w-2.5 mr-0.5" />
                        {stay.guestsCount}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Property */}
                  <p className="text-xs text-muted-foreground truncate mb-1.5">
                    {stay.propertyName}
                  </p>
                  
                  {/* Dates & Remaining */}
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {format(stay.checkOut, 'd MMM', { locale: isRu ? ru : undefined })}
                    </span>
                    <Badge 
                      variant={stay.daysRemaining <= 1 ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {stay.daysRemaining === 0 
                        ? (isRu ? 'Выезд сегодня' : 'Checkout today')
                        : stay.daysRemaining === 1
                          ? (isRu ? '1 день' : '1 day left')
                          : `${stay.daysRemaining} ${isRu ? 'дн.' : 'days'}`
                      }
                    </Badge>
                  </div>
                </div>
                
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
              </div>
              
              {/* Quick contact action */}
              {stay.guestPhone && (
                <div className="border-t px-3 py-2 bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${stay.guestPhone}`, '_blank');
                    }}
                  >
                    <Phone className="h-3 w-3" />
                    {stay.guestPhone}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
