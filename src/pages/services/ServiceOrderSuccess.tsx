import { getServiceRequestConfirmationNote, serviceRequestConfirmationNote } from '@/lib/services/serviceRequestCopy';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Phone } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { useOrderReturnRead } from '@/hooks/useOrderReturnRead';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

export default function ServiceOrderSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sessionId = searchParams.get('session_id');
  const navState = (location.state as {
    functionName?: string;
    functionIcon?: string;
    orderId?: string;
    orderNumber?: string;
  } | null) || {};
  const { functionName, functionIcon, orderId: stateOrderId } = navState;

  const { order, confirmed, isLoading: loading, status } = useOrderReturnRead({ orderTypes: ['service'], orderId: stateOrderId, sessionId, legacySessionMetadata: true });

  const details = order ? (
    <div className="space-y-2 text-sm">
      {functionName && (
        <div className="flex items-center gap-2">
          {(() => { const Icon = resolveIcon(functionIcon); return <Icon className="w-4 h-4 text-muted-foreground shrink-0" />; })()}
          <span>{functionName}</span>
        </div>
      )}
      {order.metadata?.provider_name && (
        <div className="font-medium">{String(order.metadata.provider_name)}</div>
      )}
      <div className="font-semibold">
        {order.total_amount?.toLocaleString()} {order.currency}
      </div>
      {order.start_at && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{format(new Date(order.start_at), 'dd MMM yyyy, HH:mm')}</span>
        </div>
      )}
      {order.metadata?.address && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="line-clamp-2">{String(order.metadata.address)}</span>
        </div>
      )}
      {order.metadata?.contact_phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4 shrink-0" />
          <span>{String(order.metadata.contact_phone)}</span>
        </div>
      )}
    </div>
  ) : functionName ? (
    <div className="flex items-center gap-2 text-sm">
      {(() => { const Icon = resolveIcon(functionIcon); return <Icon className="w-4 h-4 text-muted-foreground" />; })()}
      <span>{functionName}</span>
    </div>
  ) : null;

  const serviceLabel = order?.metadata?.provider_name || functionName;
  const whenStr = order?.start_at ? format(new Date(order.start_at), 'dd MMM yyyy, HH:mm') : '';
  const summaryRu = [serviceLabel && `Услуга: ${serviceLabel}`, whenStr && `Время: ${whenStr}`]
    .filter(Boolean).join(' · ');
  const summaryEn = [serviceLabel && `Service: ${serviceLabel}`, whenStr && `When: ${whenStr}`]
    .filter(Boolean).join(' · ');

  return (
    <UnifiedSuccessLayout
      isLoading={loading}
      status={status}
      hideWhatsApp={!order}
      orderNumber={order?.order_number || undefined}
      note={{
        ru: serviceRequestConfirmationNote.ru,
        en: getServiceRequestConfirmationNote(language),
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="service" /> : undefined}
      primaryHref={confirmed ? '/services' : '/bookings'}
      primaryLabel={confirmed ? { ru: 'Заказать ещё', en: 'Order more' } : { ru: 'Мои заказы', en: 'My orders' }}
      secondaryHref={confirmed ? '/bookings' : '/services'}
      secondaryLabel={confirmed ? { ru: 'Мои заказы', en: 'My orders' } : { ru: 'Вернуться в каталог', en: 'Back to catalog' }}
      totalAmount={order?.total_amount}
      currency={order?.currency || undefined}
      whatsappSummary={summaryRu || summaryEn ? { ru: summaryRu, en: summaryEn } : undefined}
    />
  );
}
