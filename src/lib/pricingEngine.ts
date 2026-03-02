/**
 * @module PricingEngine
 * @description Pure functions for calculating property prices with all discount rules
 */

import { differenceInDays } from 'date-fns';

export interface PricingRules {
  pricePerNight: number;
  weeklyDiscount?: number;       // % off for 7+ nights
  monthlyDiscount?: number;      // % off for 28+ nights
  customLengthDiscounts?: Array<{ min_nights: number; discount_percent: number }>;
  earlyBookingDiscount?: number; // % off
  earlyBookingDays?: number;     // threshold in days ahead
  lastMinuteDiscount?: number;   // % off
  lastMinuteDays?: number;       // threshold in days
  seasonalPricing?: Array<{
    type: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    priceModifier: number; // e.g., 120 = +20%, 80 = -20%
  }>;
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
 * Check if a date falls within a seasonal pricing period
 */
function getSeasonalModifier(
  checkIn: Date,
  rules: PricingRules
): number {
  if (!rules.seasonalPricing?.length) return 100;

  const month = checkIn.getMonth() + 1;
  const day = checkIn.getDate();

  for (const season of rules.seasonalPricing) {
    const afterStart = month > season.startMonth || (month === season.startMonth && day >= season.startDay);
    const beforeEnd = month < season.endMonth || (month === season.endMonth && day <= season.endDay);

    // Handle wrap-around (e.g., Nov-Feb)
    if (season.startMonth <= season.endMonth) {
      if (afterStart && beforeEnd) return season.priceModifier;
    } else {
      if (afterStart || beforeEnd) return season.priceModifier;
    }
  }

  return 100;
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

  // 1. Seasonal adjustment
  const seasonalMod = getSeasonalModifier(checkIn, rules);
  const nightlyRate = Math.round(basePrice * (seasonalMod / 100));
  const subtotal = nightlyRate * nights;
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
