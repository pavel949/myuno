import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untypedFrom = (table: string) => (supabase as any).from(table);

export interface PropertyPriceOffer {
  id: string;
  property_id: string;
  booking_id?: string | null;
  guest_user_id?: string | null;
  type: 'special_offer' | 'negotiation_request' | 'counter_offer';
  original_price: number;
  offered_price: number;
  discount_percent?: number | null;
  valid_from: string;
  valid_until: string;
  nights?: number | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'countered';
  created_by: string;
  responded_at?: string | null;
  response_message?: string | null;
  created_at: string;
}

export function usePropertyPriceOffers(propertyId?: string) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryKey = ['property_price_offers', propertyId];

  const { data: offers = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await untypedFrom('property_price_offers')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PropertyPriceOffer[];
    },
    enabled: !!propertyId,
  });

  const createMutation = useMutation({
    mutationFn: async (offer: Partial<PropertyPriceOffer>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await untypedFrom('property_price_offers')
        .insert({ ...offer, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(isRu ? 'Предложение создано' : 'Offer created');
    },
    onError: () => {
      toast.error(isRu ? 'Ошибка создания' : 'Failed to create offer');
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ offerId, status, message }: { offerId: string; status: string; message?: string }) => {
      const { error } = await untypedFrom('property_price_offers')
        .update({
          status,
          responded_at: new Date().toISOString(),
          response_message: message || null,
        })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(isRu ? 'Ответ отправлен' : 'Response sent');
    },
  });

  return {
    offers,
    isLoading,
    createOffer: createMutation.mutateAsync,
    respondToOffer: (offerId: string, status: string, message?: string) =>
      respondMutation.mutateAsync({ offerId, status, message }),
  };
}
