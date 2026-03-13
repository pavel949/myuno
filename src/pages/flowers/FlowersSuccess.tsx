import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Package, ArrowRight, MapPin, Calendar, User, Gift } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { clearByType } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        // Find order by Stripe session ID in payment_intents
        const { data: pi } = await supabase
          .from('payment_intents')
          .select('order_id')
          .eq('provider_ref', sessionId)
          .limit(1)
          .maybeSingle();

        if (pi?.order_id) {
          // Fetch full order details
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

        // Retry with backoff
        attempts++;
        if (attempts < maxAttempts) {
          timer = setTimeout(pollOrder, 1500);
        } else {
          // Fallback: clear cart and show generic success
          clearByType('flowers');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Error polling order:', err);
        attempts++;
        if (attempts < maxAttempts) {
          timer = setTimeout(pollOrder, 2000);
        } else {
          setError(isRu ? 'Ошибка загрузки заказа' : 'Failed to load order details');
          setIsProcessing(false);
        }
      }
    };

    pollOrder();
    return () => clearTimeout(timer);
  }, [sessionId, clearByType, isRu]);

  if (isProcessing) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {isRu ? 'Обработка платежа...' : 'Processing payment...'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Package className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {isRu ? 'Что-то пошло не так' : 'Something went wrong'}
              </h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/bookings')} className="w-full">
                {isRu ? 'Проверить заказы' : 'Check Orders'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/flowers')} className="w-full">
                {isRu ? 'Вернуться к цветам' : 'Back to Flowers'}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const meta = order?.metadata || {};
  const statusColor = order?.status === 'confirmed' 
    ? 'bg-primary/10 text-primary' 
    : 'bg-muted text-muted-foreground';
  const statusLabel = order?.status === 'confirmed'
    ? (isRu ? 'Подтверждён' : 'Confirmed')
    : (isRu ? 'Ожидает' : 'Pending');

  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md w-full">
          {/* Success animation */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-500/20 animate-ping" />
          </div>

          {/* Message */}
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h1 className="text-2xl font-bold text-foreground">
              {isRu ? 'Оплата прошла успешно!' : 'Payment Successful!'}
            </h1>
            <p className="text-muted-foreground">
              {isRu 
                ? 'Ваш заказ цветов принят. Мы свяжемся с вами для подтверждения доставки.'
                : 'Your flower order has been placed. We will contact you to confirm delivery.'}
            </p>
          </div>

          {/* Order details card */}
          <div className="bg-card rounded-2xl border p-4 space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {/* Order number + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {order?.order_number || (isRu ? 'Заказ оформлен' : 'Order Placed')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order ? new Date(order.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
              {order && (
                <Badge variant="outline" className={statusColor}>
                  {statusLabel}
                </Badge>
              )}
            </div>

            {/* Items */}
            {order?.items && order.items.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product_name} × {item.qty}</span>
                    <span>฿{(item.unit_price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                  <span>{isRu ? 'Итого' : 'Total'}</span>
                  <span className="text-primary">฿{order.total_amount?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Delivery info */}
            {(meta.recipient_name || meta.delivery_address || meta.delivery_date) && (
              <div className="space-y-2 border-t pt-3">
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
                    <span>{isRu ? 'Праздничная упаковка' : 'Gift Wrap included'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button 
              onClick={() => navigate('/bookings')} 
              className="w-full gap-2"
            >
              {isRu ? 'Мои заказы' : 'My Orders'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/flowers')} 
              className="w-full"
            >
              {isRu ? 'Продолжить покупки' : 'Continue Shopping'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FlowersSuccess;
