import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { sameRecordId } from '@/lib/recordIdentity';
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

interface ProviderSnapshot {
  providerId: string | null;
  visibility: 'private' | 'public';
  provider: ProviderDetails | null;
  services: ProviderService[];
  products: ProviderProduct[];
  contracts: ProviderContract[];
  bookings: ProviderBooking[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  servicesError: string | null;
}
const emptySnapshot = (providerId: string | null, visibility: 'private' | 'public'): ProviderSnapshot => ({
  providerId, visibility, provider: null, services: [], products: [], contracts: [], bookings: [],
  isLoading: !!providerId, isFetching: !!providerId, error: null, servicesError: null,
});
const matchesSnapshot = (snapshot: ProviderSnapshot, id: string | null, visibility: 'private' | 'public') =>
  snapshot.visibility === visibility && (id === null ? snapshot.providerId === null : sameRecordId(snapshot.providerId, id));
const readError = (error: unknown) => error instanceof Error ? error.message : 'Failed to fetch provider details';

export function useProviderDetails(providerId: string | null, visibility: 'private' | 'public' = 'private') {
  const [snapshot, setSnapshot] = useState(() => emptySnapshot(providerId, visibility));
  const generation = useRef(0);
  const mounted = useRef(false);
  const committedCohort = useRef<{ providerId: string | null; visibility: 'private' | 'public' } | null>(null);
  useLayoutEffect(() => {
    committedCohort.current = { providerId, visibility };
    return () => { committedCohort.current = null; };
  }, [providerId, visibility]);

  const fetchProviderDetails = useCallback(async () => {
    const belongsToCurrentCohort = () => {
      const cohort = committedCohort.current;
      if (!cohort || cohort.visibility !== visibility) return false;
      return providerId === null ? cohort.providerId === null : sameRecordId(cohort.providerId, providerId);
    };
    // Awaited callers may retain a callback after navigation or visibility change.
    // Reject it before starting reads or superseding the current request generation.
    if (!mounted.current || !belongsToCurrentCohort()) return;
    const request = ++generation.current;
    const current = () => mounted.current && belongsToCurrentCohort() && generation.current === request;
    if (!providerId) {
      setSnapshot({ ...emptySnapshot(null, visibility), isLoading: false, isFetching: false });
      return;
    }
    setSnapshot(previous => {
      if (!current()) return previous;
      const prior = matchesSnapshot(previous, providerId, visibility) ? previous : emptySnapshot(providerId, visibility);
      return { ...prior, isLoading: visibility === 'private' || !prior.provider, isFetching: true,
        error: prior.provider ? prior.error : null, servicesError: prior.provider ? prior.servicesError : null };
    });

    try {
      // Preserve the existing public projections and private object-authorized reads.
      const providerQuery = visibility === 'public' ? supabase.from('public_provider_catalog') : supabase.from('providers');
      const { data: providerData, error: providerError } = await providerQuery.select('*').eq('id', providerId).maybeSingle();
      if (!current()) return;
      if (providerError) throw providerError;
      if (!providerData) {
        setSnapshot({ ...emptySnapshot(providerId, visibility), isLoading: false, isFetching: false });
        return;
      }
      if (!sameRecordId(providerData.id, providerId)) throw new Error('Provider read returned a different identity');
      const serviceQuery = visibility === 'public' ? supabase.from('public_service_catalog') : supabase.from('services');
      const { data: servicesData, error: servicesError } = await serviceQuery
        .select('id, name_en, name_ru, price, currency, is_active, category_id, created_at')
        .eq('provider_id', providerId).order('created_at', { ascending: false });
      if (!current()) return;
      const services = servicesError ? undefined : (servicesData || []).map(s => ({ ...s, is_featured: false, rating: null, review_count: null }));
      let products: ProviderProduct[] | undefined = [];
      let contracts: ProviderContract[] | undefined = [];
      let bookings: ProviderBooking[] | undefined = [];
      if (visibility !== 'public') {
        if ('marketplace_vendor_id' in providerData && typeof providerData.marketplace_vendor_id === 'string') {
          const { data: productsData, error: productsError } = await supabase.from('marketplace_products')
            .select('id, name_en, name_ru, price, currency, is_active, created_at')
            .eq('vendor_id', providerData.marketplace_vendor_id).order('created_at', { ascending: false }).limit(50);
          if (!current()) return;
          products = productsError ? undefined : (productsData || []).map(p => ({ ...p, stock_quantity: 0 }));
        }
        const { data: contractsData, error: contractsError } = await supabase.from('provider_contracts')
          .select('id, contract_type, status, commission_rate, valid_from, valid_until, auto_renew, created_at')
          .eq('entity_type', 'provider').eq('entity_id', providerId).order('created_at', { ascending: false });
        if (!current()) return;
        contracts = contractsError ? undefined : (contractsData || []) as ProviderContract[];
        const { data: bookingsData, error: bookingsError } = await supabase.from('bookings')
          .select(`
          id,
          status,
          total_amount,
          currency,
          scheduled_at,
          created_at,
          services:service_id (name_en, name_ru)
        `).eq('provider_id', providerId).order('created_at', { ascending: false }).limit(20);
        if (!current()) return;
        bookings = bookingsError ? undefined : (bookingsData || []).map((row) => { const b = row as unknown as ProviderBooking & { services?: { name_en?: string; name_ru?: string } | null }; return ({
          id: b.id, status: b.status, total_amount: b.total_amount, currency: b.currency,
          scheduled_at: b.scheduled_at, created_at: b.created_at, service_name: b.services?.name_en || b.services?.name_ru,
        }); });
      }
      // Provider and child rows commit as one request cohort, never independently.
      setSnapshot(previous => {
        if (!current()) return previous;
        const prior = matchesSnapshot(previous, providerId, visibility) ? previous : emptySnapshot(providerId, visibility);
        return { ...prior, providerId, visibility, provider: providerData as unknown as ProviderDetails,
          services: services ?? prior.services, products: products ?? prior.products,
          contracts: contracts ?? prior.contracts, bookings: bookings ?? prior.bookings,
          isLoading: false, isFetching: false, error: null, servicesError: servicesError ? readError(servicesError) : null,
        };
      });
    } catch (error: unknown) {
      if (!current()) return;
      setSnapshot(previous => current() ? ({ ...(matchesSnapshot(previous, providerId, visibility) ? previous : emptySnapshot(providerId, visibility)),
        isLoading: false, isFetching: false, error: readError(error),
      }) : previous);
    }
  }, [providerId, visibility]);

  const invalidateRequests = useCallback(() => { mounted.current = false; generation.current++; }, []);
  useEffect(() => {
    mounted.current = true;
    void fetchProviderDetails();
    return invalidateRequests;
  }, [fetchProviderDetails, invalidateRequests]);

  // Suppress old identity/visibility data on the render before effect cleanup too.
  const active = matchesSnapshot(snapshot, providerId, visibility) ? snapshot : emptySnapshot(providerId, visibility);
  return { provider: active.provider, services: active.services, products: active.products,
    contracts: active.contracts, bookings: active.bookings, isLoading: active.isLoading,
    isFetching: active.isFetching, error: active.error, servicesError: active.servicesError, refetch: fetchProviderDetails };
}
