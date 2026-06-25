/**
 * Data hooks for the Currency Exchange Layer.
 *
 * - useReferenceRates: THB reference rates (from `currency_rates`, base THB),
 *   normalised to "1 <currency> = N THB".
 * - useExchangers: active money-changer listings, ranked featured → verified →
 *   rating, for the consumer comparison view.
 *
 * Reads are RLS-scoped; see the `currency_exchange_layer` migration.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exchangeTable } from './db';
import {
  EXCHANGE_CURRENCIES,
  type Exchanger,
  type ExchangeAffiliateConfig,
  type ExchangeCurrency,
  type ReferenceRate,
} from '@/types/exchange';

const FOREIGN = new Set<string>(EXCHANGE_CURRENCIES);

/** Rank: featured first, then verified, then by rating desc. */
function rankExchangers(rows: Exchanger[]): Exchanger[] {
  return [...rows].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

export function useReferenceRates() {
  return useQuery({
    queryKey: ['exchange-reference-rates'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReferenceRate[]> => {
      const { data, error } = await exchangeTable('currency_rates')
        .select('target_currency, rate, updated_at')
        .eq('base_currency', 'THB');
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        target_currency: string;
        rate: number;
        updated_at: string | null;
      }>;

      return rows
        .filter((r) => FOREIGN.has(r.target_currency) && Number(r.rate) > 0)
        .map((r) => ({
          currency: r.target_currency as ExchangeCurrency,
          // table stores foreign-per-THB; invert to THB-per-foreign-unit.
          thbPerUnit: 1 / Number(r.rate),
          updatedAt: r.updated_at,
        }))
        .sort(
          (a, b) =>
            EXCHANGE_CURRENCIES.indexOf(a.currency) -
            EXCHANGE_CURRENCIES.indexOf(b.currency),
        );
    },
  });
}

export function useExchangers() {
  return useQuery({
    queryKey: ['exchangers'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Exchanger[]> => {
      const { data, error } = await exchangeTable('exchangers')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return rankExchangers((data ?? []) as Exchanger[]);
    },
  });
}

/** Vendor self-serve: read + upsert the exchanger linked to a provider. */
export function useMyExchanger(providerId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-exchanger', providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<Exchanger | null> => {
      const { data, error } = await exchangeTable('exchangers')
        .select('*')
        .eq('provider_id', providerId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Exchanger | null;
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<Exchanger>): Promise<void> => {
      const payload = {
        ...patch,
        provider_id: providerId,
        rate_source: 'self_reported',
        rates_updated_at: patch.quoted_rates ? new Date().toISOString() : undefined,
      };
      const existingId = query.data?.id;
      if (existingId) {
        const { error } = await exchangeTable('exchangers').update(payload).eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await exchangeTable('exchangers').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-exchanger', providerId] });
      queryClient.invalidateQueries({ queryKey: ['exchangers'] });
    },
  });

  return { exchanger: query.data ?? null, isLoading: query.isLoading, save };
}

const EMPTY_AFFILIATE: ExchangeAffiliateConfig = { wise_url: '', crypto_onramp_url: '' };

export function useExchangeAffiliate() {
  return useQuery({
    queryKey: ['exchange-affiliate'],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<ExchangeAffiliateConfig> => {
      const { data, error } = await exchangeTable('system_settings')
        .select('value')
        .eq('key', 'exchange_affiliate')
        .maybeSingle();
      if (error) throw error;
      const value = (data as { value?: Partial<ExchangeAffiliateConfig> } | null)?.value;
      return { ...EMPTY_AFFILIATE, ...(value ?? {}) };
    },
  });
}
