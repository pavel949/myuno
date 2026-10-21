import { useSearchParams } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrderReturnRead } from '@/hooks/useOrderReturnRead';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

export default function EventSuccess() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const orderId = searchParams.get('order_id');

  const { order, confirmed, isLoading, status } = useOrderReturnRead({ orderTypes: ['event'], orderId, sessionId: searchParams.get('session_id') });

  const meta = order?.metadata || {};

  const details = order ? (
    <div className="space-y-3 text-sm">
      {meta.event_title && (
        <div className="flex items-start gap-3">
          <Ticket className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">{String(meta.event_title)}</p>
            {meta.ticket_count != null && (
              <p className="text-xs text-muted-foreground">
                × {String(meta.ticket_count)} {isRu ? 'билет(ов)' : 'ticket(s)'}
              </p>
            )}
          </div>
        </div>
      )}

      {meta.event_date && (
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>
            {String(meta.event_date)}{meta.event_time ? ` · ${String(meta.event_time)}` : ''}
          </span>
        </div>
      )}

      {meta.contact_name && (
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>{String(meta.contact_name)}</span>
        </div>
      )}

      {meta.pickup_hotel && (
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>
            {String(meta.pickup_hotel)}
            {meta.pickup_room ? `, ${isRu ? 'ком.' : 'rm.'} ${String(meta.pickup_room)}` : ''}
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-border flex justify-between font-semibold">
        <span>{isRu ? 'Итого' : 'Total'}</span>
        <span>{order.total_amount?.toLocaleString()} {order.currency}</span>
      </div>
    </div>
  ) : null;

  const eventTitle = meta.event_title ? String(meta.event_title) : '';
  const eventWhen = [meta.event_date && String(meta.event_date), meta.event_time && String(meta.event_time)]
    .filter(Boolean).join(' · ');
  const ticketCount = meta.ticket_count != null ? String(meta.ticket_count) : '';
  const summaryRu = [
    eventTitle && `Событие: ${eventTitle}`,
    ticketCount && `Билетов: ${ticketCount}`,
    eventWhen && `Когда: ${eventWhen}`,
  ].filter(Boolean).join('\n');
  const summaryEn = [
    eventTitle && `Event: ${eventTitle}`,
    ticketCount && `Tickets: ${ticketCount}`,
    eventWhen && `When: ${eventWhen}`,
  ].filter(Boolean).join('\n');

  return (
    <UnifiedSuccessLayout
      isLoading={isLoading}
      status={status}
      hideWhatsApp={!order}
      orderNumber={order?.order_number}
      note={{
        ru: 'Проверьте билеты и условия посещения в разделе заказов.',
        en: 'Check ticket and admission details in My orders.',
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="event" /> : undefined}
      primaryHref="/bookings"
      secondaryHref="/events"
      secondaryLabel={{ ru: 'К событиям', en: 'Browse events' }}
      totalAmount={order?.total_amount}
      currency={order?.currency}
      whatsappSummary={summaryRu || summaryEn ? { ru: summaryRu, en: summaryEn } : undefined}
    />
  );
}
