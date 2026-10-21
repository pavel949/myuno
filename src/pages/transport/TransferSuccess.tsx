import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plane, MapPin, Clock, User } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrderReturnRead } from '@/hooks/useOrderReturnRead';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

export default function TransferSuccess() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const orderId = searchParams.get('order_id');
  const { order, confirmed, isLoading, status } = useOrderReturnRead({ orderTypes: ['transfer', 'vehicle'], orderId, sessionId: searchParams.get('session_id'), children: 'transfer' });

  const isRu = language === 'ru';
  const metadata = order?.metadata || {};
  const pickupAddress = order?.order_addresses?.find(a => a.address_type === 'pickup')?.address_text;
  const dropoffAddress = order?.order_addresses?.find(a => a.address_type === 'dropoff')?.address_text;
  const flightNumber = metadata.flight_number as string | undefined;
  const meetingSignName = metadata.meeting_sign_name as string | undefined;
  // All transfers happen in Phuket — always display Asia/Bangkok local time,
  // regardless of the customer's device timezone.
  const TZ = 'Asia/Bangkok';
  const localeTag = isRu ? 'ru-RU' : 'en-GB';
  const scheduledDate = order?.start_at
    ? new Date(order.start_at).toLocaleDateString(localeTag, { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const scheduledTime = order?.start_at
    ? new Date(order.start_at).toLocaleTimeString(localeTag, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) + ' (Phuket)'
    : '';

  const details = order ? (
    <div className="space-y-3 text-left">
      {flightNumber && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{isRu ? 'Рейс' : 'Flight'}</span>
          <span className="font-medium">{flightNumber}</span>
        </div>
      )}
      {scheduledDate && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{isRu ? 'Дата' : 'Date'}</span>
          <span className="font-medium">{scheduledDate}</span>
        </div>
      )}

      <div className="border-t border-border pt-3 space-y-3">
        {meetingSignName && (
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{isRu ? 'Имя на табличке' : 'Name on sign'}</p>
              <p className="text-sm font-medium">{meetingSignName}</p>
            </div>
          </div>
        )}
        {pickupAddress && (
          <div className="flex items-center gap-3">
            <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{isRu ? 'Откуда' : 'From'}</p>
              <p className="text-sm font-medium truncate">{pickupAddress}</p>
            </div>
          </div>
        )}
        {dropoffAddress && (
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{isRu ? 'Куда' : 'To'}</p>
              <p className="text-sm font-medium truncate">{dropoffAddress}</p>
            </div>
          </div>
        )}
        {scheduledTime && (
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'Время' : 'Time'}</p>
              <p className="text-sm font-medium">{scheduledTime}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const routeStr = [pickupAddress, dropoffAddress].filter(Boolean).join(' → ');
  const whenStr = [scheduledDate, scheduledTime].filter(Boolean).join(' ');
  const summaryRu = [
    flightNumber && `Рейс ${flightNumber}`,
    whenStr && `Когда: ${whenStr}`,
    routeStr && `Маршрут: ${routeStr}`,
  ].filter(Boolean).join('\n');
  const summaryEn = [
    flightNumber && `Flight ${flightNumber}`,
    whenStr && `When: ${whenStr}`,
    routeStr && `Route: ${routeStr}`,
  ].filter(Boolean).join('\n');

  return (
    <UnifiedSuccessLayout
      isLoading={isLoading}
      status={status}
      hideWhatsApp={!order}
      orderNumber={order?.order_number}
      note={{
        ru: 'Место встречи и водитель требуют отдельного подтверждения в деталях заказа.',
        en: 'Meeting arrangements and driver assignment require separate confirmation in your order details.',
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="transport" /> : undefined}
      primaryHref={APP_ROUTES.BOOKINGS}
      secondaryHref={APP_ROUTES.TRANSPORT}
      totalAmount={order?.total_amount}
      currency={order?.currency}
      whatsappSummary={summaryRu || summaryEn ? { ru: summaryRu, en: summaryEn } : undefined}
    />
  );
}
