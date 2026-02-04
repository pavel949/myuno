import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderDetails {
  id: string;
  name: string;
  business_category: string;
  description_en?: string;
  description_ru?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  is_active: boolean;
  is_verified: boolean;
  rating?: number;
  review_count?: number;
  pending_payout: number;
  total_earnings?: number;
  commission_rate?: number;
  logo_url?: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderService {
  id: string;
  name_en: string;
  name_ru: string;
  price?: number;
  currency: string;
  is_active: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  category_id?: string;
  created_at: string;
}

export interface ProviderProduct {
  id: string;
  name_en: string;
  name_ru: string;
  price: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  category_name?: string;
  created_at: string;
}

export interface ProviderContract {
  id: string;
  contract_type: string;
  status: string;
  commission_rate?: number;
  valid_from?: string;
  valid_until?: string;
  auto_renew: boolean;
  created_at: string;
}

export interface ProviderBooking {
  id: string;
  status: string;
  total_amount?: number;
  currency?: string;
  scheduled_at?: string;
  created_at: string;
  service_name?: string;
}

export function useProviderDetails(providerId: string | null) {
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [contracts, setContracts] = useState<ProviderContract[]>([]);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderDetails = useCallback(async () => {
    if (!providerId) {
      setProvider(null);
      setServices([]);
      setProducts([]);
      setContracts([]);
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch provider details
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .maybeSingle();

      if (providerError) throw providerError;
      
      if (!providerData) {
        setProvider(null);
        setServices([]);
        setProducts([]);
        setContracts([]);
        setBookings([]);
        setIsLoading(false);
        return;
      }
      
      setProvider(providerData);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name_en, name_ru, price, currency, is_active, rating, review_count, category_id, created_at')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (!servicesError) {
        setServices((servicesData || []).map((s: any) => ({ ...s, is_featured: false })));
      }

      // Fetch products (if provider is linked to marketplace vendor)
      // Use the already-fetched providerData instead of a redundant query
      if (providerData.marketplace_vendor_id) {
        const { data: productsData, error: productsError } = await supabase
          .from('marketplace_products')
          .select('id, name_en, name_ru, price, currency, is_active, created_at')
          .eq('vendor_id', providerData.marketplace_vendor_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!productsError) {
          setProducts((productsData || []).map((p: any) => ({ ...p, stock_quantity: 0 })));
        }
      } else {
        setProducts([]);
      }

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('provider_contracts')
        .select('id, contract_type, status, commission_rate, valid_from, valid_until, auto_renew, created_at')
        .eq('entity_type', 'provider')
        .eq('entity_id', providerId)
        .order('created_at', { ascending: false });

      if (!contractsError) {
        setContracts((contractsData || []) as ProviderContract[]);
      }

      // Fetch recent bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id, 
          status, 
          total_amount, 
          currency, 
          scheduled_at, 
          created_at,
          services:service_id (name_en, name_ru)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!bookingsError) {
        setBookings(
          (bookingsData || []).map((b: any) => ({
            id: b.id,
            status: b.status,
            total_amount: b.total_amount,
            currency: b.currency,
            scheduled_at: b.scheduled_at,
            created_at: b.created_at,
            service_name: b.services?.name_en || b.services?.name_ru,
          }))
        );
      }
    } catch (err: any) {
      console.error('Error fetching provider details:', err);
      setError(err.message || 'Failed to fetch provider details');
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchProviderDetails();
  }, [fetchProviderDetails]);

  return {
    provider,
    services,
    products,
    contracts,
    bookings,
    isLoading,
    error,
    refetch: fetchProviderDetails,
  };
}
