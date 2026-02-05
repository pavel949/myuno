 /**
  * Hook to fetch cleaning services from database
  * Replaces hardcoded cleaningServices object
  */
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface CleaningService {
   id: string;
   nameEn: string;
   nameRu: string;
   descEn?: string;
   descRu?: string;
   price: number;
   duration: string;
   providerId?: string;
 }
 
// Extended type for CleaningIndex page (matches DB schema)
export interface CleaningServiceFull {
  id: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  price_fixed?: number;
  price_per_hour?: number;
  price: number;
  duration_hours?: number;
  cover_image?: string;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  service_type?: string;
  features?: string[];
  provider_id?: string;
}

 // Fallback data
 const FALLBACK_SERVICES: CleaningService[] = [
   { id: 'clean-regular', nameEn: 'Regular Home Cleaning', nameRu: 'Регулярная уборка', price: 800, duration: '2-3h' },
   { id: 'clean-deep', nameEn: 'Deep Cleaning', nameRu: 'Генеральная уборка', price: 2500, duration: '4-6h' },
   { id: 'clean-office', nameEn: 'Office Cleaning', nameRu: 'Уборка офиса', price: 1500, duration: '3-4h' },
   { id: 'clean-movein', nameEn: 'Move-in/out Cleaning', nameRu: 'Уборка при въезде/выезде', price: 3000, duration: '5-7h' },
   { id: 'clean-dry', nameEn: 'Dry Cleaning', nameRu: 'Химчистка', price: 300, duration: '48h' },
 ];
 
/**
 * Hook for CleaningBooking page - simplified format
 */
export function useCleaningServicesSimple() {
  const query = useQuery({
    queryKey: ['cleaning-services-simple'],
     queryFn: async (): Promise<CleaningService[]> => {
       // Fetch from services table where name contains 'clean'
       const { data, error } = await supabase
         .from('services')
         .select('id, name_en, name_ru, description_en, description_ru, price, duration_minutes, provider_id')
         .eq('is_active', true)
         .or('name_en.ilike.%clean%,name_en.ilike.%laundry%,name_en.ilike.%iron%')
         .order('price');
 
       if (error || !data?.length) {
         console.warn('Using fallback cleaning services');
         return FALLBACK_SERVICES;
       }
 
       return data.map((item) => ({
         id: item.id,
         nameEn: item.name_en,
         nameRu: item.name_ru,
         descEn: item.description_en || undefined,
         descRu: item.description_ru || undefined,
         price: Number(item.price) || 0,
         duration: item.duration_minutes 
           ? `${Math.floor(item.duration_minutes / 60)}h${item.duration_minutes % 60 ? ` ${item.duration_minutes % 60}m` : ''}`
           : '2-3h',
         providerId: item.provider_id || undefined,
       }));
     },
     staleTime: 1000 * 60 * 10,
   });
  
  return {
    ...query,
    services: query.data || [],
  };
 }
 
/**
 * Hook for CleaningIndex page - full DB format
 */
export function useCleaningServices(serviceType?: string) {
  const query = useQuery({
    queryKey: ['cleaning-services-full', serviceType],
    queryFn: async (): Promise<CleaningServiceFull[]> => {
      let queryBuilder = supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .or('name_en.ilike.%clean%,name_en.ilike.%laundry%,name_en.ilike.%iron%,name_en.ilike.%dry%')
        .order('price');

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching cleaning services:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        name_en: item.name_en,
        name_ru: item.name_ru,
        description_en: item.description_en,
        description_ru: item.description_ru,
        price_fixed: Number(item.price) || 0,
        price_per_hour: undefined,
        price: Number(item.price) || 0,
        duration_hours: item.duration_minutes ? item.duration_minutes / 60 : undefined,
        cover_image: item.images?.[0],
        is_verified: item.is_verified,
        rating: undefined,
        review_count: undefined,
        service_type: serviceType !== 'all' ? serviceType : undefined,
        features: item.tags || [],
        provider_id: item.provider_id,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });

  return {
    ...query,
    services: query.data || [],
  };
}

/**
 * Get single service for booking page
 */
export function useCleaningService(serviceId?: string) {
  const { services, isLoading } = useCleaningServicesSimple();
   
   const service = services?.find(s => s.id === serviceId) || services?.[0];
   
   return { service, isLoading, services };
 }