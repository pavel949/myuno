import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface CheckoutItem {
  name: string;
  quantity: number;
  price: number;
}

interface CreateRestaurantCheckoutParams {
  booking_type: 'table_reservation' | 'food_delivery' | 'set_menu';
  restaurant_id: string;
  restaurant_name: string;
  amount: number;
  currency?: string;
  items?: CheckoutItem[];
  metadata?: Record<string, string>;
}

export function useStripeCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { language } = useLanguage();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createRestaurantCheckout = async (params: CreateRestaurantCheckoutParams): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      const response = await supabase.functions.invoke('create-restaurant-checkout', {
        body: params,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
        return true;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      if (isMountedRef.current) {
        toast.error(
          language === 'ru' 
            ? 'Ошибка при создании платежа' 
            : 'Error creating payment'
        );
      }
      return false;
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  return {
    createRestaurantCheckout,
    isProcessing,
  };
}
