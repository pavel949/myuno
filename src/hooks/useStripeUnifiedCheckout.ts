import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler, errorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useStripeUnifiedCheckout');

/**
 * Unified Stripe checkout hook — replaces useStripeCheckout, useStripeFlowersCheckout,
 * useStripeMarketCheckout, and useStripeServiceCheckout.
 *
 * Usage:
 *   const { createCheckout, isProcessing } = useStripeUnifiedCheckout();
 *   await createCheckout('create-flowers-checkout', { items, total_amount, ... });
 */
export function useStripeUnifiedCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createCheckout = async (
    functionName: string,
    params: Record<string, unknown>,
    options?: { requireAuth?: boolean }
  ): Promise<boolean> => {
    const requireAuth = options?.requireAuth ?? true;
    setIsProcessing(true);

    try {
      if (requireAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          errorHandler.auth(new Error('No active session'), functionName);
          return false;
        }
      }

      const response = await supabase.functions.invoke(functionName, {
        body: params,
      });

      if (response.error) {
        const isAuthError = response.error.message?.includes('Unauthorized') ||
                            response.error.message?.includes('authorization');
        if (isAuthError) {
          errorHandler.auth(response.error, functionName);
        } else {
          errorLog.error(response.error, `invoke_${functionName}`, {
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
        errorLog.error(error, `create_checkout_${functionName}`, {
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

  return { createCheckout, isProcessing };
}
