import { bangkokTodayDate, civilDateKey, occupiedCivilDates } from './hotelDates';
import { calculatePricing, type PricingRules, type RateSeasonRecord } from './pricingEngine';

export function calculatePropertyStayPreview(
  rules: PricingRules,
  checkIn: Date,
  checkOut: Date,
  dates: Record<string, number>,
  seasons: RateSeasonRecord[],
  bookedAt = new Date(),
) {
  // Category tariffs are consumed by the separate hotel quote, not a unit stay.
  const active = seasons.filter(s => s.is_active !== false && !s.category_id && s.nightly_rate > 0)
    .sort((a, b) => b.start_date.localeCompare(a.start_date) || a.id.localeCompare(b.id));
  const dateOverrides = { ...dates };
  for (const day of occupiedCivilDates({
    check_in: civilKey(checkIn), check_out: civilKey(checkOut),
  })) {
    if (dateOverrides[day] > 0) continue;
    const season = active.find(s => s.start_date <= day && s.end_date >= day);
    if (season) dateOverrides[day] = season.nightly_rate;
  }
  // Legacy recurring rows are a fallback, not a second copy of dated seasons.
  return calculatePricing({
    ...rules, dateOverrides,
    seasonalPricing: active.length > 0 ? undefined : rules.seasonalPricing,
  }, checkIn, checkOut, bangkokTodayDate(bookedAt));
}

function civilKey(day: Date) {
  return Number.isFinite(day.getTime()) ? civilDateKey(day) : '';
}
