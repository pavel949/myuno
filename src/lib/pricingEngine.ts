/**
 * @module PricingEngine
 * @description Pure functions for calculating property prices with all discount rules
 */

import { differenceInDays } from 'date-fns';

export interface SeasonalPricingRule {
  type: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  priceModifier: number; // e.g., 120 = +20%, 80 = -20%
  /** Absolute price per night — takes priority over priceModifier if set */
  pricePerNight?: number;
  minNights?: number;
}

export interface PricingRules {
  pricePerNight: number;
  weeklyDiscount?: number;       // % off for 7+ nights
  monthlyDiscount?: number;      // % off for 28+ nights
  customLengthDiscounts?: Array<{ min_nights: number; discount_percent: number }>;
  earlyBookingDiscount?: number; // % off
  earlyBookingDays?: number;     // threshold in days ahead
  lastMinuteDiscount?: number;   // % off
  lastMinuteDays?: number;       // threshold in days
  seasonalPricing?: SeasonalPricingRule[];
  depositAmount?: number;
  depositCurrency?: string;
  paymentPolicy?: string;
  prepayPercent?: number;
  balanceDueDays?: number;
}

export interface PricingBreakdown {
  basePrice: number;
  nightlyRate: number;
  nights: number;
  subtotal: number;
  seasonalAdjustment: number;
  lengthDiscount: number;
  lengthDiscountPercent: number;
  earlyBirdDiscount: number;
  earlyBirdPercent: number;
  lastMinuteDiscount: number;
  lastMinutePercent: number;
  totalDiscount: number;
  total: number;
  prepayAmount: number;
  balanceAmount: number;
  prepayPercent: number;
  depositAmount: number;
  depositCurrency: string;
}

/**
 * Calculate the best length-of-stay discount for a given number of nights
 */
function getBestLengthDiscount(
  nights: number,
  rules: PricingRules
): { percent: number; label: string } {
  let bestPercent = 0;
  let label = '';

  // Check custom tiers first (they may override weekly/monthly)
  if (rules.customLengthDiscounts?.length) {
    const sorted = [...rules.customLengthDiscounts].sort((a, b) => b.min_nights - a.min_nights);
    for (const tier of sorted) {
      if (nights >= tier.min_nights && tier.discount_percent > bestPercent) {
        bestPercent = tier.discount_percent;
        label = `${tier.min_nights}+ nights`;
        break;
      }
    }
  }

  // Check standard weekly/monthly
  if (nights >= 28 && (rules.monthlyDiscount || 0) > bestPercent) {
    bestPercent = rules.monthlyDiscount!;
    label = 'monthly';
  } else if (nights >= 7 && (rules.weeklyDiscount || 0) > bestPercent) {
    bestPercent = rules.weeklyDiscount!;
    label = 'weekly';
  }

  return { percent: bestPercent, label };
}

/**
 * Check if a date falls within a seasonal pricing period.
 * Returns the matching seasonal rule, or null.
 */
export function getSeasonalRule(
  date: Date,
  seasonalPricing?: SeasonalPricingRule[]
): SeasonalPricingRule | null {
  if (!seasonalPricing?.length) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const season of seasonalPricing) {
    const afterStart = month > season.startMonth || (month === season.startMonth && day >= season.startDay);
    const beforeEnd = month < season.endMonth || (month === season.endMonth && day <= season.endDay);

    if (season.startMonth <= season.endMonth) {
      if (afterStart && beforeEnd) return season;
    } else {
      if (afterStart || beforeEnd) return season;
    }
  }

  return null;
}

/**
 * Get the effective nightly rate for a date given seasonal rules
 */
export function getEffectiveNightlyRate(
  date: Date,
  basePrice: number,
  seasonalPricing?: SeasonalPricingRule[]
): number {
  const rule = getSeasonalRule(date, seasonalPricing);
  if (!rule) return basePrice;
  // Absolute price takes priority
  if (rule.pricePerNight && rule.pricePerNight > 0) return rule.pricePerNight;
  return Math.round(basePrice * (rule.priceModifier / 100));
}

/**
 * Calculate complete pricing breakdown for a booking
 */
