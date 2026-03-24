import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePropertyRental } from '@/hooks/useActivePropertyRental';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Json } from '@/integrations/supabase/types';

export interface ConciergeAdvanceRequest {
  orderId: string;
  orderNumber: string;
  orderType: string;
  baseAmount: number;
  currency: string;
  providerName: string;
  providerPhone?: string;
  deliveryDetails: Record<string, unknown>;
  clientPaymentPreference?: 'card' | 'crypto' | 'wire';
}

export interface ConciergeAdvanceResult {
  success: boolean;
  totalWithFee: number;
  conciergeFee: number;
  error?: string;
}

const CONCIERGE_FEE_PERCENT = 0.05; // 5%
const CONCIERGE_FEE_PERCENT_WAIVED = 0; // 0% for property guests

export function useConciergeAdvance() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const { hasActiveRental } = useActivePropertyRental();

  // 0% fee if user has active property rental through myUNO
  const effectiveFeePercent = hasActiveRental ? CONCIERGE_FEE_PERCENT_WAIVED : CONCIERGE_FEE_PERCENT;

  const calculateFee = useCallback((baseAmount: number) => {
    const fee = Math.round(baseAmount * effectiveFeePercent * 100) / 100;
    return {
      conciergeFee: fee,
      totalWithFee: baseAmount + fee,
    };
  }, [effectiveFeePercent]);

  const createAdvanceRequest = useCallback(async (
    params: ConciergeAdvanceRequest
  ): Promise<ConciergeAdvanceResult> => {
    if (!user) {
      return { 
        success: false, 
        totalWithFee: 0, 
        conciergeFee: 0,
        error: 'Not authenticated' 
      };
    }

    setIsProcessing(true);

    try {
      const { conciergeFee, totalWithFee } = calculateFee(params.baseAmount);

      // 1. Get current order metadata
      const { data: orderData } = await supabase
        .from('orders')
        .select('metadata')
        .eq('id', params.orderId)
        .single();

      const existingMetadata = (orderData?.metadata as Record<string, unknown>) || {};

      // 2. Update order status to pending_advance
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'pending_advance',
          concierge_fee_amount: conciergeFee,
          metadata: {
            ...existingMetadata,
            concierge_advance_requested: true,
            concierge_advance_requested_at: new Date().toISOString(),
            total_with_concierge_fee: totalWithFee,
            client_payment_preference: params.clientPaymentPreference || 'card',
          },
        })
        .eq('id', params.orderId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 3. Create consultation request for admin coordination
      const verticalMetadata: Json = {
        order_id: params.orderId,
        order_number: params.orderNumber,
        order_type: params.orderType,
        base_amount: params.baseAmount,
        concierge_fee: conciergeFee,
        total_client_pays: totalWithFee,
        provider_name: params.providerName,
        provider_phone: params.providerPhone || '',
        delivery_details: JSON.stringify(params.deliveryDetails),
        client_payment_preference: params.clientPaymentPreference || 'card',
      };

      const { error: consultationError } = await supabase
        .from('consultation_requests')
        .insert([{
          name: params.providerName,
          phone: params.providerPhone || '',
          vertical_id: 'concierge_advance',
          request_type: 'advance_payment',
          entry_point: `${params.orderType}_checkout`,
          vertical_metadata: verticalMetadata,
          status: 'new',
          priority: 'high',
          currency: params.currency,
          budget_min: params.baseAmount,
        }]);

      if (consultationError) {
        console.error('Failed to create consultation request:', consultationError);
        // Don't fail the whole request, just log it
      }

      // 4. Create notification for user
      await supabase.from('notifications').insert([{
        user_id: user.id,
        type: 'concierge_advance_requested',
        title: language === 'ru' ? 'Запрос на предоплату отправлен' : 'Advance Payment Request Submitted',
        body: language === 'ru'
          ? `Ваш запрос по заказу ${params.orderNumber} отправлен. Наша команда рассмотрит его в ближайшее время.`
          : `Your request for order ${params.orderNumber} has been submitted. Our team will review it shortly.`,
        data: {
          order_id: params.orderId,
          order_number: params.orderNumber,
          total_with_fee: totalWithFee,
        },
      }]);

      toast.success(
        language === 'ru' 
          ? 'Запрос на предоплату отправлен!' 
          : 'Advance payment request submitted!'
      );

      return {
        success: true,
        totalWithFee,
        conciergeFee,
      };
    } catch (error) {
      console.error('Error creating advance request:', error);
      toast.error(
        language === 'ru' 
          ? 'Ошибка при отправке запроса' 
          : 'Failed to submit request'
      );
      return {
        success: false,
        totalWithFee: 0,
        conciergeFee: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [user, language, calculateFee]);

  const navigateToAdvanceRequested = useCallback((
    orderNumber: string,
    baseAmount: number,
    orderType: string = 'flowers'
  ) => {
    const { conciergeFee, totalWithFee } = calculateFee(baseAmount);
    navigate('/booking/advance-requested', {
      state: {
        orderNumber,
        baseAmount,
        conciergeFee,
        totalWithFee,
        orderType,
      },
    });
  }, [navigate, calculateFee]);

  return {
    createAdvanceRequest,
    navigateToAdvanceRequested,
    calculateFee,
    isProcessing,
    feePercent: effectiveFeePercent * 100, // Return as percentage (5 or 0)
    hasActiveRental,
  };
}
