import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  HOME_SERVICE_CATEGORY_IDS, 
  normalizeCategory, 
  ServiceDomain,
  ProviderType 
} from '@/lib/config/homeServicesTaxonomy';

export interface HomeServiceProvider {
  id: string;
  name: string;
  description_en: string | null;
  description_ru: string | null;
  business_category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  logo_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  provider_type: ProviderType | null;
  response_time_minutes: number | null;
  has_insurance: boolean | null;
  has_guarantee: boolean | null;
  service_domains: string[] | null;
}

const defaultImages: Record<string, string> = {
  'handyman': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200',
  'plumbing': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
  'electrical': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'ac': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200',
  'repair': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200',
  'security': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200',
  'home-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200',
  'deep-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200',
  'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200',
  'laundry': 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200',
  'pest': 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=200',
  'garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200',
  'pool': 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=200',
  'exterior': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
  'moving': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
  'water-delivery': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200',
  'road-assistance': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
};

interface UseHomeServicesOptions {
  category?: string;
  domain?: ServiceDomain | 'all';
  providerType?: ProviderType | 'all';
}

export function useHomeServices(options: UseHomeServicesOptions = {}) {
  const { category, domain = 'all', providerType = 'all' } = options;
  const [providers, setProviders] = useState<HomeServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchProviders() {
      setIsLoading(true);
      try {
        let query = supabase
          .from('providers')
          .select('id, name, description_en, description_ru, business_category, phone, email, address, rating, review_count, logo_url, is_verified, is_active, provider_type, response_time_minutes, has_insurance, has_guarantee, service_domains')
          .in('business_category', HOME_SERVICE_CATEGORY_IDS)
          .eq('is_active', true);

        // Filter by specific category
        if (category && category !== 'all') {
          const normalizedCategory = normalizeCategory(category);
          query = query.eq('business_category', normalizedCategory);
        }
        
        // Filter by domain
        if (domain && domain !== 'all') {
          query = query.contains('service_domains', [domain]);
        }
        
        // Filter by provider type
        if (providerType && providerType !== 'all') {
          query = query.eq('provider_type', providerType);
        }

        const { data, error } = await query.order('rating', { ascending: false, nullsFirst: false });

        if (error) throw error;
        if (isMounted) setProviders((data || []) as HomeServiceProvider[]);
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Error fetching home service providers:', err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProviders();
    
    return () => { isMounted = false; };
  }, [category, domain, providerType]);

  const getProviderImage = (provider: HomeServiceProvider) => {
    return provider.logo_url || defaultImages[provider.business_category] || defaultImages['repair'];
  };

  return { providers, isLoading, error, getProviderImage };
}
