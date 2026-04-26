import { PropertyBooking } from '@/hooks/usePropertyBookings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';
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

const statusMap: Record<string, { label: string; labelRu: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmed', labelRu: 'Подтверждено', variant: 'default' },
  pending: { label: 'Pending', labelRu: 'Ожидает', variant: 'secondary' },
  cancelled: { label: 'Cancelled', labelRu: 'Отменено', variant: 'destructive' },
  completed: { label: 'Completed', labelRu: 'Завершено', variant: 'outline' },
  checked_in: { label: 'Checked In', labelRu: 'Заселён', variant: 'default' },
};

export function BookingDetailSheet({ open, onOpenChange, booking, propertyTitle }: BookingDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const {
    events: historyEvents,
    isLoading: historyLoading,
    highlightIds: historyHighlightIds,
  } = useBookingStatusHistory({
    table: 'property_booking_status_history',
    bookingId: booking?.id,
    enabled: open && !!booking?.id,
  });

  if (!booking) return null;

  const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
  const status = statusMap[booking.status || ''] || statusMap.pending;

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
        <Badge variant={status.variant}>{isRu ? status.labelRu : status.label}</Badge>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-none bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-success">{isRu ? 'Заезд' : 'Check-in'}</span>
          </div>
          <p className="text-sm font-semibold">
            {format(new Date(booking.check_in), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
          </p>
        </div>
        <div className="p-3 rounded-none bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium text-warning">{isRu ? 'Выезд' : 'Check-out'}</span>
          </div>
          <p className="text-sm font-semibold">
            {format(new Date(booking.check_out), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {nights} {isRu ? 'ноч.' : 'nights'}
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
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guest_name}</span>
          </div>
        )}
        {booking.guest_phone && (
          <a href={`tel:${booking.guest_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guest_phone}</span>
          </a>
        )}
        {booking.guest_email && (
          <a href={`mailto:${booking.guest_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guest_email}</span>
          </a>
        )}
      </div>

      {/* Financial */}
      {(booking.total_amount !== undefined && booking.total_amount > 0) && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{isRu ? 'Оплата' : 'Payment'}</h4>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {booking.total_amount?.toLocaleString()} {booking.currency || 'THB'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Source & ID */}
      {(booking.source || booking.external_id) && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {booking.source && (
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {isRu ? 'Источник' : 'Source'}: <span className="capitalize">{booking.source}</span>
              </span>
            )}
            {booking.external_id && (
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                ID: {booking.external_id}
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
        {historyLoading ? (
          <BookingStatusTimelineSkeleton rows={3} compact />
        ) : (
          <BookingStatusTimeline
            events={historyEvents}
            currentStatus={booking.status ?? undefined}
            createdAt={booking.created_at}
            highlightIds={historyHighlightIds}
            compact
          />
        )}
      </div>
    </ResponsiveModal>
  );
}
