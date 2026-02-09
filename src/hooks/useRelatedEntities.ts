import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface RelatedEntity {
  id: string;
  title: string;
  image: string | null;
  price: number | null;
  currency: string;
  rating: number | null;
  path: string;
  vertical: string;
  ctaEn: string;
  ctaRu: string;
  subtitleEn?: string;
  subtitleRu?: string;
}

// Matrix: which verticals to show for each source vertical, with table/query config
const RELATED_ENTITY_MAP: Record<string, Array<{
  vertical: string;
  table: string;
  nameEn: string;
  nameRu: string;
  pathPrefix: string;
  ctaEn: string;
  ctaRu: string;
  subtitleField?: string;
  priceField: string;
  limit: number;
}>> = {
  yachts: [
    { vertical: 'flowers', table: 'bouquets', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', priceField: 'price', limit: 2 },
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
  ],
  experiences: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'flowers', table: 'bouquets', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', priceField: 'price', limit: 1 },
  ],
  property: [
    { vertical: 'services', table: 'services', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/services', ctaEn: 'Book', ctaRu: 'Заказать', priceField: 'price', limit: 2 },
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
  ],
  restaurants: [
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'flowers', table: 'bouquets', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', priceField: 'price', limit: 2 },
    { vertical: 'beauty', table: 'salons', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/beauty', ctaEn: 'Book', ctaRu: 'Записаться', priceField: 'price_from', limit: 2 },
  ],
  beauty: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'flowers', table: 'bouquets', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', priceField: 'price', limit: 2 },
  ],
  tours: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
  ],
  flowers: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'yachts', table: 'yachts', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/yachts', ctaEn: 'Charter', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
  ],
  transport: [
    { vertical: 'experiences', table: 'experiences', nameEn: 'title_en', nameRu: 'title_ru', pathPrefix: '/experiences', ctaEn: 'Book', ctaRu: 'Заказать', priceField: 'price', limit: 2 },
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
  ],
  fitness: [
    { vertical: 'beauty', table: 'salons', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/beauty', ctaEn: 'Book', ctaRu: 'Записаться', priceField: 'price_from', limit: 2 },
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
  ],
  medical: [
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'beauty', table: 'salons', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/beauty', ctaEn: 'Book', ctaRu: 'Записаться', priceField: 'price_from', limit: 2 },
  ],
  cleaning: [
    { vertical: 'beauty', table: 'salons', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/beauty', ctaEn: 'Book', ctaRu: 'Записаться', priceField: 'price_from', limit: 2 },
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
  ],
  babysitter: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'beauty', table: 'salons', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/beauty', ctaEn: 'Book', ctaRu: 'Записаться', priceField: 'price_from', limit: 2 },
  ],
  pets: [
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'beauty', table: 'salons', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/beauty', ctaEn: 'Book', ctaRu: 'Записаться', priceField: 'price_from', limit: 2 },
  ],
  insurance: [
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
  ],
  education: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
  ],
  events: [
    { vertical: 'restaurants', table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', priceField: 'price_range', limit: 2 },
    { vertical: 'transport', table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', priceField: 'price_per_day', limit: 2 },
    { vertical: 'flowers', table: 'bouquets', nameEn: 'name_en', nameRu: 'name_ru', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', priceField: 'price', limit: 2 },
  ],
};

async function fetchFeaturedEntities(config: typeof RELATED_ENTITY_MAP[string][0]): Promise<RelatedEntity[]> {
  const { table, pathPrefix, ctaEn, ctaRu, priceField, limit, vertical } = config;

  let data: any[] | null = null;
  let error: any = null;

  if (table === 'experiences') {
    const res = await supabase
      .from('experiences')
      .select('id, title_en, title_ru, cover_image, rating, is_featured, price')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else if (table === 'bouquets') {
    const res = await supabase
      .from('bouquets')
      .select('id, name_en, name_ru, image, price, is_popular, shop_id')
      .eq('is_active', true)
      .eq('is_popular', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else if (table === 'restaurants') {
    const res = await supabase
      .from('restaurants')
      .select('id, name_en, name_ru, cover_image, rating, is_featured, price_range')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else if (table === 'vehicles') {
    const res = await supabase
      .from('vehicles')
      .select('id, name_en, name_ru, cover_image, rating, is_featured, price_per_day')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else if (table === 'salons') {
    const res = await supabase
      .from('salons')
      .select('id, name_en, name_ru, cover_image, rating, is_featured, price_from')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else if (table === 'yachts') {
    const res = await supabase
      .from('yachts')
      .select('id, name_en, name_ru, cover_image, rating, is_featured, price_per_day')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else if (table === 'services') {
    const res = await (supabase
      .from('services') as any)
      .select('id, name_en, name_ru, cover_image, rating, is_featured, price')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit);
    data = res.data;
    error = res.error;
  } else {
    return [];
  }

  if (error || !data) return [];

  return (data as any[]).map((item) => ({
    id: item.id,
    title: item.title_en || item.name_en || '',
    image: item.cover_image || item.image || null,
    price: item[priceField] || item.price || null,
    currency: item.currency || 'THB',
    rating: item.rating || null,
    path: `${pathPrefix}/${item.id}`,
    vertical,
    ctaEn,
    ctaRu,
  }));
}

export function useRelatedEntities(currentVertical: string, enabled = true) {
  const { language } = useLanguage();
  
  const configs = RELATED_ENTITY_MAP[currentVertical] || [];

  return useQuery({
    queryKey: ['related-entities', currentVertical],
    queryFn: async () => {
      const results = await Promise.all(configs.map(fetchFeaturedEntities));
      return results.flat().filter(e => e.image); // Only return entities with images
    },
    enabled: enabled && configs.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
  });
}
