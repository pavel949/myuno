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
  /** Legacy JSONB month/day rules used by the booking page. */
  seasonal_pricing?: unknown;
}

export interface RateSeasonRow {
  start_date: string;
  end_date: string;
  nightly_rate: number | null;
  min_stay_nights?: number | null;
  is_active?: boolean | null;
  weekly_discount?: number | null;
  monthly_discount?: number | null;
  early_booking_discount?: number | null;
  last_minute_discount?: number | null;
}

export interface QuoteInput {
  /** Active rate seasons for the property (end_date inclusive). */
  seasons?: RateSeasonRow[];
  /** Per-date nightly overrides keyed by YYYY-MM-DD (highest priority). */
  dateOverrides?: Record<string, number>;
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

/** Booking page stacks the best length discount with the best timing discount. */
export function maxStackedDiscount(p: PropertyPricingRow, nights: number): number {
  let length = 0;
  if (nights >= 7) length = Math.max(length, pct(p.weekly_discount));
  if (nights >= 28) length = Math.max(length, pct(p.monthly_discount));
  if (Array.isArray(p.custom_length_discounts)) {
    for (const tier of p.custom_length_discounts as Array<Record<string, unknown>>) {
      const min = Number(tier?.min_nights ?? tier?.minNights ?? tier?.nights);
      if (Number.isFinite(min) && nights >= min) length = Math.max(length, pct(tier?.discount ?? tier?.percent ?? tier?.discount_percent));
    }
  }
  const timing = Math.max(pct(p.early_booking_discount), pct(p.last_minute_discount));
  return Math.min(length + timing, 99);
}

/** Nightly rate from legacy JSONB month/day rules (same logic as pricingEngine). */
function jsonbSeasonRate(p: PropertyPricingRow, day: number, base: number): number | null {
  if (!Array.isArray(p.seasonal_pricing)) return null;
  const d = new Date(day * 86_400_000);
  const month = d.getUTCMonth() + 1;
  const dd = d.getUTCDate();
  for (const r of p.seasonal_pricing as Array<Record<string, number>>) {
    const after = month > r.startMonth || (month === r.startMonth && dd >= r.startDay);
    const before = month < r.endMonth || (month === r.endMonth && dd <= r.endDay);
    const hit = r.startMonth <= r.endMonth ? after && before : after || before;
    if (!hit) continue;
    if (Number(r.pricePerNight) > 0) return Number(r.pricePerNight);
    if (Number(r.priceModifier) > 0) return Math.round(base * (Number(r.priceModifier) / 100));
    return null;
  }
  return null;
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

  // Per-night rate: matching active season (latest start wins), else base rate.
  const seasons = (input.seasons ?? [])
    .filter((x) => x.is_active !== false && Number(x.nightly_rate) > 0)
    .map((x) => ({ ...x, s: dayNumber(x.start_date), e: dayNumber(x.end_date) }))
    .filter((x) => x.s !== null && x.e !== null)
    .sort((a, b) => (b.s as number) - (a.s as number));
  let low = 0;
  let high = 0;
  let discount = maxStackedDiscount(p, nights);
  for (let d = inDay; d < outDay; d++) {
    const season = seasons.find((x) => d >= (x.s as number) && d <= (x.e as number));
    const key = new Date(d * 86_400_000).toISOString().slice(0, 10);
    const override = Number(input.dateOverrides?.[key]);
    const candidates = [season ? Number(season.nightly_rate) : rate];
    const legacy = jsonbSeasonRate(p, d, rate);
    if (legacy !== null && legacy > 0) candidates.push(legacy);
    if (Number.isFinite(override) && override > 0) candidates.splice(0, candidates.length, override);
    low += Math.min(...candidates);
    high += Math.max(...candidates);
    if (season) {
      if (d === inDay && season.min_stay_nights && nights < season.min_stay_nights) {
        return fail('min_stay', `Minimum stay is ${season.min_stay_nights} nights`);
      }
      discount = Math.max(discount, maxStackedDiscount({ ...p,
        weekly_discount: season.weekly_discount ?? null, monthly_discount: season.monthly_discount ?? null,
        early_booking_discount: season.early_booking_discount ?? null, last_minute_discount: season.last_minute_discount ?? null,
        custom_length_discounts: null }, nights));
    }
  }
  // The booking page sends the stay total WITHOUT cleaning (fee sent separately);
  // older callers may include it. Accept either and charge stay + cleaning.
  const minStay = Math.floor(low * (1 - discount / 100));
  const maxStay = Math.ceil(high);
  const sent = Number(input.total_amount);
  if (!Number.isFinite(sent)) return fail('total', 'Booking total does not match the current price');
  const inRange = (v: number) => v >= minStay - 1 && v <= maxStay + 1;
  let total: number;
  if (inRange(sent)) total = sent + appliedCleaning;
  else if (appliedCleaning > 0 && inRange(sent - appliedCleaning)) total = sent;
  else return fail('total', 'Booking total does not match the current price');
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
