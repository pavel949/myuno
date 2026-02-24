import { useState, useEffect, useRef, useCallback } from 'react';
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
  isCategory?: boolean;
}

interface TableConfig {
  table: string;
  type: string;
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

const searchTables: TableConfig[] = [
  { table: 'yachts', type: 'yachts', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_full_day', locationEn: 'location_name', locationRu: 'location_ru', rating: 'rating', pathPrefix: '/yachts/', idField: 'id', hasApprovalStatus: true },
  { table: 'tours', type: 'tours', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'meeting_point', locationRu: 'meeting_point', rating: 'rating', pathPrefix: '/tours/', idField: 'id', hasApprovalStatus: true },
  { table: 'properties', type: 'property', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/property/', idField: 'id', hasApprovalStatus: true },
  { table: 'restaurants', type: 'food', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/restaurants/', idField: 'id', hasApprovalStatus: true },
  { table: 'salons', type: 'beauty', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/beauty/salon/', idField: 'id', hasApprovalStatus: true },
  { table: 'clinics', type: 'medical', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'consultation_price', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/medical/clinic/', idField: 'id', hasApprovalStatus: true },
  { table: 'gyms', type: 'fitness', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_day_pass', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/fitness/gym/', idField: 'id', hasApprovalStatus: true },
  { table: 'vehicles', type: 'transport', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_per_day', locationEn: null, locationRu: null, rating: 'rating', pathPrefix: '/transport/vehicle/', idField: 'id', hasApprovalStatus: true },
  { table: 'events', type: 'events', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'location_name', locationRu: 'location_ru', rating: 'rating', pathPrefix: '/events/', idField: 'id', hasApprovalStatus: true },
  { table: 'water_activities', type: 'water', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'location_name', locationRu: 'location_name', rating: 'rating', pathPrefix: '/water/', idField: 'id', hasApprovalStatus: true },
  { table: 'education_providers', type: 'education', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_per_hour', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/education/tutor/', idField: 'id', hasApprovalStatus: true },
  { table: 'legal_services', type: 'legal', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_consultation', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/legal/provider/', idField: 'id', hasApprovalStatus: true },
  { table: 'pet_services', type: 'pets', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/pets/', idField: 'id', hasApprovalStatus: true },
  { table: 'flower_shops', type: 'flowers', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/flowers/shop/', idField: 'id', hasApprovalStatus: true },
  { table: 'cleaning_services', type: 'cleaning', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_per_hour', locationEn: null, locationRu: null, rating: 'rating', pathPrefix: '/cleaning/', idField: 'id', hasApprovalStatus: true },
  { table: 'babysitters', type: 'babysitter', titleEn: 'name_en', titleRu: 'name_ru', image: 'photo', price: 'price_per_hour', locationEn: null, locationRu: null, rating: 'rating', pathPrefix: '/babysitter/', idField: 'id', hasApprovalStatus: true },
  { table: 'pharmacies', type: 'pharmacy', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/pharmacy/', idField: 'id', hasApprovalStatus: true },
  { table: 'stores', type: 'market', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/market/store/', idField: 'id', hasApprovalStatus: true },
  { table: 'services', type: 'services', titleEn: 'name_en', titleRu: 'name_ru', image: null, price: 'price', locationEn: null, locationRu: null, rating: null, pathPrefix: '/services/provider/', idField: 'id', hasApprovalStatus: true },
  { table: 'marketplace_products', type: 'product', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price', locationEn: 'vendor_name', locationRu: 'vendor_name_ru', rating: 'rating', pathPrefix: '/market/product/', idField: 'id', hasApprovalStatus: false },
  { table: 'marketplace_categories', type: 'marketCategory', titleEn: 'name_en', titleRu: 'name_ru', image: 'image_url', price: null, locationEn: null, locationRu: null, rating: null, pathPrefix: '/market/category/', idField: 'slug', hasApprovalStatus: false },
];

// Keyword synonyms for common searches
const SEARCH_SYNONYMS: Record<string, SearchResult> = {
  'rent': { id: 'cat-rent', type: 'category', titleEn: 'Property Rentals', titleRu: 'Аренда жилья', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?mode=rent', isCategory: true },
  'rental': { id: 'cat-rent', type: 'category', titleEn: 'Property Rentals', titleRu: 'Аренда жилья', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?mode=rent', isCategory: true },
  'villa': { id: 'cat-villa', type: 'category', titleEn: 'Villas', titleRu: 'Виллы', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=villa', isCategory: true },
  'condo': { id: 'cat-condo', type: 'category', titleEn: 'Condos', titleRu: 'Кондо', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=condo', isCategory: true },
  'apartment': { id: 'cat-apt', type: 'category', titleEn: 'Apartments', titleRu: 'Квартиры', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=apartment', isCategory: true },
  'house': { id: 'cat-house', type: 'category', titleEn: 'Houses', titleRu: 'Дома', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=house', isCategory: true },
  'аренда': { id: 'cat-rent', type: 'category', titleEn: 'Property Rentals', titleRu: 'Аренда жилья', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?mode=rent', isCategory: true },
  'вилла': { id: 'cat-villa', type: 'category', titleEn: 'Villas', titleRu: 'Виллы', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=villa', isCategory: true },
  'квартира': { id: 'cat-apt', type: 'category', titleEn: 'Apartments', titleRu: 'Квартиры', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=apartment', isCategory: true },
  'кондо': { id: 'cat-condo', type: 'category', titleEn: 'Condos', titleRu: 'Кондо', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/property?type=condo', isCategory: true },
  'transfer': { id: 'cat-transfer', type: 'category', titleEn: 'Airport Transfer', titleRu: 'Трансфер из аэропорта', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/transport/airport-transfer', isCategory: true },
  'airport': { id: 'cat-transfer', type: 'category', titleEn: 'Airport Transfer', titleRu: 'Трансфер из аэропорта', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/transport/airport-transfer', isCategory: true },
  'трансфер': { id: 'cat-transfer', type: 'category', titleEn: 'Airport Transfer', titleRu: 'Трансфер из аэропорта', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/transport/airport-transfer', isCategory: true },
  'аэропорт': { id: 'cat-transfer', type: 'category', titleEn: 'Airport Transfer', titleRu: 'Трансфер из аэропорта', image: null, price: null, locationEn: null, locationRu: null, rating: null, path: '/transport/airport-transfer', isCategory: true },
};

const CACHE_TTL_MS = 5000;

export function useGlobalSearch(query: string, enabled: boolean = true) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const cacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchTerm: string) => {
    // Cancel any in-flight search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const searchTermLower = searchTerm.toLowerCase();
    const allResults: SearchResult[] = [];

    // 1. Synonym matches (instant)
    Object.entries(SEARCH_SYNONYMS).forEach(([keyword, result]) => {
      if (searchTermLower.includes(keyword) || keyword.includes(searchTermLower)) {
        if (!allResults.find(r => r.id === result.id)) {
          allResults.push(result);
        }
      }
    });

    try {
      // 2. Category matches
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, slug, name_en, name_ru, icon, color, mini_app_type')
        .eq('is_active', true)
        .or(`name_en.ilike.%${searchTerm}%,name_ru.ilike.%${searchTerm}%`)
        .limit(4);

      if (controller.signal.aborted) return;

      if (categoryData) {
        categoryData.forEach((cat: any) => {
          let path = `/${cat.slug}`;
          if (cat.mini_app_type) {
            const typePathMap: Record<string, string> = {
              'real-estate': '/property',
              'property': '/property',
              'beauty-spa': '/beauty',
              'beauty': '/beauty',
              'medical': '/medical',
              'transport': '/transport',
              'tours': '/tours',
              'restaurants': '/restaurants',
              'food': '/restaurants',
              'fitness': '/fitness',
              'yachts': '/yachts',
              'services': '/services',
              'education': '/education',
              'legal': '/legal',
              'pets': '/pets',
              'pharmacy': '/pharmacy',
              'flowers': '/flowers',
              'transfers': '/transport/airport-transfer',
              'events': '/events',
              'marketplace': '/market',
              'food-delivery': '/food-delivery',
              'visa': '/visa',
            };
            path = typePathMap[cat.mini_app_type] || `/${cat.slug}`;
          }
          allResults.push({
            id: `cat-${cat.id}`,
            type: 'category',
            titleEn: cat.name_en,
            titleRu: cat.name_ru,
            image: null,
            price: null,
            locationEn: null,
            locationRu: null,
            rating: null,
            path,
            isCategory: true,
          });
        });
      }

      // 3. Entity tables in parallel
      const searchPromises = searchTables.map(async (config) => {
        try {
          const selectFields = [
            config.idField, config.titleEn, config.titleRu,
            config.image, config.price, config.locationEn,
            config.locationRu, config.rating,
          ].filter((f): f is string => f !== null);

          const uniqueFields = [...new Set(selectFields)];

          let queryBuilder = supabase
            .from(config.table as any)
            .select(uniqueFields.join(','))
            .eq('is_active', true)
            .or(`${config.titleEn}.ilike.%${searchTerm}%,${config.titleRu}.ilike.%${searchTerm}%`)
            .limit(3);

          if (config.hasApprovalStatus) {
            queryBuilder = queryBuilder.eq('approval_status', 'approved');
          }

          const { data, error } = await queryBuilder;
          
          if (error) {
            console.warn(`Search: ${config.table} query failed:`, error.message);
            return [];
          }
          if (!data) return [];

          return data.map((item: any) => ({
            id: item[config.idField],
            type: config.type,
            titleEn: item[config.titleEn] || '',
            titleRu: item[config.titleRu] || '',
            image: config.image ? item[config.image] : null,
            price: config.price ? item[config.price] : null,
            locationEn: config.locationEn ? item[config.locationEn] : null,
            locationRu: config.locationRu ? item[config.locationRu] : null,
            rating: config.rating ? item[config.rating] : null,
            path: `${config.pathPrefix}${item[config.idField]}`,
          }));
        } catch (err) {
          console.warn(`Search: ${config.table} error:`, err);
          return [];
        }
      });

      const tableResults = await Promise.all(searchPromises);
      
      if (controller.signal.aborted) return;
      
      tableResults.forEach(items => allResults.push(...items));

      // Sort: categories first, then by rating
      allResults.sort((a, b) => {
        if (a.isCategory && !b.isCategory) return -1;
        if (!a.isCategory && b.isCategory) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      const finalResults = allResults.slice(0, 15);

      // Cache results
      cacheRef.current.set(searchTerm, { results: finalResults, timestamp: Date.now() });

      if (!controller.signal.aborted) {
        setResults(finalResults);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (!controller.signal.aborted) {
        setResults([]);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2 || !enabled) {
      setResults([]);
      setIsLoading(false);
      abortRef.current?.abort();
      return;
    }

    // Check cache first
    const cached = cacheRef.current.get(trimmed);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setResults(cached.results);
      setIsLoading(false);
      return;
    }

    // Set loading IMMEDIATELY (not inside timeout) to prevent "no results" flash
    setIsLoading(true);

    const timeout = setTimeout(() => {
      performSearch(trimmed);
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [query, enabled, performSearch]);

  return { results, isLoading };
}
