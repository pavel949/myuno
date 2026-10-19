import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  pending_payout?: number;
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
  price?: number | null;
  currency: string;
  duration_minutes?: number | null;
  lead_time_hours?: number | null;
  booking_flow?: string | null;
  availability_mode?: string | null;
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

export function useProviderDetails(providerId: string | null, visibility: 'private' | 'public' = 'private') {
  const { user } = useAuth();
  const actor = visibility === 'private' ? user?.id : null;
  const scope = `${visibility}:${providerId ?? ''}:${actor ?? ''}`;
  const [resultScope, setResultScope] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [contracts, setContracts] = useState<ProviderContract[]>([]);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generation = useRef(0);
  const fetchProviderDetails = useCallback(async () => {
    const request = ++generation.current;
    setResultScope(scope);
    const current = () => request === generation.current;
    setProvider(null);
    setServices([]);
    setProducts([]);
    setContracts([]);
    setBookings([]);
    setError(null);
    if (!providerId || (visibility === 'private' && !actor)) {
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
      const providerQuery = visibility === 'public' ? supabase.from('public_provider_catalog') : supabase.from('providers');
      const { data: providerData, error: providerError } = await providerQuery
        .select('*')
        .eq('id', providerId)
        .maybeSingle();

      if (!current()) return;
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
      
      setProvider(providerData as unknown as ProviderDetails);

      // Fetch services
      const serviceQuery = visibility === 'public' ? supabase.from('public_service_catalog') : supabase.from('services');
      const { data: servicesData, error: servicesError } = await serviceQuery
        .select('id, name_en, name_ru, price, currency, duration_minutes, lead_time_hours, booking_flow, availability_mode, is_active, category_id, created_at')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (!current()) return;
      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      if (visibility === 'public') {
        setProducts([]);
        setContracts([]);
        setBookings([]);
        return;
      }

      // Fetch products (if provider is linked to marketplace vendor)
      // Use the already-fetched providerData instead of a redundant query
      if ('marketplace_vendor_id' in providerData && typeof providerData.marketplace_vendor_id === 'string') {
        const { data: productsData, error: productsError } = await supabase
          .from('marketplace_products')
          .select('id, name_en, name_ru, price, currency, is_active, created_at')
          .eq('vendor_id', providerData.marketplace_vendor_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!current()) return;
        if (!productsError) {
          setProducts((productsData || []).map((p) => ({ ...p, stock_quantity: 0 })));
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

      if (!current()) return;
      if (!contractsError) {
        setContracts((contractsData || []) as ProviderContract[]);
      }

      // The same canonical requests shown in the customer and provider desks.
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('service_orders')
        .select('id, status, amount, currency, scheduled_at, created_at, service_name, service_name_ru')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!current()) return;
      if (bookingsError) throw bookingsError;
      setBookings((bookingsData || []).map((b) => ({
        id: b.id, status: b.status, total_amount: b.amount, currency: b.currency,
        scheduled_at: b.scheduled_at, created_at: b.created_at,
        service_name: b.service_name || b.service_name_ru,
      })));
    } catch (err: unknown) {
      if (current()) setError(err instanceof Error ? err.message : 'Failed to fetch provider details');
    } finally {
      if (current()) setIsLoading(false);
    }
  }, [providerId, visibility, actor, scope]);

  useEffect(() => {
    void fetchProviderDetails();
    return () => { generation.current++; };
  }, [fetchProviderDetails]);

  return {
    provider: resultScope === scope ? provider : null,
    services: resultScope === scope ? services : [],
    products: resultScope === scope ? products : [],
    contracts: resultScope === scope ? contracts : [],
    bookings: resultScope === scope ? bookings : [],
    isLoading: resultScope === scope ? isLoading : !!providerId && (visibility === 'public' || !!actor),
    error: resultScope === scope ? error : null,
    refetch: fetchProviderDetails,
  };
}
