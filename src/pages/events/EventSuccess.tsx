import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function EventSuccess() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, currency, metadata, created_at')
        .eq('id', orderId)
        .single();

      if (data) {
        setOrder(data as OrderData);
        if (data.status === 'confirmed' || pollCount >= 10) setLoading(false);
        else setPollCount(c => c + 1);
      } else if (pollCount >= 10) {
        setLoading(false);
      } else {
        setPollCount(c => c + 1);
      }
    };

    const timer = setTimeout(fetchOrder, pollCount === 0 ? 500 : 2000);
    return () => clearTimeout(timer);
  }, [orderId, pollCount]);

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
        <span>{formatPrice(order.total_amount)}</span>
      </div>
    </div>
  ) : null;

  return (
    <UnifiedSuccessLayout
      isLoading={loading}
      orderNumber={order?.order_number}
      note={{
        ru: 'Билеты подтверждены. Детали отправлены на email.',
        en: 'Tickets confirmed. Details sent to your email.',
      }}
      details={details}
      extras={<CrossSellRecommendations orderType="event" />}
      primaryHref="/orders"
      secondaryHref="/events"
      secondaryLabel={{ ru: 'К событиям', en: 'Browse events' }}
    />
  );
}
