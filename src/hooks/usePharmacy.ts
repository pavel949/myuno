import { useState, useEffect, useCallback } from "react";
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
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPharmacies = useCallback(async (isMounted: { current: boolean }) => {
    if (isMounted.current) setIsLoading(true);
    try {
      const { data } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      
      if (isMounted.current) {
        const formatted: Pharmacy[] = (data || []).map(p => ({
          ...p,
          images: p.images || [],
          working_hours: (p.working_hours as Record<string, string>) || {},
        }));
        setPharmacies(formatted);
      }
    } catch { /* ignored */ } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    fetchPharmacies(isMounted);
    return () => { isMounted.current = false; };
  }, [fetchPharmacies]);
  
  return { pharmacies, isLoading, refetch: () => fetchPharmacies({ current: true }) };
};

export const usePharmacy = (pharmacyId: string | undefined) => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!pharmacyId) { setIsLoading(false); return; }
    const fetch = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', pharmacyId)
          .maybeSingle();
        if (isMounted && data) {
          setPharmacy({
            ...data,
            images: data.images || [],
            working_hours: (data.working_hours as Record<string, string>) || {},
          });
        }
      } catch { /* ignored */ } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetch();
    
    return () => { isMounted = false; };
  }, [pharmacyId]);

  return { pharmacy, isLoading };
};

export const usePharmacyProducts = (pharmacyId: string | undefined, category?: string) => {
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!pharmacyId) { setIsLoading(false); return; }
    const fetch = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('pharmacy_products')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .eq('is_active', true);
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        const { data } = await query.order('name_en');
        if (isMounted) setProducts(data || []);
      } catch { /* ignored */ } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetch();
    
    return () => { isMounted = false; };
  }, [pharmacyId, category]);

  return { products, isLoading };
};
