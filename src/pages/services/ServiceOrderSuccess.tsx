import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Phone } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

interface OrderData {
  id: string;
  order_number: string | null;
  total_amount: number;
  currency: string | null;
  status: string | null;
  start_at: string | null;
  metadata: {
    provider_name?: string;
    address?: string;
    contact_name?: string;
    contact_phone?: string;
    stripe_session_id?: string;
  } | null;
}

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

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(!!(sessionId || stateOrderId));

  useEffect(() => {
    if (!sessionId && !stateOrderId) return;
    let attempts = 0;
    const maxAttempts = 10;

    const fetchOrder = async () => {
      const baseSelect = 'id, order_number, total_amount, currency, status, start_at, metadata';
      let query = supabase.from('orders').select(baseSelect).eq('order_type', 'service');
      query = stateOrderId
        ? query.eq('id', stateOrderId)
        : query.filter('metadata->>stripe_session_id', 'eq', sessionId!);
      const { data } = await query.maybeSingle();

      if (data) {
        setOrder(data as unknown as OrderData);
        setLoading(false);
      } else if (++attempts < maxAttempts) {
        setTimeout(fetchOrder, 2000);
      } else {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId, stateOrderId]);

  const details = order ? (
    <div className="space-y-2 text-sm">
      {functionName && (
        <div className="flex items-center gap-2">
          {(() => { const Icon = resolveIcon(functionIcon); return <Icon className="w-4 h-4 text-muted-foreground shrink-0" />; })()}
          <span>{functionName}</span>
        </div>
      )}
      {order.metadata?.provider_name && (
        <div className="font-medium">{order.metadata.provider_name}</div>
      )}
      <div className="font-semibold">
        {order.total_amount.toLocaleString()} {order.currency}
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
          <span className="line-clamp-2">{order.metadata.address}</span>
        </div>
      )}
      {order.metadata?.contact_phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4 shrink-0" />
          <span>{order.metadata.contact_phone}</span>
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
      orderNumber={order?.order_number || undefined}
      note={{
        ru: 'Менеджер свяжется в течение 30 минут для подтверждения деталей.',
        en: 'A manager will contact you within 30 minutes to confirm details.',
      }}
      details={details}
      extras={<CrossSellRecommendations orderType="service" />}
      primaryHref="/services"
      primaryLabel={{ ru: 'Заказать ещё', en: 'Order more' }}
      secondaryHref="/bookings"
      secondaryLabel={{ ru: 'Мои заказы', en: 'My orders' }}
      totalAmount={order?.total_amount}
      currency={order?.currency || undefined}
      whatsappSummary={summaryRu || summaryEn ? { ru: summaryRu, en: summaryEn } : undefined}
    />
  );
}
