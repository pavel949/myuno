import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  normalizeCategory,
} from '@/lib/taxonomies';
import type { ServiceDomain, ProviderType } from '@/lib/config/homeServicesTaxonomy';
import { HOME_SERVICE_CATEGORY_IDS } from '@/lib/config/homeServicesTaxonomy';

// Editorial-style service images
import handymanImg from '@/assets/services/handyman.jpg';
import plumbingImg from '@/assets/services/plumbing.jpg';
import electricalImg from '@/assets/services/electrical.jpg';
import acImg from '@/assets/services/ac.jpg';
import securityImg from '@/assets/services/security.jpg';
import cleaningImg from '@/assets/services/cleaning.jpg';
import laundryImg from '@/assets/services/laundry.jpg';
import pestImg from '@/assets/services/pest.jpg';
import gardenImg from '@/assets/services/garden.jpg';
import poolImg from '@/assets/services/pool.jpg';
import movingImg from '@/assets/services/moving.jpg';
import waterDeliveryImg from '@/assets/services/water-delivery.jpg';
import roadAssistanceImg from '@/assets/services/road-assistance.jpg';

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
  'handyman': handymanImg,
  'plumbing': plumbingImg,
  'electrical': electricalImg,
  'ac': acImg,
  'repair': handymanImg,
  'security': securityImg,
  'home-cleaning': cleaningImg,
  'deep-cleaning': cleaningImg,
  'cleaning': cleaningImg,
  'laundry': laundryImg,
  'pest': pestImg,
  'garden': gardenImg,
  'pool': poolImg,
  'exterior': movingImg,
  'moving': movingImg,
  'water-delivery': waterDeliveryImg,
  'road-assistance': roadAssistanceImg,
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
