import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export interface Pharmacy {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: Record<string, string>;
  delivery_available: boolean;
  delivery_fee: number;
  delivery_radius_km: number;
  min_order_amount: number;
  is_24h: boolean;
  has_pharmacist: boolean;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_verified: boolean;
  license_number: string | null;
}

export interface PharmacyProduct {
  id: string;
  pharmacy_id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  image: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  requires_prescription: boolean;
  dosage: string | null;
  manufacturer: string | null;
  active_ingredients: string | null;
  is_active: boolean;
}

export const usePharmacies = () => {
  const query = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async (): Promise<Pharmacy[]> => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(p => ({
          ...p,
          images: p.images || [],
          working_hours: (p.working_hours as Record<string, string>) || {},
      }));
    },
  });
  return { ...query, pharmacies: query.data ?? [] };
};

export const usePharmacy = (pharmacyId: string | undefined) => {
  const query = useQuery({
    queryKey: ['pharmacy', pharmacyId],
    enabled: !!pharmacyId,
    queryFn: async (): Promise<Pharmacy | null> => {
      if (!pharmacyId) return null;
      const { data, error } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', pharmacyId)
          .maybeSingle();
      if (error) throw error;
      return data ? {
            ...data,
            images: data.images || [],
            working_hours: (data.working_hours as Record<string, string>) || {},
      } : null;
    },
  });
  return { ...query, pharmacy: query.data ?? null };
};

export const usePharmacyProducts = (pharmacyId: string | undefined, category?: string) => {
  const result = useQuery({
    queryKey: ['pharmacy-products', pharmacyId, category],
    enabled: !!pharmacyId,
    queryFn: async (): Promise<PharmacyProduct[]> => {
      if (!pharmacyId) return [];
        let query = supabase
          .from('pharmacy_products')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .eq('is_active', true);
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
      const { data, error } = await query.order('name_en');
      if (error) throw error;
      return data || [];
    },
  });
  return { ...result, products: result.data ?? [] };
};
