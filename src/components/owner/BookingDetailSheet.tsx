import { propertyBookingStatus } from '@/lib/propertyBookingPresentation';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { parseCivilDate } from '@/lib/hotelDates';
import { PropertyBooking } from '@/hooks/usePropertyBookings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, differenceInCalendarDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { User, CalendarDays, Phone, Mail, CreditCard, Hash, StickyNote, Clock, History } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { BookingStatusTimeline, BookingStatusTimelineSkeleton } from '@/components/bookings/BookingStatusTimeline';
import { useBookingStatusHistory } from '@/hooks/useBookingStatusHistory';

interface BookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: PropertyBooking | null;
  propertyTitle?: string;
}

export function BookingDetailSheet({ open, onOpenChange, booking, propertyTitle }: BookingDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const location = useLocation();
  const isManagement = location.pathname === '/mc' || location.pathname.startsWith('/mc/');

  const {
    events: historyEvents,
    isLoading: historyLoading,
    highlightIds: historyHighlightIds,
    error: historyError,
  } = useBookingStatusHistory({
    table: booking?.order_id ? 'order_status_history' : 'property_booking_status_history',
    bookingId: booking?.order_id || booking?.id,
    enabled: open && !!booking?.id,
  });

  if (!booking) return null;

  const nights = differenceInCalendarDays(parseCivilDate(booking.check_out), parseCivilDate(booking.check_in));
  const status = propertyBookingStatus(booking.status);
  const dateLabel = (value: string) => {
    const date = parseCivilDate(value);
    return Number.isFinite(date.getTime()) ? format(date, 'd MMM yyyy', { locale: isRu ? ru : undefined }) : (isRu ? 'Дата неизвестна' : 'Date unavailable');
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={booking.guest_name || (isRu ? 'Гость' : 'Guest')}
      description={propertyTitle}
      icon={<CalendarDays className="w-5 h-5 text-primary" />}
      size="md"
    >
      <div className="flex items-center gap-2">
        <Badge role="status" aria-label={isRu ? 'Статус бронирования' : 'Booking status'} variant={status.variant}>{isRu ? status.labelRu : status.label}</Badge>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-none bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-success">{isRu ? 'Заезд' : 'Check-in'}</span>
          </div>
          <p className="text-sm font-semibold">
            {dateLabel(booking.check_in)}
          </p>
        </div>
        <div className="p-3 rounded-none bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium text-warning">{isRu ? 'Выезд' : 'Check-out'}</span>
          </div>
          <p className="text-sm font-semibold">
            {dateLabel(booking.check_out)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {Number.isFinite(nights) && nights > 0 ? nights : '—'} {isRu ? 'ноч.' : 'nights'}
        </span>
        {booking.guests_count && (
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {booking.guests_count} {isRu ? 'гост.' : 'guests'}
          </span>
        )}
      </div>

      <Separator />

      {/* Guest info */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{isRu ? 'Гость' : 'Guest'}</h4>
        {booking.guest_name && (
          <div className="flex items-center gap-2 text-sm min-w-0 break-all">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guest_name}</span>
          </div>
        )}
        {booking.guest_phone && (
          <a href={`tel:${booking.guest_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline min-w-0 break-all">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guest_phone}</span>
          </a>
        )}
        {booking.guest_email && (
          <a href={`mailto:${booking.guest_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline min-w-0 break-all">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guest_email}</span>
          </a>
        )}
      </div>

      <Separator />
      <section className="space-y-3 min-w-0" aria-label={isRu ? 'Стоимость и расчёты' : 'Price and payments'}>
        <h4 className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />{isRu ? 'Стоимость бронирования' : 'Booking total'}
        </h4>
        <p className="text-lg font-semibold break-words">
          {typeof booking.total_amount === 'number' && Number.isFinite(booking.total_amount)
            ? `${booking.total_amount.toLocaleString()} ${booking.currency || (isRu ? '(валюта неизвестна)' : '(currency unavailable)')}`
            : (isRu ? 'Стоимость неизвестна' : 'Total unavailable')}
        </p>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Полученная оплата, остаток и возвратный депозит требуют сверки. Подтверждение брони не подтверждает оплату.' : 'Received payment, balance and refundable deposit require reconciliation. A confirmed booking does not confirm payment.'}
        </p>
      </section>

      {isManagement && booking.property_id && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" className="min-h-11 h-auto whitespace-normal" asChild>
            <Link to={`/mc/calendar?property=${encodeURIComponent(booking.property_id)}`} onClick={() => onOpenChange(false)}>{isRu ? 'Календарь и задачи объекта' : 'Property calendar and tasks'}</Link>
          </Button>
          <Button variant="outline" className="min-h-11 h-auto whitespace-normal" asChild>
            <Link to={`/mc/properties/${encodeURIComponent(booking.property_id)}`} onClick={() => onOpenChange(false)}>{isRu ? 'Открыть объект' : 'Open property'}</Link>
          </Button>
        </div>
      )}

      {/* Source & ID */}
      {(booking.source || booking.external_id || booking.order_id) && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {booking.source && (
              <span className="flex items-center gap-1 min-w-0 break-all">
                <Hash className="h-3 w-3" />
                {isRu ? 'Источник' : 'Source'}: <span className="capitalize">{booking.source}</span>
              </span>
            )}
            {(booking.order_id || booking.external_id) && (
              <span className="flex items-center gap-1 min-w-0 break-all">
                <Hash className="h-3 w-3" />
                ID: {booking.order_id || booking.external_id}
              </span>
            )}
          </div>
        </>
      )}

      {/* Notes */}
      {booking.notes && (
        <>
          <Separator />
          <div className="space-y-1">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <StickyNote className="h-4 w-4" />
              {isRu ? 'Заметки' : 'Notes'}
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
          </div>
        </>
      )}

      {/* Status history */}
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <History className="h-4 w-4" />
          {isRu ? 'История статусов' : 'Status history'}
        </h4>
        {historyError ? (
          <p role="alert" className="text-sm text-destructive">{isRu ? 'Не удалось загрузить историю статусов. Закройте карточку и откройте снова.' : 'Status history could not be loaded. Close and reopen this card to retry.'}</p>
        ) : historyLoading ? (
          <BookingStatusTimelineSkeleton rows={3} compact />
        ) : (
          <BookingStatusTimeline
            events={historyEvents}
            highlightIds={historyHighlightIds}
            compact
          />
        )}
      </div>
    </ResponsiveModal>
  );
}
