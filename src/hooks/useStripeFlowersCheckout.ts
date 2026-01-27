import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface FlowersCheckoutParams {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_fee: number;
  gift_wrap_fee: number;
  total_amount: number;
  currency?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_date: string;
  delivery_slot: string;
  message?: string;
  gift_wrap: boolean;
  provider_id?: string;
  provider_name?: string;
}

export function useStripeFlowersCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { language } = useLanguage();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createFlowersCheckout = async (params: FlowersCheckoutParams): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      const response = await supabase.functions.invoke('create-flowers-checkout', {
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
      console.error('Error creating flowers checkout:', error);
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
    createFlowersCheckout,
    isProcessing,
  };
}
