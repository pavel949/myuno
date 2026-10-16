/**
 * Category-level (resort / hotel) stay quote. Pure module, no imports, so it is
 * mirrored byte-for-byte in src/lib/hotelQuote.ts for the booking page and tests.
 *
 * Nightly price order: category date price -> latest-starting active category
 * season -> category base price; then the rate plan adjustment is applied.
 * Restrictions: stop sell, closed to arrival/departure, min stay (category,
 * date, season, plan), max stay and minimum advance days of the plan.
 */
export interface HotelCategoryRow {
  id: string;
  base_price_per_night: number;
  min_stay_nights: number;
  max_guests: number;
  is_active: boolean;
}
export interface HotelRatePlanRow {
  id: string;
  category_id: string;
  adjustment_type: "percent" | "fixed_per_night";
  adjustment_value: number;
  min_stay_nights: number | null;
  max_stay_nights: number | null;
  min_advance_days: number | null;
  is_active: boolean;
}
export interface HotelSeasonRow {
  start_date: string;
  end_date: string;
  nightly_rate: number;
  min_stay_nights?: number | null;
  is_active?: boolean | null;
}
export interface HotelRestrictionRow {
  date: string;
  price_override: number | null;
  min_stay_nights: number | null;
  closed_to_arrival: boolean;
  closed_to_departure: boolean;
  stop_sell: boolean;
}
export interface HotelQuoteInput {
  category: HotelCategoryRow | null;
  plan: HotelRatePlanRow | null;
  seasons: HotelSeasonRow[];
  restrictions: HotelRestrictionRow[];
  check_in: string;
  check_out: string;
  guests: number;
  today: string;
}
export type HotelQuoteResult =
  | { ok: true; nights: number; total: number; nightly: { date: string; price: number }[] }
  | { ok: false; code: string; message: string };

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parse(d: string): number | null {
  if (!ISO.test(d)) return null;
  const t = Date.parse(`${d}T00:00:00Z`);
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== d) return null;
  return t;
}
const fmt = (t: number) => new Date(t).toISOString().slice(0, 10);
const fail = (code: string, message: string): HotelQuoteResult => ({ ok: false, code, message });

export function quoteHotelStay(input: HotelQuoteInput): HotelQuoteResult {
  const { category, plan } = input;
  if (!category || !category.is_active) return fail("not_found", "Room category is not available");
  if (!plan || !plan.is_active || plan.category_id !== category.id) return fail("invalid_plan", "Rate plan is not available");
  const a = parse(input.check_in), b = parse(input.check_out), today = parse(input.today);
  if (a === null || b === null || today === null) return fail("invalid_dates", "Invalid dates");
  if (a < today) return fail("past_dates", "Check-in date is in the past");
  const nights = Math.round((b - a) / DAY);
  if (nights < 1 || nights > 365) return fail("invalid_dates", "Invalid stay length");
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > category.max_guests) {
    return fail("guests", "Too many guests for this room category");
  }
  if (plan.min_advance_days != null && Math.round((a - today) / DAY) < plan.min_advance_days) {
    return fail("advance", "This rate requires earlier booking");
  }
  if (plan.max_stay_nights != null && nights > plan.max_stay_nights) return fail("max_stay", "Stay is longer than this rate allows");

  const byDate = new Map(input.restrictions.map((r) => [r.date, r]));
  let minStay = Math.max(category.min_stay_nights || 1, plan.min_stay_nights || 1);
  const arrival = byDate.get(input.check_in);
  if (arrival?.closed_to_arrival) return fail("closed_arrival", "Arrival is not possible on this date");
  if (arrival?.min_stay_nights) minStay = Math.max(minStay, arrival.min_stay_nights);
  if (byDate.get(input.check_out)?.closed_to_departure) return fail("closed_departure", "Departure is not possible on this date");

  const seasons = input.seasons
    .filter((s) => s.is_active !== false && Number(s.nightly_rate) > 0)
    .sort((x, y) => (x.start_date < y.start_date ? 1 : -1));

  const nightly: { date: string; price: number }[] = [];
  let total = 0;
  for (let i = 0; i < nights; i++) {
    const d = fmt(a + i * DAY);
    const r = byDate.get(d);
    if (r?.stop_sell) return fail("stop_sell", "Sales are closed for the selected dates");
    let price = Number(category.base_price_per_night);
    const season = seasons.find((s) => s.start_date <= d && s.end_date >= d);
    if (season) {
      price = Number(season.nightly_rate);
      if (i === 0 && season.min_stay_nights) minStay = Math.max(minStay, season.min_stay_nights);
    }
    if (r?.price_override && r.price_override > 0) price = Number(r.price_override);
    price = plan.adjustment_type === "percent"
      ? price * (1 + Number(plan.adjustment_value) / 100)
      : price + Number(plan.adjustment_value);
    price = Math.round(price);
    if (!Number.isFinite(price) || price <= 0) return fail("invalid_price", "Price could not be calculated");
    nightly.push({ date: d, price });
    total += price;
  }
  if (nights < minStay) return fail("min_stay", `Minimum stay is ${minStay} nights`);
  return { ok: true, nights, total, nightly };
}
