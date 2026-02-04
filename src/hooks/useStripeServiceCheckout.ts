import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler, errorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useStripeServiceCheckout');

interface ServiceCheckoutParams {
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration_minutes?: number;
  }>;
  service_fee: number;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  provider_id: string;
  provider_name: string;
  notes?: string;
}

export function useStripeServiceCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createServiceCheckout = async (params: ServiceCheckoutParams): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        errorHandler.auth(new Error('No active session'), 'service_checkout');
        return false;
      }

      const response = await supabase.functions.invoke('create-service-checkout', {
        body: params,
      });

      if (response.error) {
        const isAuthError = response.error.message?.includes('Unauthorized') || 
                           response.error.message?.includes('authorization');
        
        if (isAuthError) {
          errorHandler.auth(response.error, 'service_checkout');
        } else {
          errorLog.error(response.error, 'invoke_function', {
            toastTitle: 'Payment Error',
            toastTitleRu: 'Ошибка платежа',
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
        errorLog.error(error, 'create_checkout');
      }
      return false;
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  return { createServiceCheckout, isProcessing };
}
