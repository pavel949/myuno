import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Ticket, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';

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
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
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
        if (data.status === 'confirmed' || pollCount >= 10) {
          setLoading(false);
        } else {
          setPollCount(c => c + 1);
        }
      } else if (pollCount >= 10) {
        setLoading(false);
      } else {
        setPollCount(c => c + 1);
      }
    };

    const timer = setTimeout(fetchOrder, pollCount === 0 ? 500 : 2000);
    return () => clearTimeout(timer);
  }, [orderId, pollCount]);

  const meta = order?.metadata || {} as Record<string, unknown>;
  const isConfirmed = order?.status === 'confirmed';

  return (
    <AppLayout>
      <PageContainer className="flex flex-col items-center py-8 min-h-[70vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {isRu ? 'Подтверждаем оплату...' : 'Confirming payment...'}
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            {/* Status */}
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isConfirmed ? 'bg-green-100 dark:bg-green-950/40' : 'bg-yellow-100 dark:bg-yellow-950/40'}`}>
                {isConfirmed
                  ? <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  : <Ticket className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                }
              </div>
              <h1 className="text-2xl font-display font-bold">
                {isConfirmed
                  ? (isRu ? 'Билеты подтверждены!' : 'Tickets Confirmed!')
                  : (isRu ? 'Обрабатываем оплату' : 'Processing Payment')
                }
              </h1>
              <Badge variant={isConfirmed ? 'default' : 'secondary'}>
                {isConfirmed ? (isRu ? 'Подтверждено' : 'Confirmed') : (isRu ? 'Ожидание' : 'Pending')}
              </Badge>
            </div>

            {/* Order details */}
            {order && (
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{isRu ? 'Заказ' : 'Order'}</span>
                    <span className="font-mono font-semibold">#{order.order_number}</span>
                  </div>

                  {meta.event_title && (
                    <div className="flex items-start gap-3">
                      <Ticket className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{String(meta.event_title)}</p>
                        {meta.ticket_count && (
                          <p className="text-xs text-muted-foreground">
                            × {String(meta.ticket_count)} {isRu ? 'билет(ов)' : 'ticket(s)'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {meta.event_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm">
                        {String(meta.event_date)}{meta.event_time ? ` · ${String(meta.event_time)}` : ''}
                      </span>
                    </div>
                  )}

                  {meta.contact_name && (
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm">{String(meta.contact_name)}</span>
                    </div>
                  )}

                  {meta.pickup_hotel && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm">
                        {String(meta.pickup_hotel)}{meta.pickup_room ? `, ${isRu ? 'ком.' : 'rm.'} ${String(meta.pickup_room)}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border flex justify-between">
                    <span className="font-semibold">{isRu ? 'Итого' : 'Total'}</span>
                    <span className="font-bold text-primary">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <CrossSellRecommendations orderType="event" className="mt-4" />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/orders')} className="w-full">
                {isRu ? 'Мои заказы' : 'My Orders'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/events')} className="w-full">
                {isRu ? 'К событиям' : 'Browse Events'}
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
