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

// Vertical-to-path mapping for listings table
const LISTING_VERTICAL_PATHS: Record<string, string> = {
  yacht: '/yachts/',
  experience: '/tours/',
  vehicle: '/transport/vehicle/',
  restaurant: '/restaurants/',
  clinic: '/medical/clinic/',
  education: '/education/tutor/',
  bank: '/banking/',
  babysitter: '/babysitter/',
  cleaning: '/cleaning/',
  pet_service: '/pets/',
  bouquet: '/flowers/bouquet/',
};

// Tables NOT migrated to listings (still queried individually)
const searchTables: TableConfig[] = [
  { table: 'properties', type: 'property', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/property/', idField: 'id', hasApprovalStatus: true },
  { table: 'salons', type: 'beauty', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/beauty/salon/', idField: 'id', hasApprovalStatus: true },
  { table: 'gyms', type: 'fitness', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_day_pass', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/fitness/gym/', idField: 'id', hasApprovalStatus: true },
  { table: 'events', type: 'events', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'location_name', locationRu: 'location_ru', rating: 'rating', pathPrefix: '/events/', idField: 'id', hasApprovalStatus: true },
  { table: 'water_activities', type: 'water', titleEn: 'title_en', titleRu: 'title_ru', image: 'cover_image', price: 'price', locationEn: 'location_name', locationRu: 'location_name', rating: 'rating', pathPrefix: '/water/', idField: 'id', hasApprovalStatus: true },
  // tours: migrated to listings.experience — searched via unified listings query above
  { table: 'legal_services', type: 'legal', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price_consultation', locationEn: 'district', locationRu: 'district', rating: 'rating', pathPrefix: '/legal/provider/', idField: 'id', hasApprovalStatus: true },
  { table: 'flower_shops', type: 'flowers', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/flowers/shop/', idField: 'id', hasApprovalStatus: true },
  { table: 'pharmacies', type: 'pharmacy', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/pharmacy/', idField: 'id', hasApprovalStatus: true },
  { table: 'stores', type: 'market', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: null, locationEn: 'address', locationRu: 'address', rating: 'rating', pathPrefix: '/market/store/', idField: 'id', hasApprovalStatus: true },
  { table: 'services', type: 'services', titleEn: 'name_en', titleRu: 'name_ru', image: null, price: 'price', locationEn: null, locationRu: null, rating: null, pathPrefix: '/services/provider/', idField: 'id', hasApprovalStatus: true },
  { table: 'marketplace_products', type: 'product', titleEn: 'name_en', titleRu: 'name_ru', image: 'cover_image', price: 'price', locationEn: 'vendor_name', locationRu: 'vendor_name_ru', rating: 'rating', pathPrefix: '/market/product/', idField: 'id', hasApprovalStatus: false },
  { table: 'marketplace_categories', type: 'marketCategory', titleEn: 'name_en', titleRu: 'name_ru', image: 'image_url', price: null, locationEn: null, locationRu: null, rating: null, pathPrefix: '/market/category/', idField: 'slug', hasApprovalStatus: false },
];

// Keyword synonyms: each entry has keywords (all must match) and priority (higher = preferred)
interface SynonymEntry {
  keywords: string[];
  priority: number;
  result: SearchResult;
}

const mkCat = (id: string, en: string, ru: string, path: string): SearchResult => ({
  id, type: 'category', titleEn: en, titleRu: ru, image: null, price: null,
  locationEn: null, locationRu: null, rating: null, path, isCategory: true,
});

const SEARCH_SYNONYM_ENTRIES: SynonymEntry[] = [
  // Transport - specific (higher priority)
  { keywords: ['scooter'], priority: 10, result: mkCat('cat-scooter', 'Scooter Rental', 'Аренда скутера', '/transport?type=scooter') },
  { keywords: ['скутер'], priority: 10, result: mkCat('cat-scooter', 'Scooter Rental', 'Аренда скутера', '/transport?type=scooter') },
  { keywords: ['мотобайк'], priority: 10, result: mkCat('cat-scooter', 'Scooter Rental', 'Аренда мотобайка', '/transport?type=scooter') },
  { keywords: ['bike'], priority: 10, result: mkCat('cat-bike', 'Motorbike Rental', 'Аренда мотобайка', '/transport?type=scooter') },
  { keywords: ['car', 'rent'], priority: 10, result: mkCat('cat-car', 'Car Rental', 'Аренда авто', '/transport') },
  { keywords: ['авто'], priority: 10, result: mkCat('cat-car', 'Car Rental', 'Аренда авто', '/transport') },
  { keywords: ['машин'], priority: 10, result: mkCat('cat-car', 'Car Rental', 'Аренда авто', '/transport') },
  { keywords: ['аренда', 'скутер'], priority: 20, result: mkCat('cat-scooter', 'Scooter Rental', 'Аренда скутера', '/transport?type=scooter') },
  { keywords: ['аренда', 'авто'], priority: 20, result: mkCat('cat-car', 'Car Rental', 'Аренда авто', '/transport') },
  { keywords: ['аренда', 'машин'], priority: 20, result: mkCat('cat-car', 'Car Rental', 'Аренда авто', '/transport') },
  { keywords: ['аренда', 'мото'], priority: 20, result: mkCat('cat-scooter', 'Motorbike Rental', 'Аренда мотобайка', '/transport?type=scooter') },
  { keywords: ['аренда', 'байк'], priority: 20, result: mkCat('cat-scooter', 'Motorbike Rental', 'Аренда мотобайка', '/transport?type=scooter') },
  // Property - generic (lower priority)
  { keywords: ['rent'], priority: 5, result: mkCat('cat-rent', 'Property Rentals', 'Аренда жилья', '/property?mode=rent') },
  { keywords: ['rental'], priority: 5, result: mkCat('cat-rent', 'Property Rentals', 'Аренда жилья', '/property?mode=rent') },
  { keywords: ['аренда'], priority: 1, result: mkCat('cat-rent', 'Property Rentals', 'Аренда жилья', '/property?mode=rent') },
  { keywords: ['villa'], priority: 5, result: mkCat('cat-villa', 'Villas', 'Виллы', '/property?type=villa') },
  { keywords: ['вилла'], priority: 5, result: mkCat('cat-villa', 'Villas', 'Виллы', '/property?type=villa') },
  { keywords: ['condo'], priority: 5, result: mkCat('cat-condo', 'Condos', 'Кондо', '/property?type=condo') },
  { keywords: ['кондо'], priority: 5, result: mkCat('cat-condo', 'Condos', 'Кондо', '/property?type=condo') },
  { keywords: ['apartment'], priority: 5, result: mkCat('cat-apt', 'Apartments', 'Квартиры', '/property?type=apartment') },
  { keywords: ['квартира'], priority: 5, result: mkCat('cat-apt', 'Apartments', 'Квартиры', '/property?type=apartment') },
  { keywords: ['house'], priority: 5, result: mkCat('cat-house', 'Houses', 'Дома', '/property?type=house') },
  // Medical
  { keywords: ['dentist'], priority: 10, result: mkCat('cat-dentist', 'Dental Clinics', 'Стоматология', '/medical?specialty=dental') },
  { keywords: ['стоматолог'], priority: 10, result: mkCat('cat-dentist', 'Dental Clinics', 'Стоматология', '/medical?specialty=dental') },
  { keywords: ['стоматолог'], priority: 10, result: mkCat('cat-dentist', 'Dental Clinics', 'Стоматология', '/medical?specialty=dental') },
  { keywords: ['зубн'], priority: 10, result: mkCat('cat-dentist', 'Dental Clinics', 'Стоматология', '/medical?specialty=dental') },
  { keywords: ['dental'], priority: 10, result: mkCat('cat-dentist', 'Dental Clinics', 'Стоматология', '/medical?specialty=dental') },
  { keywords: ['doctor'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  { keywords: ['врач'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  { keywords: ['клиник'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  { keywords: ['больниц'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  { keywords: ['hospital'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  // Transport
  { keywords: ['transfer'], priority: 5, result: mkCat('cat-transfer', 'Airport Transfer', 'Трансфер из аэропорта', '/transport/airport-transfer') },
  { keywords: ['airport'], priority: 5, result: mkCat('cat-transfer', 'Airport Transfer', 'Трансфер из аэропорта', '/transport/airport-transfer') },
  { keywords: ['трансфер'], priority: 5, result: mkCat('cat-transfer', 'Airport Transfer', 'Трансфер из аэропорта', '/transport/airport-transfer') },
  { keywords: ['аэропорт'], priority: 5, result: mkCat('cat-transfer', 'Airport Transfer', 'Трансфер из аэропорта', '/transport/airport-transfer') },
  // Yacht
  { keywords: ['yacht'], priority: 5, result: mkCat('cat-yacht', 'Yachts', 'Яхты', '/yachts') },
  { keywords: ['яхт'], priority: 5, result: mkCat('cat-yacht', 'Yachts', 'Яхты', '/yachts') },
  // Beauty
  { keywords: ['массаж'], priority: 5, result: mkCat('cat-massage', 'Massage & Spa', 'Массаж и спа', '/beauty') },
  { keywords: ['massage'], priority: 5, result: mkCat('cat-massage', 'Massage & Spa', 'Массаж и спа', '/beauty') },
  { keywords: ['spa'], priority: 5, result: mkCat('cat-spa', 'Spa', 'Спа', '/beauty') },
  { keywords: ['спа'], priority: 5, result: mkCat('cat-spa', 'Spa', 'Спа', '/beauty') },
];

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

    // 1. Synonym matches — pick highest-priority entries where ALL keywords match
    const matchedSynonyms: SynonymEntry[] = [];
    for (const entry of SEARCH_SYNONYM_ENTRIES) {
      const allMatch = entry.keywords.every(kw => searchTermLower.includes(kw));
      if (allMatch) {
        matchedSynonyms.push(entry);
      }
    }
    // Sort by priority desc, deduplicate by result id
    matchedSynonyms.sort((a, b) => b.priority - a.priority);
    const seenIds = new Set<string>();
    for (const entry of matchedSynonyms) {
      if (!seenIds.has(entry.result.id)) {
        seenIds.add(entry.result.id);
        allResults.push(entry.result);
      }
    }

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
        categoryData.forEach((cat) => {
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

      // 3. Unified listings search (migrated verticals)
      try {
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, vertical, name_en, name_ru, cover_image, price, address, district, rating')
          .eq('is_active', true)
          .or(`name_en.ilike.%${searchTerm}%,name_ru.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
          .limit(10);

        if (controller.signal.aborted) return;

        if (listingsData) {
          listingsData.forEach((item) => {
            const pathPrefix = LISTING_VERTICAL_PATHS[item.vertical] || `/${item.vertical}/`;
            allResults.push({
              id: item.id,
              type: item.vertical,
              titleEn: item.name_en || '',
              titleRu: item.name_ru || '',
              image: item.cover_image,
              price: item.price,
              locationEn: item.address || item.district,
              locationRu: item.district,
              rating: item.rating,
              path: `${pathPrefix}${item.id}`,
            });
          });
        }
      } catch {
        // Listings query failed silently
      }

      // 4. Non-migrated entity tables in parallel
      const searchPromises = searchTables.map(async (config) => {
        try {
          const selectFields = [
            config.idField, config.titleEn, config.titleRu,
            config.image, config.price, config.locationEn,
            config.locationRu, config.rating,
          ].filter((f): f is string => f !== null);

          const uniqueFields = [...new Set(selectFields)];

          // Build OR filter — always search title fields, plus extra fields for some tables
          const orParts = [`${config.titleEn}.ilike.%${searchTerm}%,${config.titleRu}.ilike.%${searchTerm}%`];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let queryBuilder = (supabase.from as any)(config.table)
            .select(uniqueFields.join(','))
            .eq('is_active', true)
            .or(orParts.join(','))
            .limit(3);

          if (config.hasApprovalStatus) {
            queryBuilder = queryBuilder.eq('approval_status', 'approved');
          }

          const { data, error } = await queryBuilder;
          
          if (error) return [];
          if (!data) return [];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return data.map((item: Record<string, any>) => ({
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
        } catch {
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
    } catch {
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
