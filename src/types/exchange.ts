/**
 * Currency Exchange Layer — shared types & constants.
 *
 * `exchangers` is NOT yet in the auto-generated `src/integrations/supabase/types.ts`
 * (regenerate via Supabase MCP after the migration is applied to prod). Until then,
 * queries cast at the supabase boundary through `src/hooks/exchange/db.ts`.
 * Do NOT hand-edit the generated types file.
 */

/** Foreign currencies quoted against THB across the exchange UI. */
export type ExchangeCurrency = 'USD' | 'EUR' | 'RUB' | 'GBP' | 'CNY';

export const EXCHANGE_CURRENCIES: readonly ExchangeCurrency[] = [
  'USD',
  'EUR',
  'RUB',
  'GBP',
  'CNY',
] as const;

export const CURRENCY_LABELS: Record<ExchangeCurrency, { en: string; ru: string }> = {
  USD: { en: 'US Dollar', ru: 'Доллар США' },
  EUR: { en: 'Euro', ru: 'Евро' },
  RUB: { en: 'Russian Ruble', ru: 'Российский рубль' },
  GBP: { en: 'British Pound', ru: 'Британский фунт' },
  CNY: { en: 'Chinese Yuan', ru: 'Китайский юань' },
};

export type ExchangerRateSource = 'self_reported' | 'admin' | 'api';
export type ExchangerTier = 'free' | 'verified' | 'featured';

/** One money-changer listing (public.exchangers). */
export interface Exchanger {
  id: string;
  provider_id: string | null;
  name: string;
  name_ru: string | null;
  name_th: string | null;
  area: string | null;
  area_ru: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  logo_url: string | null;
  hours: string | null;
  rating: number | null;
  /** Buy rate per currency: THB the customer receives per 1 foreign unit. */
  quoted_rates: Partial<Record<ExchangeCurrency, number>>;
  rates_updated_at: string | null;
  rate_source: ExchangerRateSource;
  subscription_tier: ExchangerTier;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Reference THB rate for one currency, normalised so the UI can show
 * "1 <currency> = N THB" directly.
 */
export interface ReferenceRate {
  currency: ExchangeCurrency;
  /** THB per 1 unit of the foreign currency (e.g. 1 USD = 34.5 THB). */
  thbPerUnit: number;
  updatedAt: string | null;
}

export interface ExchangeAffiliateConfig {
  wise_url: string;
  crypto_onramp_url: string;
}
