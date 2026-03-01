/**
 * @module useOwnerPortalSettings
 * Hook for managing Owner Portal visibility settings.
 * Used by MC to configure what property owners can see.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OwnerPortalSettings {
  id: string;
  property_id: string;
  owner_user_id: string;
  company_id: string | null;
  show_booking_calendar: boolean;
  show_guest_names: boolean;
  show_booking_prices: boolean;
  show_financial_statements: boolean;
  show_mc_commission: boolean;
  show_expenses_detail: boolean;
  show_maintenance: boolean;
  show_utilities: boolean;
  show_documents: boolean;
  show_owner_stays: boolean;
  show_occupancy_stats: boolean;
  show_deposits: boolean;
  show_payouts: boolean;
  custom_welcome_message: string | null;
  custom_welcome_message_ru: string | null;
  statement_start_date: string | null;
  created_at: string;
  updated_at: string;
}

/** All boolean toggle keys */
export type PortalVisibilityKey = Extract<keyof OwnerPortalSettings, 
  | 'show_booking_calendar' | 'show_guest_names' | 'show_booking_prices'
  | 'show_financial_statements' | 'show_mc_commission' | 'show_expenses_detail'
  | 'show_maintenance' | 'show_utilities' | 'show_documents'
  | 'show_owner_stays' | 'show_occupancy_stats' | 'show_deposits' | 'show_payouts'
>;

export const PORTAL_VISIBILITY_FIELDS: { key: PortalVisibilityKey; labelEn: string; labelRu: string; icon: string; group: string }[] = [
  // Calendar & Bookings
  { key: 'show_booking_calendar', labelEn: 'Booking Calendar', labelRu: 'Календарь бронирований', icon: '📅', group: 'bookings' },
  { key: 'show_guest_names', labelEn: 'Guest Names', labelRu: 'Имена гостей', icon: '👤', group: 'bookings' },
  { key: 'show_booking_prices', labelEn: 'Booking Prices', labelRu: 'Цены бронирований', icon: '💲', group: 'bookings' },
  { key: 'show_occupancy_stats', labelEn: 'Occupancy Stats', labelRu: 'Статистика заполняемости', icon: '📊', group: 'bookings' },
  { key: 'show_owner_stays', labelEn: 'Owner Stays', labelRu: 'Проживание владельца', icon: '🏠', group: 'bookings' },
  // Finance
  { key: 'show_financial_statements', labelEn: 'Financial Statements', labelRu: 'Финансовые отчёты', icon: '📄', group: 'finance' },
  { key: 'show_mc_commission', labelEn: 'MC Commission Details', labelRu: 'Детали комиссии УК', icon: '💼', group: 'finance' },
  { key: 'show_expenses_detail', labelEn: 'Expense Breakdown', labelRu: 'Детализация расходов', icon: '🧾', group: 'finance' },
  { key: 'show_deposits', labelEn: 'Security Deposits', labelRu: 'Депозиты', icon: '🔒', group: 'finance' },
  { key: 'show_payouts', labelEn: 'Owner Payouts', labelRu: 'Выплаты владельцу', icon: '💰', group: 'finance' },
  // Operations
  { key: 'show_maintenance', labelEn: 'Maintenance & Repairs', labelRu: 'Обслуживание и ремонт', icon: '🔧', group: 'operations' },
  { key: 'show_utilities', labelEn: 'Utilities & CAM', labelRu: 'Коммуналка и CAM', icon: '💡', group: 'operations' },
  { key: 'show_documents', labelEn: 'Documents', labelRu: 'Документы', icon: '📁', group: 'operations' },
];

const GROUPS = [
  { key: 'bookings', labelEn: 'Bookings & Calendar', labelRu: 'Бронирования и календарь' },
  { key: 'finance', labelEn: 'Finance', labelRu: 'Финансы' },
  { key: 'operations', labelEn: 'Operations', labelRu: 'Операции' },
];

export { GROUPS as PORTAL_SETTINGS_GROUPS };

/**
 * Fetch portal settings for a specific property + owner pair.
 * Used by MC to configure and by owner to read.
 */
export function useOwnerPortalSettings(propertyId: string | undefined, ownerUserId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-portal-settings', propertyId, ownerUserId],
    queryFn: async () => {
      if (!propertyId || !ownerUserId) return null;
      const { data, error } = await (supabase as any)
        .from('owner_portal_settings')
        .select('*')
        .eq('property_id', propertyId)
        .eq('owner_user_id', ownerUserId)
        .maybeSingle();
      if (error) throw error;
      return data as OwnerPortalSettings | null;
    },
    enabled: !!propertyId && !!ownerUserId,
  });

  const upsert = useMutation({
    mutationFn: async (values: Partial<OwnerPortalSettings> & { property_id: string; owner_user_id: string; company_id?: string }) => {
      const { data, error } = await (supabase as any)
        .from('owner_portal_settings')
        .upsert(
          { ...values, updated_at: new Date().toISOString() },
          { onConflict: 'property_id,owner_user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-portal-settings', propertyId, ownerUserId] });
    },
  });

  return { settings: query.data, isLoading: query.isLoading, upsert: upsert.mutateAsync, isUpdating: upsert.isPending };
}

/**
 * Fetch portal settings for current user (owner side) — all their properties.
 */
export function useMyPortalSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-portal-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('owner_portal_settings')
        .select('*, properties:property_id(id, title, title_ru, cover_image, address)')
        .eq('owner_user_id', user.id);
      if (error) throw error;
      return (data || []) as (OwnerPortalSettings & { properties: { id: string; title?: string; title_ru?: string; cover_image?: string; address?: string } | null })[];
    },
    enabled: !!user?.id,
  });
}
