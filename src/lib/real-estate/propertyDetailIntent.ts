import { APP_ROUTES } from '@/lib/config/routes';

export const PUBLIC_RENT_ELIGIBILITY = 'listing_type.eq.rent,listing_modes.cs.{rent}';
export const PUBLIC_SALE_ELIGIBILITY = 'is_for_sale.eq.true,listing_type.eq.sale,listing_modes.cs.{sale}';
// Legacy price belongs to the sale only when this is explicitly a sale listing.
export const PUBLIC_SALE_PRICE_ELIGIBILITY = 'sale_price.gt.0,and(listing_type.eq.sale,sale_price.is.null,price.gt.0,or(listing_modes.is.null,listing_modes.not.cs.{rent}))';

export interface PropertyIntentFields {
  listing_type?: string | null;
  listing_modes?: string[] | null;
  is_for_sale?: boolean | null;
}

export function propertySupportsMode(property: PropertyIntentFields, mode: 'rent' | 'buy'): boolean {
  return mode === 'rent'
    ? property.listing_type === 'rent' || !!property.listing_modes?.includes('rent')
    : property.listing_type === 'sale' || property.is_for_sale === true || !!property.listing_modes?.includes('sale');
}

/** URL intent chooses between supported offers; it never makes a property eligible. */
export function propertyDetailMode(property: PropertyIntentFields, requested?: string | null): 'rent' | 'buy' {
  const canRent = propertySupportsMode(property, 'rent');
  const canBuy = propertySupportsMode(property, 'buy');
  if (requested === 'rent' && canRent) return 'rent';
  if (requested === 'buy' && canBuy) return 'buy';
  return canBuy ? 'buy' : 'rent';
}

/** Carry only relevant guest context; leave router history/back behavior intact. */
function withGuestContext(href: string, mode: 'rent' | 'buy', search = ''): string {
  const source = new URLSearchParams(search);
  const params = new URLSearchParams({ mode });
  for (const key of ['checkIn', 'checkOut', 'guests', 'tenancy', 'intent']) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  return `${href}?${params.toString()}`;
}

/** A rental amount is never a sale-price fallback for a dual-listed unit. */
export function propertySaleAskingPrice(property: PropertyIntentFields & { sale_price?: number | null; price?: number | null }): number | null {
  const legacySaleOnly = property.listing_type === 'sale' && !property.listing_modes?.includes('rent');
  const amount = property.sale_price ?? (legacySaleOnly ? property.price : null);
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : null;
}

export interface PropertyRentalRateSource {
  price?: number | null; price_period?: string | null; currency?: string | null;
  price_per_night?: number | null; price_per_month?: number | null; price_per_year?: number | null;
}
export type RentalRatePeriod = 'night' | 'week' | 'month' | 'year' | 'total';
export interface PropertyRentalRate { amount: number; period: RentalRatePeriod }
const rentalPeriods: RentalRatePeriod[] = ['night', 'week', 'month', 'year', 'total'];
const rentalPeriodAliases: Record<string, RentalRatePeriod> = {
  day: 'night', daily: 'night', night: 'night', nightly: 'night', week: 'week', weekly: 'week',
  month: 'month', monthly: 'month', year: 'year', yearly: 'year', annual: 'year', total: 'total',
};
const positiveRentalAmount = (value?: number | null) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
/** Recorded tariffs only: periods never imply a conversion or an offer. Conflicting same-period sources fail closed. */
export function propertyRentalRateOptions(property: PropertyRentalRateSource, terms?: { price_per_night?: number | null; currency?: string | null } | null) {
  const amounts = new Map<RentalRatePeriod, number>();
  const conflicts = new Set<RentalRatePeriod>();
  const add = (period: RentalRatePeriod, value?: number | null) => {
    const amount = positiveRentalAmount(value);
    if (amount === null) return;
    if (amounts.has(period) && amounts.get(period) !== amount) conflicts.add(period);
    else amounts.set(period, amount);
  };
  const rawPeriod = property.price_period?.trim().toLowerCase();
  const declaredPeriod = rawPeriod && Object.prototype.hasOwnProperty.call(rentalPeriodAliases, rawPeriod) ? rentalPeriodAliases[rawPeriod] : undefined;
  if (declaredPeriod) add(declaredPeriod, property.price);
  add('night', property.price_per_night);
  add('month', property.price_per_month);
  add('year', property.price_per_year);
  add('night', terms?.price_per_night);
  if (positiveRentalAmount(terms?.price_per_night) !== null && terms?.currency?.trim() && terms.currency.trim().toUpperCase() !== property.currency?.trim().toUpperCase()) conflicts.add('night');
  const unknownPeriod = !!rawPeriod && !declaredPeriod && positiveRentalAmount(property.price) !== null;
  const ambiguous = unknownPeriod || conflicts.size > 0;
  return { declaredPeriod, ambiguous, conflicts: [...conflicts], rates: ambiguous ? [] : rentalPeriods.filter(period => amounts.has(period)).map(period => ({ period, amount: amounts.get(period)! })) };
}

