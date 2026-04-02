import { useStripeUnifiedCheckout } from './useStripeUnifiedCheckout';

export type WellnessVertical = 'beauty' | 'fitness' | 'medical';

interface WellnessItem {
  id: string;
  name: string;
  price: number;
  duration_minutes?: number;
}

interface WellnessCheckoutParams {
  vertical: WellnessVertical;
  items: WellnessItem[];
  totalAmount: number;
  scheduledAt: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  providerId?: string;
  providerName?: string;
  notes?: string;
}

export function useWellnessCheckout() {
  const { createCheckout, isProcessing } = useStripeUnifiedCheckout();

  const createWellnessCheckout = async (params: WellnessCheckoutParams): Promise<boolean> => {
    return createCheckout('create-wellness-checkout', {
      vertical: params.vertical,
      items: params.items,
      total_amount: params.totalAmount,
      scheduled_at: params.scheduledAt,
      contact_name: params.contactName,
      contact_phone: params.contactPhone,
      contact_email: params.contactEmail,
      provider_id: params.providerId,
      provider_name: params.providerName,
      notes: params.notes,
    });
  };

  return { createWellnessCheckout, isProcessing };
}
