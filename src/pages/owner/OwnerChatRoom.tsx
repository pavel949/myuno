import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperty } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyChatWindow } from '@/components/owner/PropertyChatWindow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { propertyBookingStatus } from '@/lib/propertyBookingPresentation';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';

export default function OwnerChatRoom() {
  const { type, id } = useParams<{ type: 'property' | 'booking'; id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const location = useLocation();
  const requestedReturn = location.state?.bookingChatReturnTo;
  const fallbackPath = type === 'booking' && typeof requestedReturn === 'string' && /^\/mc\/today(?:$|[?#])/.test(requestedReturn)
    ? requestedReturn : APP_ROUTES.MC_MESSAGES;

  // Fetch booking details if type is booking (with ownership verification)
  const { data: booking, isError: bookingError, isFetching: bookingFetching, isFetchedAfterMount: bookingChecked } = useQuery({
    queryKey: ['mc-booking-chat-context', user?.id, id],
    queryFn: async () => {
      if (type !== 'booking' || !id || !user) return null;
      const { data, error } = await supabase
        .from('property_bookings')
        .select('id, property_id, owner_id, guest_name, guest_phone, check_in, check_out, guests_count, total_amount, currency, status, properties(title, title_ru)')
        .eq('id', id)
        .eq('owner_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: type === 'booking' && !!id && !!user,
    refetchOnMount: 'always',
    retry: false,
  });
  const bookingVerifying = bookingFetching && !bookingChecked;

  // Fetch property details if type is property
  const { data: property } = useOwnerProperty(type === 'property' ? id : undefined);

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
          <Button onClick={() => redirectToAuth(navigate)}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  // The existing owner-scoped read and database policies remain the authority.
  // A router ID alone must never mount the chat composer or subscription.
  if (type === 'booking' && (bookingVerifying || bookingError || !id || booking?.id !== id || booking?.owner_id !== user.id || !booking?.property_id)) {
    return <PageContainer>
      <PageHeader title={pickLang(language, { en: 'Guest Chat', ru: 'Чат с гостем', th: 'แชทกับผู้เข้าพัก' })} showBack fallbackPath={fallbackPath} />
      {bookingVerifying ? <p role="status">{pickLang(language, { en: 'Checking booking access…', ru: 'Проверяем доступ…', th: 'กำลังตรวจสอบสิทธิ์…' })}</p>
        : <p role="alert">{pickLang(language, { en: 'Booking conversation unavailable.', ru: 'Переписка по бронированию недоступна.', th: 'ไม่สามารถเปิดแชทการจองได้' })}</p>}
    </PageContainer>;
  }
  const status = propertyBookingStatus(booking?.status);
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
        fallbackPath={fallbackPath}
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
              {typeof booking.total_amount === 'number' && Number.isFinite(booking.total_amount) && (
                <span className="flex items-center gap-1" title={pickLang(language, { en: 'Booking total is not proof of payment', ru: 'Стоимость брони не подтверждает оплату', th: 'ยอดจองไม่ใช่หลักฐานการชำระเงิน' })}>
                  <DollarSign className="w-3 h-3" aria-hidden="true" />
                  {pickLang(language, { en: 'Booking total', ru: 'Стоимость брони', th: 'ยอดจอง' })}: {booking.total_amount.toLocaleString()} {booking.currency ?? ''}
                </span>
              )}
              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs h-5">
                {pickLang(language, { en: status.label, ru: status.labelRu, th: status.labelTh })}
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
          key={type === 'booking' ? `booking:${user.id}:${booking?.id}` : undefined}
          bookingId={type === 'booking' ? booking?.id : undefined}
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
