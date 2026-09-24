/**
 * useExploreLayers — real data for the Phuket Explore map core layers:
 *   stay (nightly) · rent (monthly) · sale · newbuild (projects) · service (providers)
 * Only approved/active public records. No invented prices or ratings.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { districtCentroid } from '@/lib/map/phuketDistricts';

export type ExploreLayer = 'stay' | 'rent' | 'sale' | 'newbuild' | 'service';

export interface ExploreItem {
  id: string;
  name: string;
  nameRu: string;
  lat: number;
  lng: number;
  rating: number;
  priceFrom: number;
  image?: string;
  layer: ExploreLayer;
  approximate: boolean;
  routeId: string;
}

const num = (v: unknown) => (v == null || v === '' ? NaN : Number(v));
const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && !(Math.abs(lat) < 1e-5 && Math.abs(lng) < 1e-5);

export function useExploreLayers() {
  return useQuery({
    queryKey: ['explore-layers-v1'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ExploreItem[]> => {
      const [props, projects, providers] = await Promise.all([
        supabase
          .from('v_properties_public')
          .select('id, title_en, title_ru, lat, lng, district, listing_type, price, sale_price, cover_image')
          .limit(1000),
        supabase
          .from('property_projects')
          .select('id, slug, name_en, name_ru, lat, lng, location_lat, location_lng, district, price_from_thb, price_from, cover_image_url, cover_image')
          .eq('is_approved', true)
          .limit(1000),
        supabase
          .from('providers')
          .select('id, name, lat, lng, rating, cover_image, logo_url, business_category')
          .eq('is_active', true)
          .not('lat', 'is', null)
          .limit(1000),
      ]);
      const out: ExploreItem[] = [];

      if (!props.error) {
        for (const p of props.data ?? []) {
          let lat = num(p.lat), lng = num(p.lng), approximate = false;
          if (!valid(lat, lng)) {
            const c = districtCentroid(p.district, p.id);
            if (!c) continue;
            [lat, lng] = c; approximate = true;
          }
          const base = {
            name: p.title_en || 'Property', nameRu: p.title_ru || p.title_en || 'Объект',
            lat, lng, rating: 0, image: p.cover_image || undefined, approximate, routeId: p.id,
          };
          // Public view exposes `price` without period. Today all public rentals
          // are nightly (price_period='night'), so listing_type 'rent' → stay layer.
          // TODO(schema): expose price_period / monthly price in v_properties_public
          // so monthly rentals can populate the long-term layer.
          if (p.listing_type === 'sale') out.push({ ...base, id: `sale-${p.id}`, layer: 'sale', priceFrom: Number(p.sale_price) || 0 });
          else if (p.listing_type === 'rent') out.push({ ...base, id: `stay-${p.id}`, layer: 'stay', priceFrom: Number(p.price) || 0 });
          else if (p.listing_type === 'long_term' || p.listing_type === 'rent_long') out.push({ ...base, id: `rent-${p.id}`, layer: 'rent', priceFrom: Number(p.price) || 0 });
        }
      }

      if (!projects.error) {
        for (const pr of projects.data ?? []) {
          let lat = num(pr.lat ?? pr.location_lat), lng = num(pr.lng ?? pr.location_lng), approximate = false;
          if (!valid(lat, lng)) {
            const c = districtCentroid(pr.district, pr.id);
            if (!c) continue;
            [lat, lng] = c; approximate = true;
          }
          out.push({
            id: `newbuild-${pr.id}`, layer: 'newbuild', routeId: pr.id,
            name: pr.name_en || 'Project', nameRu: pr.name_ru || pr.name_en || 'Проект',
            lat, lng, rating: 0, approximate,
            priceFrom: Number(pr.price_from_thb ?? pr.price_from) || 0,
            image: pr.cover_image_url || pr.cover_image || undefined,
          });
        }
      }

      if (!providers.error) {
        for (const s of providers.data ?? []) {
          const lat = num(s.lat), lng = num(s.lng);
          if (!valid(lat, lng)) continue;
          out.push({
            id: `service-${s.id}`, layer: 'service', routeId: s.id,
            name: s.name, nameRu: s.name, lat, lng, rating: Number(s.rating) || 0, priceFrom: 0,
            image: s.cover_image || s.logo_url || undefined, approximate: false,
          });
        }
      }
      return out;
    },
  });
}
