import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, ArrowRight, Loader2, Calendar, MapPin, Phone } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const sessionId = searchParams.get('session_id');
  const { functionName, functionIcon } = location.state || {};

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;

    let attempts = 0;
    const maxAttempts = 10;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, currency, status, start_at, metadata')
        .eq('order_type', 'service')
        .filter('metadata->>stripe_session_id', 'eq', sessionId)
        .maybeSingle();

      if (data) {
        setOrder(data as unknown as OrderData);
        setLoading(false);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(fetchOrder, 2000);
      } else {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              {loading ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              )}
            </motion.div>
            
            {/* Title */}
            <h1 className="text-xl font-bold mb-2">
              {loading
                ? (isRu ? 'Обработка платежа...' : 'Processing payment...')
                : (isRu ? 'Оплата подтверждена!' : 'Payment Confirmed!')}
            </h1>

            {/* Order number */}
            {order?.order_number && (
              <p className="text-sm text-muted-foreground mb-4">
                {isRu ? 'Заказ' : 'Order'} #{order.order_number}
              </p>
            )}
            
            {/* Service info from navigation state */}
            {functionName && !order && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {(() => { const Icon = resolveIcon(functionIcon); return <Icon className="w-6 h-6 text-primary" />; })()}
                <span className="text-muted-foreground">{functionName}</span>
              </div>
            )}

            {/* Real order details */}
            {order && (
              <div className="bg-muted/50 rounded-lg p-4 text-left mb-4 space-y-2">
                {order.metadata?.provider_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{order.metadata.provider_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {order.total_amount.toLocaleString()} {order.currency}
                  </span>
                </div>
                {order.start_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(order.start_at), 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                )}
                {order.metadata?.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-2">{order.metadata.address}</span>
                  </div>
                )}
                {order.metadata?.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{order.metadata.contact_phone}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Message */}
            <p className="text-muted-foreground mb-6">
              {isRu 
                ? 'Наш менеджер свяжется с вами в течение 30 минут для подтверждения заказа и согласования деталей.' 
                : 'Our manager will contact you within 30 minutes to confirm your order and discuss details.'}
            </p>
            
            {/* What's next */}
            <div className="bg-muted/50 rounded-lg p-4 text-left mb-6">
              <p className="text-sm font-medium mb-2">
                {isRu ? 'Что дальше:' : 'What happens next:'}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  {isRu 
                    ? 'Мы свяжемся для уточнения деталей'
                    : 'We will call to confirm details'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  {isRu 
                    ? 'Назначим мастера на удобное время'
                    : 'Assign a specialist for your preferred time'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  {isRu 
                    ? 'Мастер приедет и выполнит работу'
                    : 'Specialist arrives and completes the job'}
                </li>
              </ul>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/services')} 
                className="w-full"
              >
                {isRu ? 'Заказать ещё' : 'Order More'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                {isRu ? 'На главную' : 'Back to Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}