export function calculatePricing(
  rules: PricingRules,
  checkIn: Date,
  checkOut: Date,
  bookingDate: Date = new Date()
): PricingBreakdown {
  const nights = differenceInDays(checkOut, checkIn);
  if (nights <= 0) {
    return emptyBreakdown(rules);
  }

  const basePrice = rules.pricePerNight;

  // 1. Calculate subtotal with per-day seasonal rates
  let subtotal = 0;
  const checkInDate = new Date(checkIn);
  for (let i = 0; i < nights; i++) {
    const day = new Date(checkInDate);
    day.setDate(day.getDate() + i);
    subtotal += getEffectiveNightlyRate(day, basePrice, rules.seasonalPricing);
  }
  const nightlyRate = Math.round(subtotal / nights); // average for display
  const seasonalAdjustment = subtotal - (basePrice * nights);

  // 2. Length-of-stay discount
  const lengthInfo = getBestLengthDiscount(nights, rules);
  const lengthDiscount = Math.round(subtotal * (lengthInfo.percent / 100));

  // 3. Early booking discount
  const daysAhead = differenceInDays(checkIn, bookingDate);
  let earlyBirdPercent = 0;
  if (rules.earlyBookingDiscount && rules.earlyBookingDays && daysAhead >= rules.earlyBookingDays) {
    earlyBirdPercent = rules.earlyBookingDiscount;
  }
  const earlyBirdDiscount = Math.round(subtotal * (earlyBirdPercent / 100));

  // 4. Last-minute discount
  let lastMinutePercent = 0;
  if (rules.lastMinuteDiscount && rules.lastMinuteDays && daysAhead <= rules.lastMinuteDays && daysAhead >= 0) {
    lastMinutePercent = rules.lastMinuteDiscount;
  }
  const lastMinuteDiscount = Math.round(subtotal * (lastMinutePercent / 100));

  // 5. Best single discount wins (don't stack early + last-minute, but length stacks)
  const bestTimingDiscount = Math.max(earlyBirdDiscount, lastMinuteDiscount);
  const totalDiscount = lengthDiscount + bestTimingDiscount;
  const total = Math.max(subtotal - totalDiscount, 0);

  // 6. Payment schedule
  const prepayPercent = getPrepayPercent(rules);
  const prepayAmount = Math.round(total * (prepayPercent / 100));
  const balanceAmount = total - prepayAmount;

  return {
    basePrice,
    nightlyRate,
    nights,
    subtotal,
    seasonalAdjustment,
    lengthDiscount,
    lengthDiscountPercent: lengthInfo.percent,
    earlyBirdDiscount: earlyBirdPercent > 0 ? earlyBirdDiscount : 0,
    earlyBirdPercent,
    lastMinuteDiscount: lastMinutePercent > 0 ? lastMinuteDiscount : 0,
    lastMinutePercent,
    totalDiscount,
    total,
    prepayAmount,
    balanceAmount,
    prepayPercent,
    depositAmount: rules.depositAmount || 0,
    depositCurrency: rules.depositCurrency || 'USD',
  };
}

function getPrepayPercent(rules: PricingRules): number {
  if (rules.prepayPercent != null) return rules.prepayPercent;
  switch (rules.paymentPolicy) {
    case 'prepay_10': return 10;
    case 'prepay_50': return 50;
    case 'full_prepay': return 100;
    case 'pay_on_arrival': return 0;
    default: return 10;
  }
}

function emptyBreakdown(rules: PricingRules): PricingBreakdown {
  return {
    basePrice: rules.pricePerNight,
    nightlyRate: rules.pricePerNight,
    nights: 0,
    subtotal: 0,
    seasonalAdjustment: 0,
    lengthDiscount: 0,
    lengthDiscountPercent: 0,
    earlyBirdDiscount: 0,
    earlyBirdPercent: 0,
    lastMinuteDiscount: 0,
    lastMinutePercent: 0,
    totalDiscount: 0,
    total: 0,
    prepayAmount: 0,
    balanceAmount: 0,
    prepayPercent: getPrepayPercent(rules),
    depositAmount: rules.depositAmount || 0,
    depositCurrency: rules.depositCurrency || 'USD',
  };
}

/**
 * Rate season record from `property_rate_seasons` table
 */
export interface RateSeasonRecord {
  id: string;
  property_id: string;
  name_en: string;
  name_ru?: string | null;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  min_stay_nights?: number | null;
  currency?: string | null;
  is_active?: boolean | null;
  early_booking_discount?: number | null;
  early_booking_days?: number | null;
  last_minute_discount?: number | null;
  last_minute_days?: number | null;
  weekly_discount?: number | null;
  monthly_discount?: number | null;
}

/**
 * Convert a date string "YYYY-MM-DD" to month/day components
 */
function dateToMonthDay(dateStr: string): { month: number; day: number } {
  const d = new Date(dateStr + 'T00:00:00');
  return { month: d.getMonth() + 1, day: d.getDate() };
}

/**
 * Build PricingRules from property base data + rate season records.
 * Rate seasons become SeasonalPricingRule entries; per-season discounts
 * override property-level discounts when the check-in falls in that season.
 */
