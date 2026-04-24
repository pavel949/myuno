/**
 * useContextualMatches — count of off-plan projects matching a price band.
 *
 * Used by ContextualCTA to render "N matching properties" links — IPP §25
 * (M10f). Empty matches must NOT render a CTA, per acceptance criteria.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PriceBand {
  /** Inclusive lower bound, THB */
  min?: number | null;
  /** Inclusive upper bound, THB */
  max?: number | null;
  /** Optional district / location filter */
  district?: string | null;
}

export interface ContextualMatchResult {
  count: number;
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

export function useContextualOffplanMatches(band: PriceBand | null): ContextualMatchResult {
  const enabled = !!band && (band.min != null || band.max != null || !!band.district);

  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['contextual-offplan-matches', band],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      if (!band) return 0;
      let q = supabase
        .from('property_projects')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_approved', true);
      if (band.min != null) q = q.gte('price_from', band.min);
      if (band.max != null) q = q.lte('price_from', band.max);
      if (band.district) q = q.eq('location_area', band.district);
      const { count: c, error } = await q;
      if (error) return 0;
      return c ?? 0;
    },
  });

  return {
    count,
    href: buildOffplanHref(band ?? {}),
    isLoading,
  };
}
