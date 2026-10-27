/**
 * useContextualMatches — count of off-plan projects matching a price band.
 *
 * Used by ContextualCTA to render "N matching properties" links — IPP §25
 * (M10f). Empty matches must NOT render a CTA, per acceptance criteria.
 */

interface PriceBand {
  /** Inclusive lower bound, THB */
  min?: number | null;
  /** Inclusive upper bound, THB */
  max?: number | null;
  /** Optional district / location filter */
  district?: string | null;
}

export interface ContextualMatchResult {
  count: number | null;
  /** Pre-built href to /property/offplan with query string applied */
  href: string;
  isLoading: boolean;
}

function buildOffplanHref(band: PriceBand): string {
  const qs = new URLSearchParams();
  if (band.min) qs.set('price_min', String(band.min));
  if (band.max) qs.set('price_max', String(band.max));
  if (band.district) qs.set('district', band.district);
  const q = qs.toString();
  return q ? `/property/offplan?${q}` : '/property/offplan';
}

/** Project starting prices are provisional, and the catalogue does not apply
 * the calculator's unit-price band. Do not advertise a verified match count. */
export function useContextualOffplanMatches(band: PriceBand | null): ContextualMatchResult {
  return { count: null, href: buildOffplanHref({ district: band?.district }), isLoading: false };
}
