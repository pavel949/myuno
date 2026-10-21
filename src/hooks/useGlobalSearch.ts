import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { searchStaticIndex } from '@/lib/search/staticIndex';
import { type NavSearchContext } from '@/lib/search/navigationIndex';
import { useSearchContext } from './useSearchContext';

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
  /** Set on navigation-index hits ("action" rows). */
  isAction?: boolean;
  /** Optional one-line description, used by action rows. */
  descriptionEn?: string | null;
  descriptionRu?: string | null;
}

export interface AiSmartAnswer {
  answer: string;
  suggestedCategories: string[];
  suggestedServices: Array<{ type: string; query: string; reason: string }>;
}

/** Row shape returned by the `search_catalog` Postgres RPC. */
interface CatalogSearchRow {
  entity_type: string;
  entity_id: string;
  vertical: string | null;
  title_en: string | null;
  title_ru: string | null;
  subtitle: string | null;
  path: string;
  image: string | null;
  price: number | null;
  rating: number | null;
  district: string | null;
}

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
  // Medical extras
  { keywords: ['доктор'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  { keywords: ['поликлиник'], priority: 5, result: mkCat('cat-medical', 'Medical Clinics', 'Клиники', '/medical') },
  { keywords: ['аптек'], priority: 5, result: mkCat('cat-pharmacy', 'Pharmacy', 'Аптека', '/pharmacy') },
  { keywords: ['pharmacy'], priority: 5, result: mkCat('cat-pharmacy', 'Pharmacy', 'Аптека', '/pharmacy') },
  // Legal / finance
  { keywords: ['налог'], priority: 8, result: mkCat('cat-tax', 'Taxes', 'Налоги', '/legal?service=tax') },
  { keywords: ['tax'], priority: 8, result: mkCat('cat-tax', 'Taxes', 'Налоги', '/legal?service=tax') },
  { keywords: ['accountant'], priority: 8, result: mkCat('cat-tax', 'Accountant', 'Бухгалтер', '/legal?service=tax') },
  { keywords: ['бухгалтер'], priority: 8, result: mkCat('cat-tax', 'Accountant', 'Бухгалтер', '/legal?service=tax') },
  { keywords: ['юрист'], priority: 8, result: mkCat('cat-legal', 'Legal Services', 'Юристы', '/legal') },
  { keywords: ['lawyer'], priority: 8, result: mkCat('cat-legal', 'Legal Services', 'Юристы', '/legal') },
  { keywords: ['legal'], priority: 5, result: mkCat('cat-legal', 'Legal Services', 'Юристы', '/legal') },
  { keywords: ['контракт'], priority: 8, result: mkCat('cat-contract', 'Contracts', 'Контракты', '/legal?service=contract') },
  { keywords: ['договор'], priority: 8, result: mkCat('cat-contract', 'Contracts', 'Контракты', '/legal?service=contract') },
  { keywords: ['contract'], priority: 8, result: mkCat('cat-contract', 'Contracts', 'Контракты', '/legal?service=contract') },
  { keywords: ['банк'], priority: 8, result: mkCat('cat-bank', 'Bank Account', 'Банковский счёт', '/legal?service=banking') },
  { keywords: ['bank'], priority: 8, result: mkCat('cat-bank', 'Bank Account', 'Банковский счёт', '/legal?service=banking') },
  { keywords: ['страхов'], priority: 8, result: mkCat('cat-insurance', 'Insurance', 'Страхование', '/legal?service=insurance') },
  { keywords: ['insurance'], priority: 8, result: mkCat('cat-insurance', 'Insurance', 'Страхование', '/legal?service=insurance') },
  // Visa
  { keywords: ['виз'], priority: 9, result: mkCat('cat-visa', 'Visa', 'Виза', '/visa/quiz') },
  { keywords: ['visa'], priority: 9, result: mkCat('cat-visa', 'Visa', 'Виза', '/visa/quiz') },
  { keywords: ['dtv'], priority: 10, result: mkCat('cat-visa', 'DTV Visa', 'Виза DTV', '/visa/quiz') },
  { keywords: ['elite'], priority: 8, result: mkCat('cat-visa', 'Elite Visa', 'Elite виза', '/visa/quiz') },
  // Education
  { keywords: ['школ'], priority: 8, result: mkCat('cat-school', 'Schools', 'Школы', '/school-finder') },
  { keywords: ['school'], priority: 8, result: mkCat('cat-school', 'Schools', 'Schools', '/school-finder') },
  { keywords: ['садик'], priority: 8, result: mkCat('cat-school', 'Kindergarten', 'Детский сад', '/school-finder') },
  { keywords: ['детский', 'сад'], priority: 10, result: mkCat('cat-school', 'Kindergarten', 'Детский сад', '/school-finder') },
  { keywords: ['kindergarten'], priority: 8, result: mkCat('cat-school', 'Kindergarten', 'Детский сад', '/school-finder') },
  // Home services
  { keywords: ['ремонт'], priority: 7, result: mkCat('cat-handyman', 'Handyman', 'Ремонт и мастер', '/services?category=handyman') },
  { keywords: ['handyman'], priority: 7, result: mkCat('cat-handyman', 'Handyman', 'Ремонт и мастер', '/services?category=handyman') },
  { keywords: ['электрик'], priority: 8, result: mkCat('cat-electrical', 'Electrician', 'Электрик', '/services?category=electrical') },
  { keywords: ['electrician'], priority: 8, result: mkCat('cat-electrical', 'Electrician', 'Электрик', '/services?category=electrical') },
  { keywords: ['сантехник'], priority: 8, result: mkCat('cat-plumbing', 'Plumber', 'Сантехник', '/services?category=plumbing') },
  { keywords: ['plumber'], priority: 8, result: mkCat('cat-plumbing', 'Plumber', 'Сантехник', '/services?category=plumbing') },
  { keywords: ['кондиционер'], priority: 8, result: mkCat('cat-ac', 'AC Repair', 'Кондиционеры', '/services?category=ac-repair') },
  { keywords: ['ac', 'repair'], priority: 9, result: mkCat('cat-ac', 'AC Repair', 'Кондиционеры', '/services?category=ac-repair') },
  { keywords: ['уборк'], priority: 7, result: mkCat('cat-cleaning', 'Cleaning', 'Уборка', '/cleaning') },
  { keywords: ['клининг'], priority: 7, result: mkCat('cat-cleaning', 'Cleaning', 'Клининг', '/cleaning') },
  { keywords: ['cleaning'], priority: 7, result: mkCat('cat-cleaning', 'Cleaning', 'Уборка', '/cleaning') },
  // Food
  { keywords: ['кафе'], priority: 6, result: mkCat('cat-rest', 'Restaurants', 'Рестораны и кафе', '/restaurants') },
  { keywords: ['ресторан'], priority: 6, result: mkCat('cat-rest', 'Restaurants', 'Рестораны', '/restaurants') },
  { keywords: ['restaurant'], priority: 6, result: mkCat('cat-rest', 'Restaurants', 'Рестораны', '/restaurants') },
  { keywords: ['еда'], priority: 5, result: mkCat('cat-food', 'Food Delivery', 'Доставка еды', '/food-delivery') },
  { keywords: ['food'], priority: 5, result: mkCat('cat-food', 'Food Delivery', 'Доставка еды', '/food-delivery') },
  { keywords: ['доставк'], priority: 6, result: mkCat('cat-food', 'Food Delivery', 'Доставка', '/food-delivery') },
  { keywords: ['delivery'], priority: 6, result: mkCat('cat-food', 'Food Delivery', 'Доставка', '/food-delivery') },
  { keywords: ['продукт'], priority: 6, result: mkCat('cat-market', 'Grocery', 'Продукты', '/market') },
  { keywords: ['grocery'], priority: 6, result: mkCat('cat-market', 'Grocery', 'Продукты', '/market') },
  { keywords: ['market'], priority: 5, result: mkCat('cat-market', 'Market', 'Маркет', '/market') },
  // Fitness / beauty
  { keywords: ['фитнес'], priority: 7, result: mkCat('cat-fitness', 'Fitness', 'Фитнес', '/fitness') },
  { keywords: ['gym'], priority: 7, result: mkCat('cat-fitness', 'Gym', 'Спортзал', '/fitness') },
  { keywords: ['спортзал'], priority: 7, result: mkCat('cat-fitness', 'Gym', 'Спортзал', '/fitness') },
  { keywords: ['fitness'], priority: 7, result: mkCat('cat-fitness', 'Fitness', 'Фитнес', '/fitness') },
  { keywords: ['маникюр'], priority: 7, result: mkCat('cat-nails', 'Nails', 'Маникюр', '/beauty') },
  { keywords: ['nails'], priority: 7, result: mkCat('cat-nails', 'Nails', 'Маникюр', '/beauty') },
  { keywords: ['hair'], priority: 7, result: mkCat('cat-hair', 'Hair', 'Парикмахер', '/beauty') },
  { keywords: ['парикмахер'], priority: 7, result: mkCat('cat-hair', 'Hair', 'Парикмахер', '/beauty') },
  { keywords: ['салон'], priority: 5, result: mkCat('cat-salon', 'Beauty Salon', 'Салон красоты', '/beauty') },
  // Transport extras
  { keywords: ['такси'], priority: 7, result: mkCat('cat-taxi', 'Taxi', 'Такси', '/transport') },
  { keywords: ['taxi'], priority: 7, result: mkCat('cat-taxi', 'Taxi', 'Такси', '/transport') },
  { keywords: ['тур'], priority: 6, result: mkCat('cat-tour', 'Tours', 'Туры', '/tours') },
  { keywords: ['экскурс'], priority: 7, result: mkCat('cat-tour', 'Tours', 'Экскурсии', '/tours') },
  { keywords: ['tour'], priority: 6, result: mkCat('cat-tour', 'Tours', 'Туры', '/tours') },
  // Utility
  { keywords: ['сим'], priority: 7, result: mkCat('cat-sim', 'SIM Card', 'SIM-карта', '/sim') },
  { keywords: ['sim'], priority: 7, result: mkCat('cat-sim', 'SIM Card', 'SIM-карта', '/sim') },
  { keywords: ['обмен'], priority: 7, result: mkCat('cat-exchange', 'Exchange', 'Обмен валют', '/exchange') },
  { keywords: ['валют'], priority: 7, result: mkCat('cat-exchange', 'Exchange', 'Обмен валют', '/exchange') },
  { keywords: ['exchange'], priority: 7, result: mkCat('cat-exchange', 'Exchange', 'Обмен валют', '/exchange') },
];

const CACHE_TTL_MS = 5000;
const MAX_RESULTS = 25;
const DB_RESULT_LIMIT = 12;

/** Section ordering: actions → categories → catalogue entities. */
const sectionRank = (r: SearchResult): number =>
  r.isAction ? 0 : r.isCategory ? 1 : 2;

export function useGlobalSearch(query: string, enabled: boolean = true) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AiSmartAnswer | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { language } = useLanguage();
  const searchCtx = useSearchContext();
  const cacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  // Stable ref to the context — used inside performSearch without retriggering
  // the memoised callback every render.
  const ctxRef = useRef<NavSearchContext>(searchCtx);
  ctxRef.current = searchCtx;

  const performSearch = useCallback(async (searchTerm: string) => {
    // Cancel any in-flight search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const sanitized = sanitizeSearchTerm(searchTerm);
    const searchTermLower = sanitized.toLowerCase();

    // ── Tier 1 — client static index + curated synonyms (synchronous, instant)
    const tier1 = searchStaticIndex(searchTerm, ctxRef.current, DB_RESULT_LIMIT);
    const seenPaths = new Set(tier1.map((r) => r.path));

    const matchedSynonyms = SEARCH_SYNONYM_ENTRIES
      .filter((entry) => entry.keywords.every((kw) => searchTermLower.includes(kw)))
      .sort((a, b) => b.priority - a.priority);
    for (const entry of matchedSynonyms) {
      if (!seenPaths.has(entry.result.path)) {
        seenPaths.add(entry.result.path);
        tier1.push(entry.result);
      }
    }
    tier1.sort((a, b) => sectionRank(a) - sectionRank(b));

    // Paint Tier 1 immediately — this is never cleared by a Tier 2 failure.
    setResults(tier1.slice(0, MAX_RESULTS));

    // ── Tier 2 — DB full-text catalog search (resilient)
    try {
      // search_catalog is a custom RPC not yet in generated types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('search_catalog', {
        q: sanitized,
        lang: language,
        max_results: DB_RESULT_LIMIT,
      });

      if (controller.signal.aborted) return;

      if (!error && Array.isArray(data)) {
        const entities: SearchResult[] = (data as CatalogSearchRow[]).map((row) => ({
          id: `db-${row.entity_type}-${row.entity_id}`,
          type: row.vertical || row.entity_type,
          titleEn: row.title_en || row.title_ru || '',
          titleRu: row.title_ru || row.title_en || '',
          image: row.image,
          price: row.price,
          locationEn: row.subtitle || row.district,
          locationRu: row.district || row.subtitle,
          rating: row.rating,
          path: row.path,
        }));

        const merged = [...tier1];
        for (const e of entities) {
          if (!seenPaths.has(e.path)) {
            seenPaths.add(e.path);
            merged.push(e);
          }
        }
        merged.sort((a, b) => {
          const sa = sectionRank(a);
          const sb = sectionRank(b);
          if (sa !== sb) return sa - sb;
          return (b.rating || 0) - (a.rating || 0);
        });

        const finalResults = merged.slice(0, MAX_RESULTS);
        cacheRef.current.set(searchTerm, { results: finalResults, timestamp: Date.now() });
        if (!controller.signal.aborted) setResults(finalResults);
      } else {
        // RPC failed — keep Tier 1 results, just cache them.
        cacheRef.current.set(searchTerm, { results: tier1.slice(0, MAX_RESULTS), timestamp: Date.now() });
      }
    } catch {
      // Network error — Tier 1 results stay on screen.
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [language]);

  // Optional AI smart-search call (only for question-shaped or long queries).
  const callAiSmartSearch = useCallback(async (searchTerm: string) => {
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    const QUESTION_HINTS = /\?|^(где|как|что|куда|когда|почему|какой|какая|какие|можно|посоветуй|помоги|нужн|ищу|where|how|what|when|why|which|recommend|help|find|need|looking)/i;
    const isQuestion = QUESTION_HINTS.test(searchTerm) || searchTerm.trim().split(/\s+/).length >= 4;
    if (!isQuestion) {
      setAiAnswer(null);
      setAiLoading(false);
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-search', {
        body: {
          query: searchTerm,
          language,
          personas: ctxRef.current.personas,
        },
      });
      if (controller.signal.aborted) return;
      if (error) {
        setAiAnswer(null);
      } else if (data && data.type === 'ai_answer' && data.answer) {
        setAiAnswer({
          answer: data.answer,
          suggestedCategories: data.suggestedCategories ?? [],
          suggestedServices: data.suggestedServices ?? [],
        });
      } else {
        setAiAnswer(null);
      }
    } catch {
      if (!controller.signal.aborted) setAiAnswer(null);
    } finally {
      if (!controller.signal.aborted) setAiLoading(false);
    }
  }, [language]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2 || !enabled) {
      setResults([]);
      setAiAnswer(null);
      setIsLoading(false);
      setAiLoading(false);
      abortRef.current?.abort();
      aiAbortRef.current?.abort();
      return;
    }

    // Cache hit — instant
    const cached = cacheRef.current.get(trimmed);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setResults(cached.results);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const dbTimeout = setTimeout(() => {
      if (!cached || Date.now() - cached.timestamp >= CACHE_TTL_MS) {
        performSearch(trimmed);
      }
    }, 300);

    // AI call has its own (longer) debounce and only fires for questions
    const aiTimeout = setTimeout(() => {
      callAiSmartSearch(trimmed);
    }, 600);

    return () => {
      clearTimeout(dbTimeout);
      clearTimeout(aiTimeout);
    };
  }, [query, enabled, performSearch, callAiSmartSearch]);

  return { results, isLoading, aiAnswer, aiLoading };
}
