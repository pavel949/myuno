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
      // Check if user is authenticated before calling the edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found');
        toast.error(
          language === 'ru' 
            ? 'Пожалуйста, войдите в аккаунт для оплаты картой' 
            : 'Please sign in to pay by card'
        );
        return false;
      }

      console.log('Creating flowers checkout with session:', session.user.id);
      
      const response = await supabase.functions.invoke('create-flowers-checkout', {
        body: params,
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        // Check for specific error types
        if (response.error.message?.includes('Unauthorized') || response.error.message?.includes('authorization')) {
          toast.error(
            language === 'ru' 
              ? 'Сессия истекла. Пожалуйста, войдите снова.' 
              : 'Session expired. Please sign in again.'
          );
        } else {
          toast.error(
            language === 'ru' 
              ? 'Ошибка при создании платежа' 
              : 'Error creating payment'
          );
        }
        return false;
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
