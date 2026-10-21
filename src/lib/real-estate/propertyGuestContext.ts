import type { DateRange } from 'react-day-picker';
import { bangkokTodayISO, civilDateKey, parseCivilDate } from '@/lib/hotelDates';

export interface PropertyGuestContext {
  dateRange?: DateRange;
  guests: number;
}

/** Search preferences only: never evidence of availability or a valid quote. */
export function readPropertyGuestContext(search: string, maxGuests?: number | null, today = bangkokTodayISO()): PropertyGuestContext {
  const params = new URLSearchParams(search);
  const capacity = typeof maxGuests === 'number' && Number.isFinite(maxGuests) && maxGuests >= 1 ? Math.floor(maxGuests) : 50;
  const rawGuests = params.get('guests');
  const parsedGuests = rawGuests && /^\d+$/.test(rawGuests) ? Number(rawGuests) : NaN;
  const guests = Number.isSafeInteger(parsedGuests) && parsedGuests >= 1 && parsedGuests <= Math.min(capacity, 50) ? parsedGuests : 1;
  const date = (key: string) => {
    const raw = params.get(key);
    if (!raw || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(raw)) return undefined;
    // Existing search URLs serialize local-midnight instants; shared parsing preserves that contract.
    const value = parseCivilDate(raw);
    if (!Number.isFinite(value.getTime())) return undefined;
    // Reject normalized impossible date-only inputs rather than silently changing the stay.
    if (raw.length === 10 && civilDateKey(value) !== raw) return undefined;
    return value;
  };
  const from = date('checkIn'), to = date('checkOut');
  const dateRange = from && to && civilDateKey(from) >= today && civilDateKey(to) > civilDateKey(from) ? { from, to } : undefined;
  return { dateRange, guests };
}
