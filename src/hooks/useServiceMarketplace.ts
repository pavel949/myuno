/**
 * Services marketplace data layer — one canonical model:
 * providers → services → provider_availability → service_orders.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WeeklyHours, BusyRange } from '@/lib/services/slots';
import { phuketDateTime } from '@/lib/services/slots';

export interface MarketplaceService {
  id: string;
  provider_id: string;
  name_en: string;
  name_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  price: number | null;
  currency: string | null;
  duration_minutes: number | null;
  images: string[] | null;
  lead_time_hours: number | null;
  is_active: boolean | null;
  approval_status: string | null;
  provider: { id: string; name: string; is_verified: boolean | null; rating: number | null; logo_url: string | null } | null;
}

export interface ServiceOrderRow {
  id: string;
  order_number: string | null;
  service_id: string | null;
  provider_id: string | null;
  service_name: string | null;
  service_name_ru: string | null;
  status: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  amount: number | null;
  currency: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  notes: string | null;
  created_at: string;
}

const SERVICE_COLS =
  'id,provider_id,name_en,name_ru,description_en,description_ru,price,currency,duration_minutes,images,lead_time_hours,is_active,approval_status';

export function useMarketplaceServices() {
  return useQuery({
    queryKey: ['marketplace-services'],
    queryFn: async (): Promise<MarketplaceService[]> => {
      const { data, error } = await supabase
        .from('services')
        .select(`${SERVICE_COLS}, provider:providers!inner(id,name,is_verified,rating,logo_url,is_active)`)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .eq('providers.is_active', true)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as MarketplaceService[];
    },
    staleTime: 60_000,
  });
}

export function useProviderHours(providerId: string | null | undefined) {
  return useQuery({
    queryKey: ['provider-hours', providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<(WeeklyHours & { id: string })[]> => {
      const { data, error } = await supabase
        .from('provider_availability')
        .select('id,weekday,start_time,end_time')
        .eq('provider_id', providerId!)
        .order('weekday')
        .order('start_time');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBusySlots(providerId: string | null | undefined, date: string) {
  return useQuery({
    queryKey: ['provider-busy', providerId, date],
    enabled: !!providerId && !!date,
    queryFn: async (): Promise<BusyRange[]> => {
      const from = phuketDateTime(date, 0).toISOString();
      const to = phuketDateTime(date, 24 * 60).toISOString();
      const { data, error } = await supabase.rpc('get_provider_busy_slots', {
        _provider_id: providerId!,
        _from: from,
        _to: to,
      });
      if (error) throw error;
      return (data ?? []) as BusyRange[];
    },
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      serviceId: string;
      providerId: string;
      scheduledAt: Date;
      guestId: string;
      guestName: string;
      guestPhone: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          service_id: input.serviceId,
          provider_id: input.providerId,
          scheduled_at: input.scheduledAt.toISOString(),
          guest_id: input.guestId,
          guest_name: input.guestName || null,
          guest_phone: input.guestPhone || null,
          notes: input.notes || null,
          service_type: 'marketplace',
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['provider-busy', v.providerId] });
      qc.invalidateQueries({ queryKey: ['my-service-orders'] });
    },
  });
}

export function orderErrorCode(err: unknown): 'SLOT_TAKEN' | 'SLOT_IN_PAST' | 'SERVICE_UNAVAILABLE' | 'UNKNOWN' {
  const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);
  if (msg.includes('SLOT_TAKEN')) return 'SLOT_TAKEN';
  if (msg.includes('SLOT_IN_PAST')) return 'SLOT_IN_PAST';
  if (msg.includes('SERVICE_UNAVAILABLE')) return 'SERVICE_UNAVAILABLE';
  return 'UNKNOWN';
}

/* ---------------- Provider desk ---------------- */

export function useMyProvider(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-provider', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('id,name,is_active,is_verified,approval_status')
        .eq('user_id', userId!)
        .order('created_at')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProviderServicesAdmin(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-services-admin', providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(SERVICE_COLS)
        .eq('provider_id', providerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Omit<MarketplaceService, 'provider'>[];
    },
  });
}

export function useProviderOrders(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-service-orders', providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<ServiceOrderRow[]> => {
      const { data, error } = await supabase
        .from('service_orders')
        .select('id,order_number,service_id,provider_id,service_name,service_name_ru,status,scheduled_at,duration_minutes,amount,currency,guest_name,guest_phone,notes,created_at')
        .eq('provider_id', providerId!)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ServiceOrderRow[];
    },
  });
}
