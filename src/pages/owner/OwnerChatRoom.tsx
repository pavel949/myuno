import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyBookings, PropertyBooking } from '@/hooks/usePropertyBookings';
import { useOwnerProperty } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyChatWindow } from '@/components/owner/PropertyChatWindow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function OwnerChatRoom() {
  const { type, id } = useParams<{ type: 'property' | 'booking'; id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Fetch booking details if type is booking (with ownership verification)
  const { data: booking } = useQuery({
    queryKey: ['booking-detail', id, user?.id],
    queryFn: async () => {
      if (type !== 'booking' || !id || !user) return null;
      const { data, error } = await supabase
        .from('property_bookings')
        .select('*, properties(title, title_ru)')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: type === 'booking' && !!id && !!user,
  });

  // Fetch property details if type is property
  const { data: property } = useOwnerProperty(type === 'property' ? id : undefined);

  const { formatPrice } = useCurrency();
  const [showBookingContext, setShowBookingContext] = useState(true);

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Чат' : 'Chat'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для доступа к чату' : 'Sign in to access chat'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const title = type === 'booking'
    ? booking?.guest_name || (isRu ? 'Чат с гостем' : 'Guest Chat')
    : property?.title || (isRu ? 'Чат по объекту' : 'Property Chat');

  const subtitle = type === 'booking'
    ? (isRu && (booking?.properties as any)?.title_ru
        ? (booking?.properties as any)?.title_ru
        : (booking?.properties as any)?.title)
    : property?.address;

  return (
    <PageContainer className="flex flex-col h-[calc(100vh-120px)]">
      <PageHeader
        title={title}
        subtitle={subtitle}
        showBack
        fallbackPath="/mc/messages"
      />

      {/* Booking Context Card */}
      {type === 'booking' && booking && (
        <div className="mb-2">
          <button
            onClick={() => setShowBookingContext(!showBookingContext)}
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-none text-sm"
          >
            <span className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {format(new Date(booking.check_in), 'dd MMM', { locale: isRu ? ru : undefined })}
              {' → '}
              {format(new Date(booking.check_out), 'dd MMM', { locale: isRu ? ru : undefined })}
              <span className="text-muted-foreground">
                · {differenceInDays(new Date(booking.check_out), new Date(booking.check_in))} {isRu ? 'н.' : 'n.'}
              </span>
            </span>
            {showBookingContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showBookingContext && (
            <div className="px-3 py-2 bg-muted/30 rounded-none border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
              {booking.guests_count && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {booking.guests_count} {isRu ? 'гост.' : 'guests'}
                </span>
              )}
              {booking.total_amount && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> {formatPrice(booking.total_amount)}
                </span>
              )}
              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs h-5">
                {booking.status}
              </Badge>
              {booking.guest_phone && (
                <a href={`tel:${booking.guest_phone}`} className="text-primary hover:underline ml-auto">
                  {booking.guest_phone}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 mt-2 min-h-0">
        <PropertyChatWindow
          propertyId={type === 'property' ? id : booking?.property_id}
          bookingId={type === 'booking' ? id : undefined}
          guestName={booking?.guest_name || undefined}
          propertyTitle={type === 'property' 
            ? (isRu && property?.title_ru ? property.title_ru : property?.title)
            : undefined
          }
          className="h-full"
        />
      </div>
    </PageContainer>
  );
}
