import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { typedFrom, type PropertyPriceOfferRow } from '@/lib/untypedTables';

export type PropertyPriceOffer = PropertyPriceOfferRow;

const from = () => typedFrom('property_price_offers');

export function usePropertyPriceOffers(propertyId?: string) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryKey = ['property_price_offers', propertyId];

  const { data: offers = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await from()
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

      const { error } = await from()
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
      const { error } = await from()
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
