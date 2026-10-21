import { addDays } from 'date-fns';
import { civilDateKey, parseCivilDate } from '@/lib/hotelDates';

/** Shared wire format for optimistic price edits. No occupancy is ever written. */
export type CalendarPriceRow = {
  date: string; price_override: number | null;
  min_nights_override?: number | null; status?: string; booking_id?: string | null;
  min_stay_nights?: number | null; closed_to_arrival?: boolean; closed_to_departure?: boolean; stop_sell?: boolean;
};
export function priceRangeSnapshot(rows: CalendarPriceRow[], from: string, endExclusive: string, category: boolean) {
  return Object.fromEntries(rows.filter(row => row.date >= from && row.date < endExclusive).map(row => [row.date, category
    ? { price: row.price_override, minimum: row.min_stay_nights ?? null, arrival: row.closed_to_arrival ?? false, departure: row.closed_to_departure ?? false, stop: row.stop_sell ?? false }
    : { price: row.price_override, minimum: row.min_nights_override ?? null, status: row.status, booking: row.booking_id ?? null }]));
}
export function inclusivePriceRange(from: string, through: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(through) ||
      civilDateKey(parseCivilDate(from)) !== from || civilDateKey(parseCivilDate(through)) !== through || from > through) throw new Error('invalid_range');
  const end = civilDateKey(addDays(parseCivilDate(through),1));
  const count = Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000);
  if(count<1 || count>366) throw new Error('invalid_range');
  return {from, end, count};
}
export function parseCalendarPrice(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) throw new Error('invalid_price');
  const price = Number(value.trim().replace(',','.'));
  if (!Number.isFinite(price) || price<=0) throw new Error('invalid_price');
  return price;
}
