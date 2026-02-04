import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler, errorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useStripeMarketCheckout');

interface MarketCheckoutParams {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_fee: number;
  total_amount: number;
  currency?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_type: 'local' | 'international';
  shipping_zone?: string;
  store_id?: string;
  store_name?: string;
}

export function useStripeMarketCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createMarketCheckout = async (params: MarketCheckoutParams): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        errorHandler.auth(new Error('No active session'), 'market_checkout');
        return false;
      }

      const response = await supabase.functions.invoke('create-market-checkout', {
        body: params,
      });

      if (response.error) {
        const isAuthError = response.error.message?.includes('Unauthorized') || 
                           response.error.message?.includes('authorization');
        
        if (isAuthError) {
          errorHandler.auth(response.error, 'market_checkout');
        } else {
          errorLog.error(response.error, 'invoke_function', {
            toastTitle: 'Payment Error',
            toastTitleRu: 'Ошибка платежа',
            toastDescription: 'Error creating payment',
            toastDescriptionRu: 'Ошибка при создании платежа',
          });
        }
        return false;
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
        return true;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      if (isMountedRef.current) {
        errorLog.error(error, 'create_checkout', {
          toastTitle: 'Payment Error',
          toastTitleRu: 'Ошибка платежа',
          toastDescription: 'Error creating payment',
          toastDescriptionRu: 'Ошибка при создании платежа',
        });
      }
      return false;
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  return {
    createMarketCheckout,
    isProcessing,
  };
}
