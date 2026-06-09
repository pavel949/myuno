import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, MapPin, Calendar, User, Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  items: Array<{
    product_name: string;
    qty: number;
    unit_price: number;
  }>;
}

const FlowersSuccess = () => {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { clearByType } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const isRu = language === 'ru';

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    let timer: ReturnType<typeof setTimeout>;

    const pollOrder = async () => {
      if (!sessionId) {
        setIsProcessing(false);
        return;
      }

      try {
        const { data: pi } = await supabase
          .from('payment_intents')
          .select('order_id')
          .eq('provider_ref', sessionId)
          .limit(1)
          .maybeSingle();

        if (pi?.order_id) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('id, order_number, status, total_amount, currency, metadata, created_at')
            .eq('id', pi.order_id)
            .single();

          const { data: itemsData } = await supabase
            .from('order_items')
            .select('item_name, qty, unit_price')
            .eq('order_id', pi.order_id);

          if (orderData) {
            setOrder({
              ...orderData,
              metadata: (orderData.metadata as Record<string, unknown>) || {},
              items: (itemsData || []).map(i => ({ product_name: i.item_name, qty: i.qty ?? 1, unit_price: i.unit_price })),
            });
            clearByType('flowers');
            setIsProcessing(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          timer = setTimeout(pollOrder, 1500);
        } else {
          clearByType('flowers');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Error polling order:', err);
        attempts++;
        if (attempts < maxAttempts) {
          timer = setTimeout(pollOrder, 2000);
        } else {
          setIsProcessing(false);
        }
      }
    };

    pollOrder();
    return () => clearTimeout(timer);
  }, [sessionId, clearByType, isRu]);

  const meta = order?.metadata || {};
  const statusLabel = order?.status === 'confirmed'
    ? (isRu ? 'Подтверждён' : 'Confirmed')
    : (isRu ? 'Ожидает' : 'Pending');

  const details = order ? (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {order.order_number || (isRu ? 'Заказ оформлен' : 'Order placed')}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
      </div>

      {order.items?.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.product_name} × {item.qty}</span>
              <span>฿{(item.unit_price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-sm pt-2 border-t border-border">
            <span>{isRu ? 'Итого' : 'Total'}</span>
            <span>฿{order.total_amount?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {(meta.recipient_name || meta.delivery_address || meta.delivery_date) && (
        <div className="space-y-2 border-t border-border pt-3">
          {meta.recipient_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{meta.recipient_name as string}</span>
            </div>
          )}
          {meta.delivery_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{meta.delivery_address as string}</span>
            </div>
          )}
          {meta.delivery_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{meta.delivery_date as string}{meta.delivery_slot ? ` · ${meta.delivery_slot}` : ''}</span>
            </div>
          )}
          {meta.gift_wrap && (
            <div className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{isRu ? 'Праздничная упаковка' : 'Gift wrap included'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <UnifiedSuccessLayout
      isLoading={isProcessing}
      orderNumber={order?.order_number}
      note={{
        ru: 'Заказ принят. Мы свяжемся для подтверждения доставки.',
        en: 'Order received. We will contact you to confirm delivery.',
      }}
      details={details}
      extras={<CrossSellRecommendations orderType="flowers" />}
      primaryHref="/bookings"
      secondaryHref="/flowers"
      totalAmount={order?.total_amount}
      currency={order?.currency}
      whatsappSummary={
        order
          ? {
              ru: `Цветы · ${order.items?.length ?? 0} поз.${meta.delivery_date ? ` · доставка ${meta.delivery_date as string}` : ''}`,
              en: `Flowers · ${order.items?.length ?? 0} item(s)${meta.delivery_date ? ` · delivery ${meta.delivery_date as string}` : ''}`,
            }
          : undefined
      }
    />
  );
};

export default FlowersSuccess;
