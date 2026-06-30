/**
 * strEligibility — the safety gate for embedding hotels into short-term-rental
 * (nightly, <30-night) search.
 *
 * Thai law context (Hotel Act B.E. 2547): accommodation let for <30 days is a
 * "hotel" needing a licence; condominiums may not be let daily at all; properties
 * without a full hotel licence must use a 30-night minimum. We therefore only let a
 * property appear in <30-night results when it is BOTH flagged for short tenancy AND
 * licence-safe. This is a conservative, display-only gate — it does not enforce
 * anything server-side (that is a later phase). It deliberately treats only a full
 * hotel licence as nightly-clear; the ≤8-room "non-hotel registration" exemption is
 * a genuine legal grey area and is gated to 30-night here until counsel confirms.
 */
import { isHotelType } from './commercialTaxonomy';

/** Minimal shape needed to judge eligibility (a `Property` satisfies this). */
export interface StrEligibilityInput {
  asset_class?: string | null;
  property_type?: string | null;
  tenancy_modes?: string[] | null;
  price_period?: string | null;
  hotel_license_type?: string | null;
  min_stay_nights?: number | null;
}

/** Thai Hotel Act exemption floor for non-licence-cleared short lets. */
export const HOTEL_ACT_MIN_NIGHTS = 30;

/** Hotel licence values cleared for <30-night operation. */
const NIGHTLY_CLEAR_HOTEL_LICENCES = new Set(['full_hotel_license']);

export type StrComplianceStatus = 'licensed' | 'min30' | 'unset';

export function isHotel(p: StrEligibilityInput): boolean {
  return p.asset_class === 'commercial' && isHotelType(p.property_type);
}

export function isCondo(p: StrEligibilityInput): boolean {
  return p.property_type === 'condo';
}

/** True when the listing is offered for short (nightly) tenancy. */
export function isShortFlagged(p: StrEligibilityInput): boolean {
  if (p.tenancy_modes?.includes('short')) return true;
  return p.price_period === 'night' || p.price_period === 'week';
}

function hasNightlyClearLicence(p: StrEligibilityInput): boolean {
  return !!p.hotel_license_type && NIGHTLY_CLEAR_HOTEL_LICENCES.has(p.hotel_license_type);
}

/**
 * Must this property be kept OUT of <30-night results regardless of how it's
 * flagged? Condos (daily condo rentals are banned) and hotels lacking a full
 * licence. Use this as the exclusion filter on a nightly result set — it does
 * NOT require a positive short-flag, so it won't drop residential listings that
 * inherit the query's default short eligibility.
 */
export function isBlockedFromNightly(p: StrEligibilityInput): boolean {
  if (isCondo(p)) return true;
  if (isHotel(p)) return !hasNightlyClearLicence(p);
  return false;
}

/**
 * May this property be shown in <30-night ("short") search results?
 * Short-flagged AND not blocked: hotels need a full hotel licence; condos are
 * never daily-eligible; other residential types are eligible when short-flagged.
 */
export function isNightlyEligible(p: StrEligibilityInput): boolean {
  return isShortFlagged(p) && !isBlockedFromNightly(p);
}

/** Trust/compliance status for badge rendering. */
export function strComplianceStatus(p: StrEligibilityInput): StrComplianceStatus {
  if (isHotel(p)) return hasNightlyClearLicence(p) ? 'licensed' : 'min30';
  if (isCondo(p)) return 'min30';
  return 'unset';
}

/** Effective minimum nights: 30 for non-cleared hotels/condos, else the listing's own. */
export function minNightsFloor(p: StrEligibilityInput): number {
  const needsHotelActFloor = isCondo(p) || (isHotel(p) && !hasNightlyClearLicence(p));
  if (needsHotelActFloor) return HOTEL_ACT_MIN_NIGHTS;
  return p.min_stay_nights ?? 1;
}
