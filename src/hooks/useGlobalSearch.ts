import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SearchResult {
  id: string;
  type: string;
  titleEn: string;
  titleRu: string;
  image: string | null;
  price: number | null;
  locationEn: string | null;
  locationRu: string | null;
  rating: number | null;
  path: string;
}

const searchTables = [
  {
    table: 'yachts',
    type: 'yachts',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'price_full_day',
    locationEn: 'location_name',
    locationRu: 'location_ru',
    rating: 'rating',
    pathPrefix: '/yachts/',
    idField: 'id'
  },
  {
    table: 'tours',
    type: 'tours',
    titleEn: 'title_en',
    titleRu: 'title_ru',
    image: 'cover_image',
    price: 'price',
    locationEn: 'meeting_point',
    locationRu: 'meeting_point',
    rating: 'rating',
    pathPrefix: '/tours/',
    idField: 'id'
  },
  {
    table: 'properties',
    type: 'property',
    titleEn: 'title_en',
    titleRu: 'title_ru',
    image: 'cover_image',
    price: 'price',
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/property/',
    idField: 'id'
  },
  {
    table: 'restaurants',
    type: 'food',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: null,
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/restaurants/',
    idField: 'id'
  },
  {
    table: 'salons',
    type: 'beauty',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: null,
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/beauty/salon/',
    idField: 'id'
  },
  {
    table: 'clinics',
    type: 'medical',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'consultation_price',
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/medical/clinic/',
    idField: 'id'
  },
  {
    table: 'gyms',
    type: 'fitness',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'price_day_pass',
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/fitness/gym/',
    idField: 'id'
  },
  {
    table: 'vehicles',
    type: 'transport',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'price_per_day',
    locationEn: null,
    locationRu: null,
    rating: 'rating',
    pathPrefix: '/transport/vehicle/',
    idField: 'id'
  },
  {
    table: 'events',
    type: 'events',
    titleEn: 'title_en',
    titleRu: 'title_ru',
    image: 'cover_image',
    price: 'price',
    locationEn: 'location_name',
    locationRu: 'location_ru',
    rating: 'rating',
    pathPrefix: '/events/',
    idField: 'id'
  },
  {
    table: 'water_activities',
    type: 'water',
    titleEn: 'title_en',
    titleRu: 'title_ru',
    image: 'cover_image',
    price: 'price',
    locationEn: 'location_name',
    locationRu: 'location_name',
    rating: 'rating',
    pathPrefix: '/water/',
    idField: 'id'
  },
  {
    table: 'education_providers',
    type: 'education',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'price_per_hour',
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/education/tutor/',
    idField: 'id'
  },
  {
    table: 'legal_services',
    type: 'legal',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'price_consultation',
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/legal/provider/',
    idField: 'id'
  },
  {
    table: 'pet_services',
    type: 'pets',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: null,
    locationEn: 'district',
    locationRu: 'district',
    rating: 'rating',
    pathPrefix: '/pets/service/',
    idField: 'id'
  },
  {
    table: 'flower_shops',
    type: 'flowers',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: null,
    locationEn: 'address',
    locationRu: 'address',
    rating: 'rating',
    pathPrefix: '/flowers/shop/',
    idField: 'id'
  },
  {
    table: 'cleaning_services',
    type: 'cleaning',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: 'price_per_hour',
    locationEn: null,
    locationRu: null,
    rating: 'rating',
    pathPrefix: '/cleaning/',
    idField: 'id'
  },
  {
    table: 'babysitters',
    type: 'babysitter',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'photo',
    price: 'price_per_hour',
    locationEn: null,
    locationRu: null,
    rating: 'rating',
    pathPrefix: '/babysitter/',
    idField: 'id'
  },
  {
    table: 'pharmacies',
    type: 'pharmacy',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: null,
    locationEn: 'address',
    locationRu: 'address',
    rating: 'rating',
    pathPrefix: '/pharmacy/',
    idField: 'id'
  },
  {
    table: 'stores',
    type: 'market',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: 'cover_image',
    price: null,
    locationEn: 'address',
    locationRu: 'address',
    rating: 'rating',
    pathPrefix: '/market/store/',
    idField: 'id'
  },
  {
    table: 'services',
    type: 'services',
    titleEn: 'name_en',
    titleRu: 'name_ru',
    image: null,
    price: 'price',
    locationEn: null,
    locationRu: null,
    rating: null,
    pathPrefix: '/services/',
    idField: 'id'
  }
];

export function useGlobalSearch(query: string, enabled: boolean = true) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    
    if (!query.trim() || query.length < 2 || !enabled) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!isMounted) return;
      setIsLoading(true);
      // Use original query for ilike - it handles case-insensitivity for all languages including Cyrillic
      const searchTerm = query.trim();
      const allResults: SearchResult[] = [];

      try {
        // Search across all tables in parallel
        const searchPromises = searchTables.map(async (config) => {
          try {
            // Build select fields
            const selectFields = [
              config.idField,
              config.titleEn,
              config.titleRu,
              config.image,
              config.price,
              config.locationEn,
              config.locationRu,
              config.rating
            ].filter((f): f is string => f !== null);

            // Deduplicate select fields
            const uniqueFields = [...new Set(selectFields)];

            const { data, error } = await supabase
              .from(config.table as any)
              .select(uniqueFields.join(','))
              .or(`${config.titleEn}.ilike.%${searchTerm}%,${config.titleRu}.ilike.%${searchTerm}%`)
              .limit(5);

            if (error || !data) return [];

            return data.map((item: any) => ({
              id: item[config.idField],
              type: config.type,
              titleEn: item[config.titleEn] || '',
              titleRu: item[config.titleRu] || '',
              image: item[config.image] || null,
              price: config.price ? item[config.price] : null,
              locationEn: config.locationEn ? item[config.locationEn] : null,
              locationRu: config.locationRu ? item[config.locationRu] : null,
              rating: item[config.rating] || null,
              path: `${config.pathPrefix}${item[config.idField]}`
            }));
          } catch {
            return [];
          }
        });

        const tableResults = await Promise.all(searchPromises);
        tableResults.forEach(items => allResults.push(...items));

        // Sort by rating and limit
        allResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (isMounted) setResults(allResults.slice(0, 12));
      } catch (error) {
        console.error('Search error:', error);
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 300); // Debounce

    return () => {
      isMounted = false;
      clearTimeout(searchTimeout);
    };
  }, [query, enabled]);

  return { results, isLoading };
}
