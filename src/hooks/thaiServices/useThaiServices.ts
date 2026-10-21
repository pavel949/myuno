/**
 * Data hooks for the Thai Business Layer (Local Services).
 *
 * Queries are scoped by RLS; see the `thai_business_layer` migration. Auto
 * translation of TH→RU fields reuses the existing `ai-translate` edge function.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { thaiTable, supabase } from './db';
import { slugifyThaiBusiness, ensureUniqueSlug } from '@/lib/thaiServices/slug';
import type {
  ThaiBusiness, ThaiService, ThaiBooking, ThaiChat, ThaiChatMessage,
  ThaiCategory, ThaiDistrict, ThaiPaymentMethod, ThaiBookingStatus,
} from '@/types/thaiBusiness';

export interface ThaiBusinessFilters {
  category?: ThaiCategory | null;
  district?: ThaiDistrict | null;
  paymentMethod?: ThaiPaymentMethod | null;
  thaiOwnedOnly?: boolean;
  search?: string;
}

const keys = {
  list: (f: ThaiBusinessFilters) => ['thai-businesses', f] as const,
  one: (idOrSlug?: string) => ['thai-business', idOrSlug] as const,
  mine: (uid?: string) => ['thai-my-business', uid] as const,
  services: (bizId?: string) => ['thai-services', bizId] as const,
  bookings: (scope: string, id?: string) => ['thai-bookings', scope, id] as const,
  chats: (bizId?: string, uid?: string) => ['thai-chats', bizId, uid] as const,
  messages: (chatId?: string) => ['thai-messages', chatId] as const,
};

// ── Public catalogue ────────────────────────────────────────────────────────

export function useThaiBusinesses(filters: ThaiBusinessFilters = {}) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: async (): Promise<ThaiBusiness[]> => {
      let q = thaiTable('thai_businesses').select('*').eq('is_active', true);
      if (filters.category) q = q.eq('category', filters.category);
      if (filters.district) q = q.eq('district', filters.district);
      if (filters.thaiOwnedOnly) q = q.eq('ownership_type', 'thai_owned');
      if (filters.paymentMethod) q = q.contains('payment_methods', [filters.paymentMethod]);
      const { data, error } = await q.order('rating_avg', { ascending: false, nullsFirst: false });
      if (error) throw error;
      let rows = (data ?? []) as ThaiBusiness[];
      const s = filters.search?.trim().toLowerCase();
      if (s) {
        rows = rows.filter((b) =>
          [b.name_ru, b.name_en, b.name_th, b.district, b.address]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(s)),
        );
      }
      return rows;
    },
  });
}

/** Fetch a single business by UUID or slug, with its services. */
export function useThaiBusiness(idOrSlug?: string) {
  return useQuery({
    queryKey: keys.one(idOrSlug),
    enabled: !!idOrSlug,
    queryFn: async (): Promise<{ business: ThaiBusiness; services: ThaiService[] } | null> => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug!);
      const { data: biz, error } = await thaiTable('thai_businesses')
        .select('*')
        .eq(isUuid ? 'id' : 'slug', idOrSlug)
        .maybeSingle();
      if (error) throw error;
      if (!biz) return null;
      const { data: services } = await thaiTable('thai_business_services')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: true });
      return { business: biz as ThaiBusiness, services: (services ?? []) as ThaiService[] };
    },
  });
}

// ── Owner: my business ──────────────────────────────────────────────────────

export function useMyThaiBusiness() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.mine(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<ThaiBusiness | null> => {
      const { data, error } = await thaiTable('thai_businesses')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ThaiBusiness | null;
    },
  });
}

export function useThaiBusinessServices(businessId?: string) {
  return useQuery({
    queryKey: keys.services(businessId),
    enabled: !!businessId,
    queryFn: async (): Promise<ThaiService[]> => {
      const { data, error } = await thaiTable('thai_business_services')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ThaiService[];
    },
  });
}

// ── Bookings ────────────────────────────────────────────────────────────────

export function useMyThaiBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.bookings('customer', user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<ThaiBooking[]> => {
      const { data, error } = await thaiTable('thai_bookings')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ThaiBooking[];
    },
  });
}

export function useBusinessBookings(businessId?: string) {
  return useQuery({
    queryKey: keys.bookings('business', businessId),
    enabled: !!businessId,
    queryFn: async (): Promise<ThaiBooking[]> => {
      const { data, error } = await thaiTable('thai_bookings')
        .select('*')
        .eq('business_id', businessId)
        .order('date_time', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ThaiBooking[];
    },
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

/** Translate TH fields → RU via the shared ai-translate edge function. */
async function translateToRu(fields: Record<string, string | null | undefined>): Promise<Record<string, string>> {
  const clean = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v && String(v).trim()),
  );
  if (Object.keys(clean).length === 0) return {};
  try {
    const { data, error } = await supabase.functions.invoke('ai-translate', {
      body: { fields: clean, targetLang: 'ru' },
    });
    if (error) return {};
    return (data?.translations ?? {}) as Record<string, string>;
  } catch {
    return {};
  }
}

export function useSaveThaiBusiness() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<ThaiBusiness> & { id?: string }) => {
      if (!user?.id) throw new Error('not authenticated');
      // Auto-translate name/description to Russian for the B2C surface + landing.
      const tr = await translateToRu({ name_th: input.name_th, description_th: input.description_th });
      const patch: Record<string, unknown> = {
        ...input,
        name_ru: input.name_ru || tr.name_th || input.name_ru,
        description_ru: input.description_ru || tr.description_th || input.description_ru,
      };

      if (input.id) {
        const { data, error } = await thaiTable('thai_businesses').update(patch).eq('id', input.id).select('*').single();
        if (error) throw error;
        return data as ThaiBusiness;
      }

      // New business: generate a unique slug, owner = current user, pending moderation.
      const base = slugifyThaiBusiness(input.name_en || input.name_ru || input.name_th || 'biz');
      const { data: existing } = await thaiTable('thai_businesses').select('slug').like('slug', `${base}%`);
      const taken = (existing ?? []).map((r: { slug: string }) => r.slug);
      patch.slug = ensureUniqueSlug(base, taken);
      patch.owner_id = user.id;
      patch.is_active = false;
      const { data, error } = await thaiTable('thai_businesses').insert(patch).select('*').single();
      if (error) throw error;
      return data as ThaiBusiness;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.mine(user?.id) });
    },
  });
}