export function buildPricingRulesFromSeasons(
  property: {
    price_per_night: number;
    weekly_discount?: number;
    monthly_discount?: number;
    early_booking_discount?: number;
    early_booking_days?: number;
    last_minute_discount?: number;
    last_minute_days?: number;
    custom_length_discounts?: Array<{ min_nights: number; discount_percent: number }>;
    deposit_amount?: number;
    deposit_currency?: string;
    payment_policy?: string;
    prepay_percent?: number;
  },
  seasons: RateSeasonRecord[]
): PricingRules {
  const activeSeasons = seasons.filter(s => s.is_active !== false);

  const seasonalPricing: SeasonalPricingRule[] = activeSeasons.map(s => {
    const start = dateToMonthDay(s.start_date);
    const end = dateToMonthDay(s.end_date);
    return {
      type: s.name_en,
      startMonth: start.month,
      startDay: start.day,
      endMonth: end.month,
      endDay: end.day,
      priceModifier: Math.round((s.nightly_rate / property.price_per_night) * 100),
      pricePerNight: s.nightly_rate,
      minNights: s.min_stay_nights ?? undefined,
    };
  });

  // Use first matching season's discounts if available, else property defaults
  return {
    pricePerNight: property.price_per_night,
    weeklyDiscount: property.weekly_discount,
    monthlyDiscount: property.monthly_discount,
    customLengthDiscounts: property.custom_length_discounts,
    earlyBookingDiscount: property.early_booking_discount,
    earlyBookingDays: property.early_booking_days,
    lastMinuteDiscount: property.last_minute_discount,
    lastMinuteDays: property.last_minute_days,
    seasonalPricing,
    depositAmount: property.deposit_amount,
    depositCurrency: property.deposit_currency || 'USD',
    paymentPolicy: property.payment_policy,
    prepayPercent: property.prepay_percent,
  };
}

/**
 * Get season-specific discounts for a check-in date from rate_seasons records.
 * Falls back to property-level discounts if no season overrides exist.
 */
export function getSeasonDiscounts(
  checkInDate: Date,
  seasons: RateSeasonRecord[],
  propertyDefaults: {
    weekly_discount?: number;
    monthly_discount?: number;
    early_booking_discount?: number;
    early_booking_days?: number;
    last_minute_discount?: number;
    last_minute_days?: number;
  }
): {
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  earlyBookingDiscount?: number;
  earlyBookingDays?: number;
  lastMinuteDiscount?: number;
  lastMinuteDays?: number;
} {
  const activeSeasons = seasons.filter(s => s.is_active !== false);

  for (const s of activeSeasons) {
    const start = new Date(s.start_date + 'T00:00:00');
    const end = new Date(s.end_date + 'T00:00:00');
    if (checkInDate >= start && checkInDate <= end) {
      return {
        weeklyDiscount: s.weekly_discount ?? propertyDefaults.weekly_discount,
        monthlyDiscount: s.monthly_discount ?? propertyDefaults.monthly_discount,
        earlyBookingDiscount: s.early_booking_discount ?? propertyDefaults.early_booking_discount,
        earlyBookingDays: s.early_booking_days ?? propertyDefaults.early_booking_days,
        lastMinuteDiscount: s.last_minute_discount ?? propertyDefaults.last_minute_discount,
        lastMinuteDays: s.last_minute_days ?? propertyDefaults.last_minute_days,
      };
    }
  }

  return {
    weeklyDiscount: propertyDefaults.weekly_discount,
    monthlyDiscount: propertyDefaults.monthly_discount,
    earlyBookingDiscount: propertyDefaults.early_booking_discount,
    earlyBookingDays: propertyDefaults.early_booking_days,
    lastMinuteDiscount: propertyDefaults.last_minute_discount,
    lastMinuteDays: propertyDefaults.last_minute_days,
  };
}

/**
 * Convert rate_seasons table records back to the JSONB format stored in
 * `properties.seasonal_pricing` for backward compatibility.
 */
export function rateSeasonsToJsonb(
  seasons: RateSeasonRecord[],
  basePricePerNight: number
): Array<{
  type: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  price_modifier: number;
  price_per_night: number;
  min_nights?: number;
}> {
  return seasons
    .filter(s => s.is_active !== false)
    .map(s => {
      const start = dateToMonthDay(s.start_date);
      const end = dateToMonthDay(s.end_date);
      return {
        type: s.name_en,
        start_month: start.month,
        start_day: start.day,
        end_month: end.month,
        end_day: end.day,
        price_modifier: basePricePerNight > 0
          ? Math.round((s.nightly_rate / basePricePerNight) * 100)
          : 100,
        price_per_night: s.nightly_rate,
        min_nights: s.min_stay_nights ?? undefined,
      };
    });
}
