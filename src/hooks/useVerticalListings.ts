/**
 * useVerticalListings — spec-driven query for `public.listings` rows.
 * Maps active FilterSpec values to Supabase query operators per `queryHint`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VerticalSpec } from '@/lib/vertical-specs/types';

export type FilterValue = string | string[] | boolean | number | { min?: number; max?: number } | { from?: string; to?: string } | undefined;
export type ActiveFilters = Record<string, FilterValue>;

interface Options {
  spec: VerticalSpec;
  filters: ActiveFilters;
  sort?: string;
  limit?: number;
  enabled?: boolean;
}

export interface CatalogRow {
  id: string;
  vertical: string;
  name_en: string;
  name_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[] | null;
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  price: number | null;
  rating: number | null;
  review_count: number | null;
  attributes: Record<string, unknown> | null;
  slug: string | null;
}

export function useVerticalListings({ spec, filters, sort, limit = 60, enabled = true }: Options) {
  if (spec.storage.kind !== 'listings_vertical') {
    throw new Error(`useVerticalListings: spec "${spec.id}" has non-listings storage`);
  }
  const vertical = spec.storage.vertical;

  return useQuery({
    queryKey: ['vertical-listings', vertical, filters, sort, limit],
    enabled,
    queryFn: async (): Promise<CatalogRow[]> => {
      // Cast to a permissive filter-builder type — the spec-driven chain has too
      // many possible operator calls for TS to resolve generically (TS2589).
      // We still validate the operator set explicitly in the switch below.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from('listings')
        .select('id,vertical,name_en,name_ru,description_en,description_ru,cover_image,images,address,district,lat,lng,price,rating,review_count,attributes,slug')
        .eq('vertical', vertical)
        .eq('is_active', true)
        .eq('approval_status', 'approved');

      for (const f of spec.filters) {
        const v = filters[f.key];
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
        const hint = f.queryHint;
        if (!hint) continue;
        const path = hint.jsonbPath ? `attributes->>${hint.jsonbPath}` : (hint.column ?? f.key);
        const jsonbContainsPath = hint.jsonbPath ? `attributes` : null;

        try {
          switch (hint.operator) {
            case 'eq':
              q = q.eq(path, v as string);
              break;
            case 'in':
              if (Array.isArray(v)) q = q.in(path, v as string[]);
              else q = q.eq(path, v as string);
              break;
            case 'contains':
              if (jsonbContainsPath && hint.jsonbPath) {
                const arr = Array.isArray(v) ? v : [v];
                // attributes @> '{"key": ["a"]}'
                q = q.contains(jsonbContainsPath, { [hint.jsonbPath]: arr });
              }
              break;
            case 'gte':
              q = q.gte(path, v as number);
              break;
            case 'lte':
              q = q.lte(path, v as number);
              break;
            case 'between': {
              const r = v as { min?: number; max?: number };
              if (typeof r.min === 'number') q = q.gte(path, r.min);
              if (typeof r.max === 'number') q = q.lte(path, r.max);
              break;
            }
          }
        } catch {
          // ignore malformed filter
        }
      }

      // Sort
      switch (sort) {
        case 'price_asc':
          q = q.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price_desc':
          q = q.order('price', { ascending: false, nullsFirst: false });
          break;
        case 'rating':
          q = q.order('rating', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
          q = q.order('created_at', { ascending: false });
          break;
        default:
          q = q.order('is_featured', { ascending: false }).order('rating', { ascending: false, nullsFirst: false });
      }

      const { data, error } = await q.limit(limit);
      if (error) throw error;
      return (data ?? []) as CatalogRow[];
    },
  });
}
