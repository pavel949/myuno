import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  price: number | null;
  currency: string;
  duration_minutes: number | null;
  images: string[] | null;
  category_id: string | null;
  provider_id: string;
  provider?: {
    name: string;
    logo_url: string | null;
    is_verified: boolean;
  };
  category?: {
    name_en: string;
    name_ru: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string;
  icon: string | null;
  mini_app_type: string | null;
}

export type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

interface UseServicesOptions {
  categoryId?: string;
  searchQuery?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: SortOption;
  limit?: number;
}

// Demo services for when DB is empty
const demoServices: Service[] = [
  {
    id: 'demo-1',
    name_en: 'Thai Massage',
    name_ru: 'Тайский массаж',
    description_en: 'Traditional Thai massage for relaxation',
    description_ru: 'Традиционный тайский массаж для релаксации',
    price: 1500,
    currency: 'THB',
    duration_minutes: 60,
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600'],
    category_id: 'beauty',
    provider_id: 'demo-provider',
    provider: { name: 'Orchid Spa', logo_url: null, is_verified: true },
    category: { name_en: 'Beauty & Spa', name_ru: 'Красота и СПА', slug: 'beauty-spa' },
  },
  {
    id: 'demo-2',
    name_en: 'Personal Training',
    name_ru: 'Персональная тренировка',
    description_en: 'One-on-one fitness training session',
    description_ru: 'Индивидуальная фитнес-тренировка',
    price: 2000,
    currency: 'THB',
    duration_minutes: 60,
    images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600'],
    category_id: 'fitness',
    provider_id: 'demo-provider',
    provider: { name: 'Fitness First', logo_url: null, is_verified: true },
    category: { name_en: 'Fitness', name_ru: 'Фитнес', slug: 'fitness' },
  },
  {
    id: 'demo-3',
    name_en: 'Seafood Dinner',
    name_ru: 'Ужин с морепродуктами',
    description_en: 'Fresh seafood dining experience',
    description_ru: 'Ужин со свежими морепродуктами',
    price: 1200,
    currency: 'THB',
    duration_minutes: 120,
    images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600'],
    category_id: 'food',
    provider_id: 'demo-provider',
    provider: { name: 'Ocean View', logo_url: null, is_verified: false },
    category: { name_en: 'Restaurants', name_ru: 'Рестораны', slug: 'restaurants' },
  },
  {
    id: 'demo-4',
    name_en: 'Dental Checkup',
    name_ru: 'Стоматологический осмотр',
    description_en: 'Complete dental examination and cleaning',
    description_ru: 'Полный стоматологический осмотр и чистка',
    price: 2500,
    currency: 'THB',
    duration_minutes: 45,
    images: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600'],
    category_id: 'medical',
    provider_id: 'demo-provider',
    provider: { name: 'Phuket Dental', logo_url: null, is_verified: true },
    category: { name_en: 'Medical', name_ru: 'Медицина', slug: 'medical' },
  },
  {
    id: 'demo-5',
    name_en: 'Car Rental',
    name_ru: 'Аренда автомобиля',
    description_en: 'Daily car rental with insurance',
    description_ru: 'Посуточная аренда авто со страховкой',
    price: 1000,
    currency: 'THB',
    duration_minutes: 1440,
    images: ['https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600'],
    category_id: 'transport',
    provider_id: 'demo-provider',
    provider: { name: 'Phuket Cars', logo_url: null, is_verified: true },
    category: { name_en: 'Transport', name_ru: 'Транспорт', slug: 'transport' },
  },
  {
    id: 'demo-6',
    name_en: 'Island Tour',
    name_ru: 'Тур по островам',
    description_en: 'Full day island hopping tour',
    description_ru: 'Полнодневный тур по островам',
    price: 3500,
    currency: 'THB',
    duration_minutes: 480,
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'],
    category_id: 'events',
    provider_id: 'demo-provider',
    provider: { name: 'Phuket Tours', logo_url: null, is_verified: true },
    category: { name_en: 'Events & Tickets', name_ru: 'Мероприятия', slug: 'events' },
  },
];

export const useServices = (options: UseServicesOptions = {}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          provider:providers(name, logo_url, is_verified),
          category:categories(name_en, name_ru, slug)
        `)
        .eq('is_active', true);

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.searchQuery) {
        query = query.or(`name_en.ilike.%${options.searchQuery}%,name_ru.ilike.%${options.searchQuery}%`);
      }

      if (options.priceMin !== undefined) {
        query = query.gte('price', options.priceMin);
      }

      if (options.priceMax !== undefined) {
        query = query.lte('price', options.priceMax);
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
        case 'popular':
        default:
          // Default: sort by provider trust_score (popularity proxy)
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.limit(options.limit || 50);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // If no data from DB, use demo services
      if (!data || data.length === 0) {
        let filteredDemo = [...demoServices];
        
        // Filter by category slug instead of category_id for demo data
        if (options.categoryId) {
          filteredDemo = filteredDemo.filter(s => 
            s.category?.slug === options.categoryId || s.category_id === options.categoryId
          );
        }
        
        if (options.searchQuery) {
          const q = options.searchQuery.toLowerCase();
          filteredDemo = filteredDemo.filter(s => 
            s.name_en.toLowerCase().includes(q) || 
            s.name_ru.toLowerCase().includes(q)
          );
        }
        
        if (options.priceMin !== undefined) {
          filteredDemo = filteredDemo.filter(s => (s.price || 0) >= options.priceMin!);
        }
        
        if (options.priceMax !== undefined) {
          filteredDemo = filteredDemo.filter(s => (s.price || 0) <= options.priceMax!);
        }

        // Apply sorting to demo data
        if (options.sortBy === 'price_asc') {
          filteredDemo.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (options.sortBy === 'price_desc') {
          filteredDemo.sort((a, b) => (b.price || 0) - (a.price || 0));
        }
        setServices(filteredDemo);
      } else {
        setServices(data as Service[]);
      }
    } catch (err) {
      console.error('Error loading services:', err);
      setError(err as Error);
      // Fallback to demo on error
      setServices(demoServices);
    } finally {
      setIsLoading(false);
    }
  }, [options.categoryId, options.searchQuery, options.priceMin, options.priceMax, options.sortBy, options.limit]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return { services, isLoading, error, refetch: loadServices };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // First get category IDs that have services
        const { data: serviceCategories } = await supabase
          .from('services')
          .select('category_id')
          .eq('is_active', true);
        
        const categoryIds = [...new Set((serviceCategories || []).map(s => s.category_id).filter(Boolean))];
        
        if (categoryIds.length === 0) {
          // Fallback to main categories if no services exist
          const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .in('slug', ['beauty-spa', 'restaurants', 'fitness', 'medical', 'transport', 'services'])
            .order('sort_order');
          setCategories(data || []);
        } else {
          // Get categories that have services
          const { data, error } = await supabase
            .from('categories')
            .select('id, name_en, name_ru, slug, icon, mini_app_type')
            .eq('is_active', true)
            .in('id', categoryIds)
            .order('sort_order');

          if (error) throw error;
          setCategories(data || []);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, isLoading };
};
