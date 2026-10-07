// Pure, dependency-free server quote for nightly property stays (F06).
// Used by create-property-deposit-checkout; unit-tested from Vitest.

export const DEPOSIT_PERCENT = 10;
export const MAX_NIGHTS = 365;
export const SUPPORTED_CURRENCY = 'THB';

export interface PropertyPricingRow {
  price_per_night: number | null;
  price: number | null;
  price_period: string | null;
  /** Not a column on `properties`; kept optional for callers that pass it. */
  cleaning_fee?: number | null;
  extra_cleaning_price: number | null;
  currency: string | null;
  is_active: boolean | null;
  status: string | null;
  max_guests: number | null;
  min_stay_nights: number | null;
  weekly_discount: number | null;
  monthly_discount: number | null;
  early_booking_discount: number | null;
  last_minute_discount: number | null;
  custom_length_discounts: unknown;
}

export interface QuoteInput {
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total_amount: number;
  cleaning_fee?: number;
  /** YYYY-MM-DD "today" in the property's local calendar (Asia/Bangkok). */
  today: string;
}

export type QuoteResult =
  | { ok: true; nights: number; total: number; deposit: number; remaining: number; cleaningFee: number; currency: string }
  | { ok: false; code: string; message: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dayNumber(d: string): number | null {
  if (!DATE_RE.test(d)) return null;
  const t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  if (!Number.isFinite(t)) return null;
  // reject rollovers such as 2026-02-31
  const back = new Date(t).toISOString().slice(0, 10);
  return back === d ? Math.round(t / 86_400_000) : null;
}

function pct(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 100 ? n : 0;
}

/** Largest discount % this property itself has configured for a stay of `nights`. */
export function maxApplicableDiscount(p: PropertyPricingRow, nights: number): number {
  let best = Math.max(pct(p.early_booking_discount), pct(p.last_minute_discount));
  if (nights >= 7) best = Math.max(best, pct(p.weekly_discount));
  if (nights >= 28) best = Math.max(best, pct(p.monthly_discount));
  if (Array.isArray(p.custom_length_discounts)) {
    for (const tier of p.custom_length_discounts as Array<Record<string, unknown>>) {
      const min = Number(tier?.min_nights ?? tier?.minNights ?? tier?.nights);
      if (Number.isFinite(min) && nights >= min) {
        best = Math.max(best, pct(tier?.discount ?? tier?.percent ?? tier?.discount_percent));
      }
    }
  }
  return best;
}

export function nightlyRate(p: PropertyPricingRow): number {
  const perNight = Number(p.price_per_night);
  if (Number.isFinite(perNight) && perNight > 0) return perNight;
  const period = (p.price_period ?? 'night').toLowerCase();
  const price = Number(p.price);
  if (['night', 'nightly', 'day', 'daily'].includes(period) && Number.isFinite(price) && price > 0) return price;
  return 0;
}

export function quotePropertyStay(p: PropertyPricingRow | null, input: QuoteInput): QuoteResult {
  const fail = (code: string, message: string): QuoteResult => ({ ok: false, code, message });
  if (!p) return fail('not_found', 'Property not found');
  if (p.is_active !== true || ['archived', 'rejected', 'inactive', 'deleted'].includes((p.status ?? '').toLowerCase())) {
    return fail('inactive', 'Property is not bookable');
  }
  const currency = (p.currency ?? SUPPORTED_CURRENCY).toUpperCase();
  if (currency !== SUPPORTED_CURRENCY) return fail('currency', 'Unsupported currency');

  const rate = nightlyRate(p);
  if (rate <= 0) return fail('no_rate', 'Property has no nightly rate');

  const inDay = dayNumber(input.check_in);
  const outDay = dayNumber(input.check_out);
  const today = dayNumber(input.today);
  if (inDay === null || outDay === null || today === null) return fail('dates', 'Invalid dates');
  if (inDay < today) return fail('past', 'Check-in date is in the past');
  const nights = outDay - inDay;
  if (nights < 1 || nights > MAX_NIGHTS) return fail('nights', 'Invalid length of stay');
  if (Number(input.nights) !== nights) return fail('nights_mismatch', 'Nights do not match the dates');
  if (p.min_stay_nights && nights < p.min_stay_nights) return fail('min_stay', `Minimum stay is ${p.min_stay_nights} nights`);

  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1) return fail('guests', 'Invalid number of guests');
  if (p.max_guests && guests > p.max_guests) return fail('guests', `Maximum ${p.max_guests} guests`);

  // Same precedence as the booking page: extra_cleaning_price, then cleaning_fee.
  const cleaningFee = Math.max(0, Number(p.extra_cleaning_price) || Number(p.cleaning_fee) || 0);
  const clientCleaning = Number(input.cleaning_fee ?? 0);
  if (!Number.isFinite(clientCleaning) || Math.abs(clientCleaning - cleaningFee) > 0.01) {
    return fail('cleaning_fee', 'Cleaning fee does not match the current price');
  }
  const appliedCleaning = cleaningFee;

  const base = rate * nights;
  const discount = maxApplicableDiscount(p, nights);
  const minTotal = Math.floor(base * (1 - discount / 100)) + appliedCleaning;
  const maxTotal = Math.ceil(base) + appliedCleaning;
  const total = Number(input.total_amount);
  if (!Number.isFinite(total) || total < minTotal - 1 || total > maxTotal + 1) {
    return fail('total', 'Booking total does not match the current price');
  }
  const rounded = Math.round(total);
  const deposit = Math.round((rounded * DEPOSIT_PERCENT) / 100);
  if (deposit <= 0) return fail('deposit', 'Invalid deposit');
  return { ok: true, nights, total: rounded, deposit, remaining: rounded - deposit, cleaningFee: appliedCleaning, currency };
}

export function bangkokToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
}

/** Allocate Stripe line items in minor units so rounding cannot change the deposit. */
export function splitDepositMinorUnits(deposit: number, cleaningFee: number) {
  const total = Math.round(deposit * 100);
  const cleaning = Math.round(cleaningFee * DEPOSIT_PERCENT);
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(cleaning) || cleaning < 0 || cleaning > total) {
    throw new Error('Invalid deposit allocation');
  }
  return { rental: total - cleaning, cleaning };
}
