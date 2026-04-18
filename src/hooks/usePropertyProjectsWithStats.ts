/**
 * Hook to fetch property projects with aggregated stats (rent/sale counts, min prices)
 * Uses optimized RPC call or raw SQL for efficient aggregation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectWithStats {
  id: string;
  nameEn: string;
  nameRu: string;
  coverImage: string | null;
  district: string | null;
  isFeatured: boolean;
  rentCount: number;
  saleCount: number;
  minRentPrice: number | null;
  minSalePrice: number | null;
  amenities: string[] | null;
  priceFrom: number | null;
}

export function usePropertyProjectsWithStats() {
  return useQuery({
    queryKey: ['property-projects-with-stats'],
    queryFn: async (): Promise<ProjectWithStats[]> => {
      // Fetch projects first
      const { data: projects, error: projectsError } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru, cover_image, district, is_featured, amenities, price_from')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name_en');

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      // Fetch all active properties to compute stats client-side
      // (Since we can't use RPC without migration, this is efficient for small datasets)
      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('id, project_id, listing_type, price_per_night, sale_price')
        .eq('is_active', true)
        .not('project_id', 'is', null);

      if (propsError) throw propsError;

      // Aggregate stats per project
      const statsMap = new Map<string, {
        rentCount: number;
        saleCount: number;
        minRentPrice: number | null;
        minSalePrice: number | null;
      }>();

      for (const prop of properties || []) {
        if (!prop.project_id) continue;

        if (!statsMap.has(prop.project_id)) {
          statsMap.set(prop.project_id, {
            rentCount: 0,
            saleCount: 0,
            minRentPrice: null,
            minSalePrice: null,
          });
        }

        const stats = statsMap.get(prop.project_id)!;

        if (prop.listing_type === 'rent') {
          stats.rentCount++;
          const rentPrice = prop.price_per_night;
          if (rentPrice && (stats.minRentPrice === null || rentPrice < stats.minRentPrice)) {
            stats.minRentPrice = rentPrice;
          }
        } else if (prop.listing_type === 'sale') {
          stats.saleCount++;
          const salePrice = prop.sale_price;
          if (salePrice && (stats.minSalePrice === null || salePrice < stats.minSalePrice)) {
            stats.minSalePrice = salePrice;
          }
        }
      }

      // Map projects with stats
      return projects.map((p) => {
        const stats = statsMap.get(p.id) || {
          rentCount: 0,
          saleCount: 0,
          minRentPrice: null,
          minSalePrice: null,
        };

        return {
          id: p.id,
          nameEn: p.name_en,
          nameRu: p.name_ru,
          coverImage: p.cover_image,
          district: p.district,
          isFeatured: p.is_featured || false,
          amenities: p.amenities,
          priceFrom: (p as any).price_from || null,
          ...stats,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
