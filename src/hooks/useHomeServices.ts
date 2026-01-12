import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

const HOME_SERVICE_CATEGORIES = [
  'cleaning', 'plumbing', 'electrical', 'ac', 'hvac', 'garden', 
  'repair', 'pest', 'pool', 'moving', 'laundry', 'road-assistance', 
  'water-delivery', 'tech', 'security'
];

const defaultImages: Record<string, string> = {
  'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200',
  'plumbing': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
  'electrical': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'ac': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200',
  'hvac': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200',
  'garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200',
  'repair': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200',
  'pest': 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=200',
  'pool': 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=200',
  'moving': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
  'laundry': 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200',
  'road-assistance': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
  'water-delivery': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200',
  'tech': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200',
  'security': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200',
};

export function useHomeServices(category?: string) {
  const [providers, setProviders] = useState<HomeServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      setIsLoading(true);
      try {
        let query = supabase
          .from('providers')
          .select('*')
          .in('business_category', HOME_SERVICE_CATEGORIES)
          .eq('is_active', true);

        if (category && category !== 'all') {
          query = query.eq('business_category', category);
        }

        const { data, error } = await query.order('rating', { ascending: false });

        if (error) throw error;
        setProviders(data || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching home service providers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviders();
  }, [category]);

  const getProviderImage = (provider: HomeServiceProvider) => {
    return provider.logo_url || defaultImages[provider.business_category] || defaultImages['repair'];
  };

  return { providers, isLoading, error, getProviderImage };
}
