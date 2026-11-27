import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  duration_minutes?: number | null;
  lead_time_hours?: number | null;
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
  in_stock: boolean | null;
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

interface ProviderDetailState {
  context: string;
  provider: ProviderDetails | null;
  services: ProviderService[];
  products: ProviderProduct[];
  contracts: ProviderContract[];
  bookings: ProviderBooking[];
  isLoading: boolean;
  error: string | null;
}

function emptyProviderState(context: string, isLoading = false, error: string | null = null): ProviderDetailState {
  return { context, provider: null, services: [], products: [], contracts: [], bookings: [], isLoading, error };
}

export function useProviderDetails(providerId: string | null, visibility: 'private' | 'public' = 'private') {
  const { user } = useAuth();
  const actor = visibility === 'public' ? 'public' : user?.id ?? '';
  const context = JSON.stringify([visibility, actor, providerId]);
  const generation = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<ProviderDetailState>(() => emptyProviderState(context, !!providerId));

  const fetchProviderDetails = useCallback(async () => {
    const request = ++generation.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const current = () => request === generation.current && !controller.signal.aborted;

    if (!providerId || (visibility === 'private' && !actor)) {
      setState(emptyProviderState(context, false, providerId ? 'Authentication required' : null));
      return;
    }
    setState(emptyProviderState(context, true));
    try {
      const { data: providerData, error: providerError } = await (visibility === 'public'
        ? supabase.from('public_provider_catalog').select('*')
          .eq('id', providerId).abortSignal(controller.signal).maybeSingle()
        : supabase.from('providers').select('*')
          .eq('id', providerId).abortSignal(controller.signal).maybeSingle());
      if (providerError) throw providerError;
      if (!current()) return;
      if (!providerData) {
        setState(emptyProviderState(context));
        return;
      }
      const serviceColumns = 'id, name_en, name_ru, price, currency, is_active, category_id, created_at, duration_minutes, lead_time_hours';
      const { data: servicesData, error: servicesError } = await (visibility === 'public'
        ? supabase.from('public_service_catalog').select(serviceColumns)
          .eq('provider_id', providerId).order('created_at', { ascending: false }).abortSignal(controller.signal)
        : supabase.from('services').select(serviceColumns)
          .eq('provider_id', providerId).order('created_at', { ascending: false }).abortSignal(controller.signal));
      if (servicesError) throw servicesError;
      if (!current()) return;

      const next: ProviderDetailState = {
        ...emptyProviderState(context),
        provider: providerData as unknown as ProviderDetails,
        services: servicesData ?? [],
      };
      if (visibility === 'private') {
        if ('marketplace_vendor_id' in providerData && typeof providerData.marketplace_vendor_id === 'string') {
          const { data, error } = await supabase.from('marketplace_products')
            .select('id, name_en, name_ru, price, currency, in_stock, is_active, created_at')
            .eq('vendor_id', providerData.marketplace_vendor_id)
            .order('created_at', { ascending: false }).limit(50).abortSignal(controller.signal);
          if (error) throw error;
          if (!current()) return;
          next.products = data ?? [];
        }
        const { data: contracts, error: contractsError } = await supabase.from('provider_contracts')
          .select('id, contract_type, status, commission_rate, valid_from, valid_until, auto_renew, created_at')
          .eq('entity_type', 'provider').eq('entity_id', providerId)
          .order('created_at', { ascending: false }).abortSignal(controller.signal);
        if (contractsError) throw contractsError;
        if (!current()) return;
        next.contracts = (contracts ?? []) as ProviderContract[];

        const { data: bookings, error: bookingsError } = await supabase.from('bookings')
          .select('id, status, total_amount, currency, scheduled_at, created_at, services:service_id (name_en, name_ru)')
          .eq('provider_id', providerId).order('created_at', { ascending: false }).limit(20).abortSignal(controller.signal);
        if (bookingsError) throw bookingsError;
        if (!current()) return;
        next.bookings = (bookings ?? []).map(booking => ({
          id: booking.id, status: booking.status, total_amount: booking.total_amount,
          currency: booking.currency, scheduled_at: booking.scheduled_at, created_at: booking.created_at,
          service_name: booking.services?.name_en || booking.services?.name_ru,
        }));
      }
      if (current()) setState(next);
    } catch {
      if (current()) setState(emptyProviderState(context, false, 'Unable to load provider details'));
    }
  }, [providerId, visibility, actor, context]);

  useEffect(() => {
    void fetchProviderDetails();
    return () => {
      generation.current++;
      controllerRef.current?.abort();
    };
  }, [fetchProviderDetails]);

  // Hide data synchronously when identity/provider/visibility changes, before effects run.
  const visible = state.context === context ? state : emptyProviderState(context, !!providerId);
  return { ...visible, refetch: fetchProviderDetails };
}
