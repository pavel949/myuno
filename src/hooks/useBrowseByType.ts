// Browse-by-type: fetches latest active+approved records for a given search type.
// Used by /search when a category chip is selected without a text query.
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';
import type { SearchResult } from '@/hooks/useGlobalSearch';

// type → listings.vertical
const TYPE_TO_VERTICAL: Record<string, string> = {
  food: 'restaurant',
  yachts: 'yacht',
  tours: 'experience',
  transport: 'vehicle',
  medical: 'clinic',
  education: 'education',
  cleaning: 'cleaning',
  babysitter: 'babysitter',
  pets: 'pet_service',
};

const VERTICAL_PATHS: Record<string, string> = {
  yacht: '/yachts/',
  experience: '/tours/',
  vehicle: '/transport/vehicle/',
  restaurant: '/restaurants/',
  clinic: '/medical/clinic/',
  education: '/education/tutor/',
  babysitter: '/babysitter/',
  cleaning: '/cleaning/',
  pet_service: '/pets/',
  bouquet: '/flowers/bouquet/',
};

// type → non-migrated table config
interface BrowseTable {
  table: string;
  titleEn: string;
  titleRu: string;
  image: string | null;
  price: string | null;
  locationEn: string | null;
  locationRu: string | null;
  rating: string | null;
  pathPrefix: string;
  idField: string;
  hasApprovalStatus: boolean;
}

const TYPE_TO_TABLE: Record<string, BrowseTable> = {
  property: { table: 'properties', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/property/', idField: 'id', hasApprovalStatus: true },
  beauty: { table: 'salons', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/beauty/salon/', idField: 'id', hasApprovalStatus: true },
  fitness: { table: 'gyms', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_day_pass', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/fitness/gym/', idField: 'id', hasApprovalStatus: true },
  events: { table: 'events', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'location_name', locationRu: 'location_ru', rating: 'rating', pathPrefix: '/events/', idField: 'id', hasApprovalStatus: true },
  water: { table: 'water_activities', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'location_name', locationRu: 'location_name', rating: 'rating', pathPrefix: '/water/', idField: 'id', hasApprovalStatus: true },
  legal: { table: 'legal_services', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_consultation', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/legal/provider/', idField: 'id', hasApprovalStatus: true },
  flowers: { table: 'flower_shops', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/flowers/shop/', idField: 'id', hasApprovalStatus: true },
  pharmacy: { table: 'pharmacies', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/pharmacy/', idField: 'id', hasApprovalStatus: true },
  market: { table: 'stores', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/market/store/', idField: 'id', hasApprovalStatus: true },
  services: { table: 'services', titleEn: 'name_en', titleRu: 'name_ru', image: null, price: 'price', locationEn: null, locationRu: null, rating: null, pathPrefix: '/services/provider/', idField: 'id', hasApprovalStatus: true },
  product: { table: 'marketplace_products', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price', locationEn: 'vendor_name', locationRu: 'vendor_name_ru', rating: 'rating', pathPrefix: '/market/product/', idField: 'id', hasApprovalStatus: false },
};

export function useBrowseByType(type: string | null, enabled = true) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !type) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    (async () => {
      try {
        // Path A: listings vertical
        const vertical = TYPE_TO_VERTICAL[type];
        if (vertical) {
          const { data } = await supabase
            .from('listings')
            .select('id, vertical, name_en, name_ru, cover_image, price, address, district, rating')
            .eq('is_active', true)
            .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
            .eq('vertical', vertical)
            .order('rating', { ascending: false, nullsFirst: false })
            .limit(30);
          if (controller.signal.aborted) return;
          const mapped: SearchResult[] = (data ?? []).map((item) => ({
            id: item.id,
            type,
            titleEn: item.name_en || '',
            titleRu: item.name_ru || '',
            image: item.cover_image,
            price: item.price,
            locationEn: item.address || item.district,
            locationRu: item.district,
            rating: item.rating,
            path: `${VERTICAL_PATHS[vertical] || `/${vertical}/`}${item.id}`,
          }));
          setResults(mapped);
          setIsLoading(false);
          return;
        }

        // Path B: dedicated table
        const cfg = TYPE_TO_TABLE[type];
        if (!cfg) {
          setResults([]);
          setIsLoading(false);
          return;
        }
        const fields = [cfg.idField, cfg.titleEn, cfg.titleRu, cfg.image, cfg.price, cfg.locationEn, cfg.locationRu, cfg.rating].filter((f): f is string => !!f);
        const unique = [...new Set(fields)];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q = (supabase.from as any)(cfg.table)
          .select(unique.join(','))
          .eq('is_active', true)
          .limit(30);
        if (cfg.hasApprovalStatus) q = q.eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS);
        if (cfg.rating) q = q.order(cfg.rating, { ascending: false, nullsFirst: false });
        const { data } = await q;
        if (controller.signal.aborted) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: SearchResult[] = (data ?? []).map((item: Record<string, any>) => ({
          id: item[cfg.idField],
          type,
          titleEn: item[cfg.titleEn] || '',
          titleRu: item[cfg.titleRu] || '',
          image: cfg.image ? item[cfg.image] : null,
          price: cfg.price ? item[cfg.price] : null,
          locationEn: cfg.locationEn ? item[cfg.locationEn] : null,
          locationRu: cfg.locationRu ? item[cfg.locationRu] : null,
          rating: cfg.rating ? item[cfg.rating] : null,
          path: `${cfg.pathPrefix}${item[cfg.idField]}`,
        }));
        setResults(mapped);
        setIsLoading(false);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [type, enabled]);

  return { results, isLoading };
}
