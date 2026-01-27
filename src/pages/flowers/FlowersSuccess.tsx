import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Package, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const FlowersSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { clearByType } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId || !user) {
        setIsProcessing(false);
        return;
      }

      try {
        // Verify session and create order via webhook (or check if already processed)
        // For now, we'll just mark as successful since Stripe webhook handles order creation
        
        // Clear the cart
        clearByType('flowers');
        
        setOrderCreated(true);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError(language === 'ru' ? 'Ошибка обработки платежа' : 'Payment processing error');
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [sessionId, user, clearByType, language]);

  if (isProcessing) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Обработка платежа...' : 'Processing payment...'}
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
                {language === 'ru' ? 'Что-то пошло не так' : 'Something went wrong'}
              </h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/bookings')} className="w-full">
                {language === 'ru' ? 'Проверить заказы' : 'Check Orders'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/flowers')} className="w-full">
                {language === 'ru' ? 'Вернуться к цветам' : 'Back to Flowers'}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
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
              {language === 'ru' ? 'Оплата прошла успешно!' : 'Payment Successful!'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ru' 
                ? 'Ваш заказ цветов принят. Мы свяжемся с вами для подтверждения доставки.'
                : 'Your flower order has been placed. We will contact you to confirm delivery.'}
            </p>
          </div>

          {/* Order info */}
          <div className="bg-card rounded-2xl border p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">
                  {language === 'ru' ? 'Заказ оформлен' : 'Order Placed'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Ожидает подтверждения' : 'Awaiting confirmation'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button 
              onClick={() => navigate('/bookings')} 
              className="w-full gap-2"
            >
              {language === 'ru' ? 'Мои заказы' : 'My Orders'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/flowers')} 
              className="w-full"
            >
              {language === 'ru' ? 'Продолжить покупки' : 'Continue Shopping'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FlowersSuccess;