export function useSaveThaiService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ThaiService> & { business_id: string; id?: string }) => {
      const tr = await translateToRu({ name_th: input.name_th, description_th: input.description_th });
      const patch: Record<string, unknown> = {
        ...input,
        name_ru: input.name_ru || tr.name_th || input.name_ru,
        description_ru: input.description_ru || tr.description_th || input.description_ru,
      };
      if (input.id) {
        const { data, error } = await thaiTable('thai_business_services').update(patch).eq('id', input.id).select('*').single();
        if (error) throw error;
        return data as ThaiService;
      }
      const { data, error } = await thaiTable('thai_business_services').insert(patch).select('*').single();
      if (error) throw error;
      return data as ThaiService;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: keys.services(vars.business_id) }),
  });
}

export function useDeleteThaiService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; business_id: string }) => {
      const { error } = await thaiTable('thai_business_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: keys.services(vars.business_id) }),
  });
}

export function useCreateThaiBooking() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      business_id: string; service_id?: string | null; date_time?: string | null;
      total_amount_thb?: number; notes?: string;
    }) => {
      if (!user?.id) throw new Error('not authenticated');
      const { data, error } = await thaiTable('thai_bookings')
        .insert({ ...input, customer_id: user.id, status: 'requested', payment_status: 'unpaid' })
        .select('*')
        .single();
      if (error) throw error;
      // Notify the business owner (best-effort).
      supabase.functions.invoke('thai-notify', { body: { kind: 'new_booking', bookingId: data.id } }).catch(() => {});
      return data as ThaiBooking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bookings('customer', user?.id) }),
  });
}

export function useUpdateThaiBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status?: ThaiBookingStatus; date_time?: string }) => {
      const patch: Record<string, unknown> = {};
      if (input.status) patch.status = input.status;
      if (input.date_time) patch.date_time = input.date_time;
      const { data, error } = await thaiTable('thai_bookings').update(patch).eq('id', input.id).select('*').single();
      if (error) throw error;
      supabase.functions.invoke('thai-notify', { body: { kind: 'booking_status', bookingId: input.id } }).catch(() => {});
      return data as ThaiBooking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thai-bookings'] }),
  });
}

// ── Chat ────────────────────────────────────────────────────────────────────

export function useThaiChatMessages(chatId?: string) {
  return useQuery({
    queryKey: keys.messages(chatId),
    enabled: !!chatId,
    queryFn: async (): Promise<ThaiChatMessage[]> => {
      const { data, error } = await thaiTable('thai_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ThaiChatMessage[];
    },
    refetchInterval: 8000, // lightweight polling; realtime can replace this later
  });
}

/** Owner inbox: all chats for a business with last message preview. */
export function useBusinessChats(businessId?: string) {
  return useQuery({
    queryKey: keys.chats(businessId),
    enabled: !!businessId,
    queryFn: async (): Promise<ThaiChat[]> => {
      const { data, error } = await thaiTable('thai_chats')
        .select('*')
        .eq('business_id', businessId)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ThaiChat[];
    },
  });
}

/** Find (do not create) the current user's chat thread with a business. */
export function useMyChatWithBusiness(businessId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.chats(businessId, user?.id),
    enabled: !!businessId && !!user?.id,
    queryFn: async (): Promise<ThaiChat | null> => {
      const { data, error } = await thaiTable('thai_chats')
        .select('*')
        .eq('business_id', businessId)
        .eq('customer_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ThaiChat | null;
    },
  });
}

export function useSendThaiMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      businessId: string; chatId?: string; text: string; senderLang: 'ru' | 'th' | 'en';
      isImage?: boolean; imageUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('thai-chat-send', { body: input });
      if (error) throw error;
      return data as { message: ThaiChatMessage; chatId: string };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: keys.messages(res.chatId) });
      qc.invalidateQueries({ queryKey: ['thai-chats'] });
    },
  });
}

// ── Admin moderation ────────────────────────────────────────────────────────

export function useAdminThaiBusinesses() {
  return useQuery({
    queryKey: ['admin-thai-businesses'],
    queryFn: async (): Promise<ThaiBusiness[]> => {
      const { data, error } = await thaiTable('thai_businesses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ThaiBusiness[];
    },
  });
}

export function useSetThaiBusinessActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await thaiTable('thai_businesses').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-thai-businesses'] }),
  });
}