/** One display selector over the same recorded tariffs used by the quote gate. */
export function propertyRentalDisplayPrice(property: PropertyRentalRateSource, terms?: { price_per_night?: number | null; currency?: string | null } | null): PropertyRentalRate | null {
  const options = propertyRentalRateOptions(property, terms);
  if (options.ambiguous) return null;
  return (options.declaredPeriod ? options.rates.find(rate => rate.period === options.declaredPeriod) : undefined) ?? options.rates[0] ?? null;
}

/** Public detail presentation; this never establishes availability or a server quote. */
export function propertyDetailPricing(property: PropertyIntentFields & {
  currency?: string | null; sale_currency?: string | null; sale_price?: number | null;
  price?: number | null; price_period?: string | null; price_per_night?: number | null;
  price_per_month?: number | null; price_per_year?: number | null; tenancy_modes?: string[] | null;
}, rentalTerms: { price_per_night?: number | null; currency?: string | null } | null | undefined, requestedMode?: string | null, requestedTenancy?: string | null) {
  const mode = propertyDetailMode(property, requestedMode);
  const hasOffer = propertySupportsMode(property, mode);
  const rateOptions = propertyRentalRateOptions(property, rentalTerms);
  const rental = propertyRentalDisplayPrice(property, rentalTerms);
  const nightly = rateOptions.rates.find(rate => rate.period === 'night')?.amount ?? null;
  const modes = property.tenancy_modes ?? [];
  const shortEligible = modes.length > 0 ? modes.includes('short') : nightly !== null;
  const longerStayRequested = (requestedTenancy === 'medium' || requestedTenancy === 'long') && modes.includes(requestedTenancy);
  const rentalCurrencyKnown = property.currency?.trim().toUpperCase() === 'THB';
  const saleCurrencyKnown = (property.sale_price != null ? property.sale_currency : property.currency)?.trim().toUpperCase() === 'THB';
  const canQuoteShortStay = hasOffer && mode === 'rent' && shortEligible && !longerStayRequested && rentalCurrencyKnown && !rateOptions.ambiguous && nightly !== null;
  const amount = !hasOffer ? null : mode === 'buy'
    ? saleCurrencyKnown ? propertySaleAskingPrice(property) : null
    : rentalCurrencyKnown ? canQuoteShortStay ? nightly : rental?.amount ?? null : null;
  return {
    mode, hasOffer, canQuoteShortStay, rentalRates: rateOptions.rates, rentalRatesAmbiguous: rateOptions.ambiguous,
    amount, period: mode === 'buy' ? 'total' as const : canQuoteShortStay ? 'night' as const : rental?.period ?? null,
    pricePerNight: canQuoteShortStay ? nightly : null,
    requestedTenancy: longerStayRequested ? requestedTenancy : null,
  };
}

export function propertyDetailHref(id: string, mode: 'rent' | 'buy', search = ''): string {
  return withGuestContext(APP_ROUTES.PROPERTY_DETAIL(id), mode, search);
}

export function complexDetailHref(id: string, mode: 'rent' | 'buy', search = ''): string {
  return withGuestContext(APP_ROUTES.COMPLEX_DETAIL(id), mode, search);
}

/** Carry guest criteria and the existing operator filter to the canonical search adapter. */
export function propertyCatalogHref(mode: 'rent' | 'buy', search = ''): string {
  const href = withGuestContext(APP_ROUTES.PROPERTY_BROWSE, mode, search);
  const source = new URLSearchParams(search);
  const company = source.get('managementCompanyId') || source.get('company');
  return company ? `${href}&company=${encodeURIComponent(company)}` : href;
}
