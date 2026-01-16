import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ApplianceGuide {
  id: string;
  name: string;
  name_ru?: string;
  instructions: string;
  instructions_ru?: string;
  photo_url?: string;
  video_url?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  name_ru?: string;
  phone: string;
  role: string;
  role_ru?: string;
}

export interface LocalTip {
  id: string;
  category: 'restaurant' | 'cafe' | 'beach' | 'shopping' | 'attraction' | 'transport' | 'other';
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  address?: string;
  google_maps_url?: string;
  image_url?: string;
}

export interface PropertyGuidebook {
  id: string;
  property_id: string;
  wifi_name: string | null;
  wifi_password: string | null;
  door_code: string | null;
  gate_code: string | null;
  lockbox_code: string | null;
  lockbox_location: string | null;
  appliance_guides: ApplianceGuide[];
  emergency_contacts: EmergencyContact[];
  local_tips: LocalTip[];
  trash_instructions: string | null;
  trash_instructions_ru: string | null;
  parking_instructions: string | null;
  parking_instructions_ru: string | null;
  checkout_instructions: string | null;
  checkout_instructions_ru: string | null;
  house_manual_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuidebookFormData {
  wifi_name?: string;
  wifi_password?: string;
  door_code?: string;
  gate_code?: string;
  lockbox_code?: string;
  lockbox_location?: string;
  appliance_guides?: ApplianceGuide[];
  emergency_contacts?: EmergencyContact[];
  local_tips?: LocalTip[];
  trash_instructions?: string;
  trash_instructions_ru?: string;
  parking_instructions?: string;
  parking_instructions_ru?: string;
  checkout_instructions?: string;
  checkout_instructions_ru?: string;
  house_manual_url?: string;
}

export function usePropertyGuidebook(propertyId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Fetch guidebook for a property
  const { data: guidebook, isLoading } = useQuery({
    queryKey: ['property-guidebook', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      const { data, error } = await supabase
        .from('property_guidebook')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          appliance_guides: (data.appliance_guides as unknown as ApplianceGuide[]) || [],
          emergency_contacts: (data.emergency_contacts as unknown as EmergencyContact[]) || [],
          local_tips: (data.local_tips as unknown as LocalTip[]) || [],
        } as PropertyGuidebook;
      }
      return null;
    },
    enabled: !!propertyId,
  });

  // Create or update guidebook
  const saveGuidebook = useMutation({
    mutationFn: async (formData: GuidebookFormData) => {
      if (!propertyId) throw new Error('Property ID is required');

      const payload = {
        property_id: propertyId,
        wifi_name: formData.wifi_name,
        wifi_password: formData.wifi_password,
        door_code: formData.door_code,
        gate_code: formData.gate_code,
        lockbox_code: formData.lockbox_code,
        lockbox_location: formData.lockbox_location,
        appliance_guides: JSON.parse(JSON.stringify(formData.appliance_guides || [])) as Json,
        emergency_contacts: JSON.parse(JSON.stringify(formData.emergency_contacts || [])) as Json,
        local_tips: JSON.parse(JSON.stringify(formData.local_tips || [])) as Json,
        trash_instructions: formData.trash_instructions,
        trash_instructions_ru: formData.trash_instructions_ru,
        parking_instructions: formData.parking_instructions,
        parking_instructions_ru: formData.parking_instructions_ru,
        checkout_instructions: formData.checkout_instructions,
        checkout_instructions_ru: formData.checkout_instructions_ru,
        house_manual_url: formData.house_manual_url,
      };

      if (guidebook?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('property_guidebook')
          .update(payload)
          .eq('id', guidebook.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('property_guidebook')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-guidebook', propertyId] });
      toast({
        title: t('Saved', 'Сохранено'),
        description: t('Guidebook has been updated', 'Гид по объекту обновлён'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('Error', 'Ошибка'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    guidebook,
    isLoading,
    saveGuidebook,
    hasGuidebook: !!guidebook,
  };
}

// Hook for guests to view guidebook (with booking verification)
export function useGuestGuidebook(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['guest-guidebook', propertyId, user?.id],
    queryFn: async () => {
      if (!propertyId || !user?.id) return null;

      // First check if user has an active booking for this property
      const { data: booking, error: bookingError } = await supabase
        .from('property_bookings')
        .select('id, status, check_in, check_out')
        .eq('property_id', propertyId)
        .eq('guest_email', user.email)
        .in('status', ['confirmed', 'checked_in'])
        .maybeSingle();

      if (bookingError) throw bookingError;
      
      if (!booking) {
        // Also check via check-in data
        const { data: checkIn } = await supabase
          .from('guest_check_in_data')
          .select(`
            id,
            property_bookings!inner (
              property_id,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('property_bookings.property_id', propertyId)
          .in('property_bookings.status', ['confirmed', 'checked_in'])
          .maybeSingle();

        if (!checkIn) {
          throw new Error('No active booking found for this property');
        }
      }

      // Fetch guidebook
      const { data, error } = await supabase
        .from('property_guidebook')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          appliance_guides: (data.appliance_guides as unknown as ApplianceGuide[]) || [],
          emergency_contacts: (data.emergency_contacts as unknown as EmergencyContact[]) || [],
          local_tips: (data.local_tips as unknown as LocalTip[]) || [],
        } as PropertyGuidebook;
      }
      return null;
    },
    enabled: !!propertyId && !!user?.id,
  });
}
