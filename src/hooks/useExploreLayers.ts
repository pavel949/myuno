/** Public catalogue map projection. Missing coordinates are not invented. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { experienceExploreItem, propertyExploreItems, projectExploreItem, mapCoordinates, type ExploreItem, type MapRecord } from '@/lib/map/exploreItems';
export type { ExploreLayer, ExploreItem } from '@/lib/map/exploreItems';

export function useExploreLayers() {
  const query = useQuery({
    queryKey: ['explore-layers-v3'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('public_property_catalog')
          .select('id, title_en, title_ru, lat, lng, district, asset_class, listing_type, listing_modes, is_for_sale, tenancy_modes, price, price_period, currency, sale_price, sale_currency, price_per_night, price_per_month, price_per_year, cover_image, project_id, property_type, bedrooms').limit(1000),
        supabase.from('property_projects')
          .select('id, slug, name_en, name_ru, lat, lng, location_lat, location_lng, district, price_from, cover_image_url, cover_image')
          .eq('is_approved', true).eq('is_active', true).eq('public_listing_enabled', true).limit(1000),
        // Generic provider coordinates do not prove a customer-facing fixed venue.
        // Place-specific service layers are loaded separately by MapView.
        supabase.from('listings')
          .select<string>('id, name_en, name_ru, lat, lng, district, category, price, price_period, currency, rating, cover_image, meeting_point_lat:attributes->meeting_point_lat, meeting_point_lng:attributes->meeting_point_lng, price_per:attributes->>price_per, operating_status:attributes->>operating_status, location_type:attributes->>location_type')
          .eq('vertical', 'experience').eq('is_active', true).eq('approval_status', 'approved').eq('attributes->>status', 'published').limit(1000),
      ]);
      const sourceNames = ['property', 'newbuild', 'experience'];
      const items: ExploreItem[] = [];
      const layerErrors: string[] = [];
      let missingCoordinates = 0;
      results.forEach((result, index) => {
        if (result.error) { layerErrors.push(sourceNames[index]); return; }
        const records = (result.data ?? []) as unknown as MapRecord[];
        for (const row of records) {
          const transformed = index === 0 ? propertyExploreItems(row) : [index === 1 ? projectExploreItem(row) : experienceExploreItem(row)].filter((item): item is ExploreItem => item !== null);
          if (!transformed.length && !mapCoordinates(row.lat, row.lng) && !mapCoordinates(row.location_lat, row.location_lng) && !mapCoordinates(row.meeting_point_lat, row.meeting_point_lng)) missingCoordinates++;
          items.push(...transformed);
        }
      });
      return { items, layerErrors, missingCoordinates };
    },
  });
  return { ...query, data: query.data?.items, layerErrors: query.data?.layerErrors ?? [], missingCoordinates: query.data?.missingCoordinates ?? 0 };
}
