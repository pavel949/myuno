/**
 * useEnrichCatalogItems - Batch-fetch rich entity data for LIFE OS catalog items
 * Groups items by entity_type, queries corresponding tables, merges cover images & ratings
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LifeOSCatalogItem } from '@/hooks/useLifeOS';

export interface EnrichedCatalogItem extends LifeOSCatalogItem {
  coverImage: string | null;
  rating: number | null;
  reviewCount: number | null;
  isVerified: boolean;
  is24h: boolean;
  district: string | null;
}

// Table config: maps entity_type to table name and column names
const TABLE_CONFIG: Record<string, {
  table: string;
  nameEn: string;
  nameRu: string;
  coverImage: string;
  rating?: string;
  reviewCount?: string;
  isVerified?: string;
  is24h?: string;
  district?: string;
}> = {
  clinic: {
    table: 'clinics', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified', is24h: 'is_24h', district: 'district',
  },
  restaurant: {
    table: 'restaurants', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified', district: 'district',
  },
  property: {
    table: 'properties', nameEn: 'title_en', nameRu: 'title_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified', district: 'district',
  },
  vehicle: {
    table: 'vehicles', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  experience: {
    table: 'experiences', nameEn: 'title_en', nameRu: 'title_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
  },
  tour: {
    table: 'tours', nameEn: 'title_en', nameRu: 'title_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
  },
  legal_service: {
    table: 'legal_services', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  yacht: {
    table: 'yachts', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  salon: {
    table: 'salons', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified', district: 'district',
  },
  gym: {
    table: 'gyms', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  babysitter: {
    table: 'babysitters', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'photo', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  transfer: {
    table: 'transfers', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  event: {
    table: 'events', nameEn: 'title_en', nameRu: 'title_ru',
    coverImage: 'cover_image',
  },
  water_activity: {
    table: 'water_activities', nameEn: 'title_en', nameRu: 'title_ru',
    coverImage: 'cover_image',
  },
  flower_shop: {
    table: 'flower_shops', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  cleaning: {
    table: 'cleaning_services', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
    isVerified: 'is_verified',
  },
  pet_service: {
    table: 'pet_services', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating',
    isVerified: 'is_verified',
  },
  marketplace_product: {
    table: 'marketplace_products', nameEn: 'name_en', nameRu: 'name_ru',
    coverImage: 'cover_image', rating: 'rating', reviewCount: 'review_count',
  },
};

async function fetchEntityData(entityType: string, entityIds: string[]): Promise<Record<string, Partial<EnrichedCatalogItem>>> {
  const config = TABLE_CONFIG[entityType];
  if (!config || entityIds.length === 0) return {};

  // Build select columns
  const selectCols = ['id', config.coverImage];
  if (config.rating) selectCols.push(config.rating);
  if (config.reviewCount) selectCols.push(config.reviewCount);
  if (config.isVerified) selectCols.push(config.isVerified);
  if (config.is24h) selectCols.push(config.is24h);
  if (config.district) selectCols.push(config.district);

  const { data, error } = await supabase
    .from(config.table as any)
    .select(selectCols.join(','))
    .in('id', entityIds);

  if (error || !data) return {};

  const result: Record<string, Partial<EnrichedCatalogItem>> = {};
  for (const row of data as any[]) {
    result[row.id] = {
      coverImage: row[config.coverImage] || null,
      rating: config.rating ? row[config.rating] : null,
      reviewCount: config.reviewCount ? row[config.reviewCount] : null,
      isVerified: config.isVerified ? !!row[config.isVerified] : false,
      is24h: config.is24h ? !!row[config.is24h] : false,
      district: config.district ? row[config.district] : null,
    };
  }
  return result;
}

export function useEnrichCatalogItems(catalogItems: LifeOSCatalogItem[] | undefined) {
  return useQuery({
    queryKey: ['enrich-catalog-items', catalogItems?.map(i => i.entity_id).sort().join(',')],
    queryFn: async (): Promise<EnrichedCatalogItem[]> => {
      if (!catalogItems?.length) return [];

      // Group by entity_type
      const grouped: Record<string, string[]> = {};
      for (const item of catalogItems) {
        if (!grouped[item.entity_type]) grouped[item.entity_type] = [];
        grouped[item.entity_type].push(item.entity_id);
      }

      // Batch fetch all types in parallel
      const enrichmentResults = await Promise.all(
        Object.entries(grouped).map(([type, ids]) => 
          fetchEntityData(type, ids).then(data => ({ type, data }))
        )
      );

      // Build lookup map
      const enrichmentMap: Record<string, Partial<EnrichedCatalogItem>> = {};
      for (const { data } of enrichmentResults) {
        Object.assign(enrichmentMap, data);
      }

      // Merge
      return catalogItems.map(item => ({
        ...item,
        coverImage: enrichmentMap[item.entity_id]?.coverImage ?? null,
        rating: enrichmentMap[item.entity_id]?.rating ?? null,
        reviewCount: enrichmentMap[item.entity_id]?.reviewCount ?? null,
        isVerified: enrichmentMap[item.entity_id]?.isVerified ?? false,
        is24h: enrichmentMap[item.entity_id]?.is24h ?? false,
        district: enrichmentMap[item.entity_id]?.district ?? null,
      }));
    },
    enabled: !!catalogItems?.length,
    staleTime: 3 * 60 * 1000,
  });
}
