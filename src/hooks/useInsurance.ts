import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InsuranceProvider {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  insurance_types: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  languages: string[];
  has_online_claims: boolean;
  has_24h_support: boolean;
  license_number: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  currency: string;
}

export interface InsurancePlan {
  id: string;
  provider_id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  insurance_type: string;
  plan_tier: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  coverage_amount: number | null;
  deductible: number | null;
  features: { en?: string[]; ru?: string[] } | null;
  exclusions: { en?: string[]; ru?: string[] } | null;
  min_age: number | null;
  max_age: number | null;
  requires_medical_exam: boolean;
  is_popular: boolean;
}

interface UseInsuranceProvidersOptions {
  insuranceType?: string;
  searchQuery?: string;
}

export function useInsuranceProviders(options: UseInsuranceProvidersOptions = {}) {
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProviders = async () => {
      setIsLoading(true);
      let query = supabase
        .from('insurance_providers')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (options.insuranceType && options.insuranceType !== 'all') {
        query = query.contains('insurance_types', [options.insuranceType]);
      }

      const { data, error } = await query;

      if (isMounted) {
        if (!error && data) {
          let filtered = data as InsuranceProvider[];
          if (options.searchQuery) {
            const q = options.searchQuery.toLowerCase();
            filtered = filtered.filter(
              (p) =>
                p.name_en.toLowerCase().includes(q) ||
                p.name_ru.toLowerCase().includes(q)
            );
          }
          setProviders(filtered);
        }
        setIsLoading(false);
      }
    };
    fetchProviders();
    
    return () => { isMounted = false; };
  }, [options.insuranceType, options.searchQuery]);

  return { providers, isLoading };
}

export function useInsuranceProvider(id: string) {
  const [provider, setProvider] = useState<InsuranceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;
    const fetchProvider = async () => {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (isMounted) {
        if (!error && data) setProvider(data as InsuranceProvider);
        setIsLoading(false);
      }
    };
    fetchProvider();
    
    return () => { isMounted = false; };
  }, [id]);

  return { provider, isLoading };
}

export function useInsurancePlans(providerId?: string, insuranceType?: string) {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPlans = async () => {
      setIsLoading(true);
      let query = supabase
        .from('insurance_plans')
        .select('*')
        .eq('is_active', true)
        .order('is_popular', { ascending: false })
        .order('price_yearly', { ascending: true });

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      if (insuranceType && insuranceType !== 'all') {
        query = query.eq('insurance_type', insuranceType);
      }

      const { data, error } = await query;
      if (isMounted) {
        if (!error && data) {
          setPlans(
            data.map((p: any) => ({
              ...p,
              features: p.features || null,
              exclusions: p.exclusions || null,
            })) as InsurancePlan[]
          );
        }
        setIsLoading(false);
      }
    };
    fetchPlans();
    
    return () => { isMounted = false; };
  }, [providerId, insuranceType]);

  return { plans, isLoading };
}
