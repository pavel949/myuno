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

interface RelatedConfig {
  vertical: string;
  listingVertical: string; // vertical value in listings table
  pathPrefix: string;
  ctaEn: string;
  ctaRu: string;
  limit: number;
}

// Matrix: which verticals to show for each source vertical
const RELATED_ENTITY_MAP: Record<string, RelatedConfig[]> = {
  yachts: [
    { vertical: 'flowers', listingVertical: 'bouquet', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', limit: 2 },
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
  ],
  experiences: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
    { vertical: 'flowers', listingVertical: 'bouquet', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', limit: 1 },
  ],
  property: [
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
  ],
  restaurants: [
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
    { vertical: 'flowers', listingVertical: 'bouquet', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', limit: 2 },
  ],
  tours: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
  ],
  flowers: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
    { vertical: 'yachts', listingVertical: 'yacht', pathPrefix: '/yachts', ctaEn: 'Charter', ctaRu: 'Арендовать', limit: 2 },
  ],
  transport: [
    { vertical: 'experiences', listingVertical: 'experience', pathPrefix: '/experiences', ctaEn: 'Book', ctaRu: 'Заказать', limit: 2 },
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
  ],
  fitness: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
  ],
  medical: [
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
  ],
  cleaning: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
  ],
  babysitter: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
  ],
  pets: [
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
  ],
  education: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
  ],
  events: [
    { vertical: 'restaurants', listingVertical: 'restaurant', pathPrefix: '/restaurants', ctaEn: 'Reserve', ctaRu: 'Забронировать', limit: 2 },
    { vertical: 'transport', listingVertical: 'vehicle', pathPrefix: '/transport', ctaEn: 'Rent', ctaRu: 'Арендовать', limit: 2 },
    { vertical: 'flowers', listingVertical: 'bouquet', pathPrefix: '/flowers', ctaEn: 'Order', ctaRu: 'Заказать', limit: 2 },
  ],
};

async function fetchRelatedFromListings(configs: RelatedConfig[]): Promise<RelatedEntity[]> {
  // Collect all needed verticals and max limits
  const verticals = configs.map(c => c.listingVertical);
  const maxLimit = configs.reduce((sum, c) => sum + c.limit, 0);

  const { data, error } = await supabase
    .from('listings')
    .select('id, vertical, name_en, name_ru, cover_image, rating, price, currency, is_featured')
    .in('vertical', verticals)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(maxLimit);

  if (error || !data) return [];

  const results: RelatedEntity[] = [];
  const countByVertical: Record<string, number> = {};

  for (const item of data) {
    const config = configs.find(c => c.listingVertical === item.vertical);
    if (!config) continue;

    const current = countByVertical[item.vertical] || 0;
    if (current >= config.limit) continue;
    countByVertical[item.vertical] = current + 1;

    results.push({
      id: item.id,
      title: item.name_en || '',
      image: item.cover_image || null,
      price: item.price || null,
      currency: item.currency || 'THB',
      rating: item.rating || null,
      path: `${config.pathPrefix}/${item.id}`,
      vertical: config.vertical,
      ctaEn: config.ctaEn,
      ctaRu: config.ctaRu,
    });
  }

  return results;
}

export function useRelatedEntities(currentVertical: string, enabled = true) {
  const { language } = useLanguage();
  const configs = RELATED_ENTITY_MAP[currentVertical] || [];

  return useQuery({
    queryKey: ['related-entities', currentVertical],
    queryFn: () => fetchRelatedFromListings(configs),
    enabled: enabled && configs.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
