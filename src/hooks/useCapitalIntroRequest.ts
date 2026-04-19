import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export type CapitalRequestType =
  | 'intro_to_listing'
  | 'pitch_submission'
  | 'capital_advisory'
  | 'represent_interests'
  | 'industry_consultation';

export type CapitalRangeBand = '<5M' | '5-20M' | '20-100M' | '100M+';

export type CapitalTimeline = 'now' | '1-3m' | '3-6m' | '6-12m';

export interface CapitalIntroInput {
  request_type: CapitalRequestType;
  listing_id?: string;
  project_id?: string;
  asset_class?: string;
  capital_range_thb?: CapitalRangeBand;
  timeline?: CapitalTimeline;
  background?: string;
  message?: string;
  estimated_deal_size_thb?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  source_route?: string;
}

const RANGE_TO_ESTIMATED_THB: Record<CapitalRangeBand, number> = {
  '<5M': 3_000_000,
  '5-20M': 12_500_000,
  '20-100M': 60_000_000,
  '100M+': 200_000_000,
};

export function useCapitalIntroRequest() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return useMutation({
    mutationFn: async (input: CapitalIntroInput) => {
      const estimated =
        input.estimated_deal_size_thb ??
        (input.capital_range_thb ? RANGE_TO_ESTIMATED_THB[input.capital_range_thb] : null);

      const payload = {
        user_id: user?.id ?? null,
        guest_email: input.guest_email ?? null,
        guest_phone: input.guest_phone ?? null,
        guest_name: input.guest_name ?? null,
        request_type: input.request_type,
        listing_id: input.listing_id ?? null,
        project_id: input.project_id ?? null,
        asset_class: input.asset_class ?? null,
        capital_range_thb: input.capital_range_thb ?? null,
        timeline: input.timeline ?? null,
        background: input.background ?? null,
        message: input.message ?? null,
        estimated_deal_size_thb: estimated,
        source_route: input.source_route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
        preferred_language: language,
        status: 'new' as const,
      };

      const { data, error } = await supabase
        .from('capital_intro_requests')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      // Fire & forget admin notification (re-uses generic admin order notifier)
      supabase.functions
        .invoke('notify-admin-order', {
          body: {
            order_id: data.id,
            order_number: `CAPITAL-${data.id.slice(0, 8).toUpperCase()}`,
            order_type: `capital:${input.request_type}`,
            total_amount: estimated ?? 0,
            currency: 'THB',
            customer_name: input.guest_name ?? user?.email ?? 'Anonymous',
            customer_email: input.guest_email ?? user?.email,
            customer_phone: input.guest_phone,
            notes: input.message ?? input.background ?? null,
          },
        })
        .catch(() => undefined);

      return data;
    },
    onSuccess: () => {
      toast.success(
        isRu
          ? 'Заявка отправлена! Мы свяжемся в ближайшее время.'
          : 'Request submitted! We will reach out shortly.',
      );
    },
    onError: () => {
      toast.error(
        isRu ? 'Не удалось отправить заявку. Попробуйте ещё раз.' : 'Failed to submit. Please try again.',
      );
    },
  });
}
