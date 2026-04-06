import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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

export interface DirectionStep {
  id: string;
  order: number;
  instruction: string;
  instruction_ru?: string;
  photo_url?: string;
  landmark?: string;
  landmark_ru?: string;
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
  directions: DirectionStep[];
  trash_instructions: string | null;
  trash_instructions_ru: string | null;
  parking_instructions: string | null;
  parking_instructions_ru: string | null;
  checkout_instructions: string | null;
  checkout_instructions_ru: string | null;
  house_manual_url: string | null;
  welcome_message: string | null;
  welcome_message_ru: string | null;
  share_token: string | null;
  is_public: boolean;
  property_photos: string[] | null;
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
  directions?: DirectionStep[];
  trash_instructions?: string;
  trash_instructions_ru?: string;
  parking_instructions?: string;
  parking_instructions_ru?: string;
  checkout_instructions?: string;
  checkout_instructions_ru?: string;
  house_manual_url?: string;
  welcome_message?: string;
  welcome_message_ru?: string;
  is_public?: boolean;
}

function parseGuidebook(data: Record<string, unknown>): PropertyGuidebook {
  return {
    ...data,
    appliance_guides: (data.appliance_guides as unknown[] as ApplianceGuide[]) || [],
    emergency_contacts: (data.emergency_contacts as unknown[] as EmergencyContact[]) || [],
    local_tips: (data.local_tips as unknown[] as LocalTip[]) || [],
    directions: (data.directions as unknown[] as DirectionStep[]) || [],
    is_public: (data.is_public as boolean) || false,
    property_photos: (data.property_photos as string[]) || [],
  } as PropertyGuidebook;
}

export function usePropertyGuidebook(propertyId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

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
      return data ? parseGuidebook(data as Record<string, unknown>) : null;
    },
    enabled: !!propertyId,
  });

  const saveGuidebook = useMutation({
    mutationFn: async (formData: GuidebookFormData) => {
      if (!propertyId) throw new Error('Property ID is required');

      const payload: Record<string, unknown> = {
        property_id: propertyId,
        wifi_name: formData.wifi_name,
        wifi_password: formData.wifi_password,
        door_code: formData.door_code,
        gate_code: formData.gate_code,
        lockbox_code: formData.lockbox_code,
        lockbox_location: formData.lockbox_location,
        appliance_guides: formData.appliance_guides || [],
        emergency_contacts: formData.emergency_contacts || [],
        local_tips: formData.local_tips || [],
        directions: formData.directions || [],
        trash_instructions: formData.trash_instructions,
        trash_instructions_ru: formData.trash_instructions_ru,
        parking_instructions: formData.parking_instructions,
        parking_instructions_ru: formData.parking_instructions_ru,
        checkout_instructions: formData.checkout_instructions,
        checkout_instructions_ru: formData.checkout_instructions_ru,
        house_manual_url: formData.house_manual_url,
        welcome_message: formData.welcome_message,
        welcome_message_ru: formData.welcome_message_ru,
        is_public: formData.is_public ?? false,
      };

      if (guidebook?.id) {
        const { data, error } = await supabase
          .from('property_guidebook')
          .update(payload as never)
          .eq('id', guidebook.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('property_guidebook')
          .insert(payload as never)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-guidebook', propertyId] });
      toast(isRu ? 'Готово' : 'Done');
    },
    onError: (error: Error) => {
      toast.error(t, { description: error.message });
    },
  });

  // Generate share link
  const getShareUrl = () => {
    if (!guidebook?.share_token || !guidebook.is_public) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/guide/${guidebook.share_token}`;
  };

  return {
    guidebook,
    isLoading,
    saveGuidebook,
    hasGuidebook: !!guidebook,
    shareUrl: getShareUrl(),
  };
}

// Hook for guests to view guidebook (with booking verification)
export function useGuestGuidebook(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['guest-guidebook', propertyId, user?.id],
    queryFn: async () => {
      if (!propertyId || !user?.id) return null;

      const { data: booking, error: bookingError } = await supabase
        .from('property_bookings')
        .select('id, status, check_in, check_out')
        .eq('property_id', propertyId)
        .eq('guest_email', user.email)
        .in('status', ['confirmed', 'checked_in'])
        .maybeSingle();

      if (bookingError) throw bookingError;
      
      if (!booking) {
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

      const { data, error } = await supabase
        .from('property_guidebook')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) throw error;
      return data ? parseGuidebook(data as Record<string, unknown>) : null;
    },
    enabled: !!propertyId && !!user?.id,
  });
}

// Hook for public guidebook access via share token
export function usePublicGuidebook(shareToken?: string) {
  return useQuery({
    queryKey: ['public-guidebook', shareToken],
    queryFn: async () => {
      if (!shareToken) return null;

      const { data, error } = await supabase
        .from('property_guidebook')
        .select(`
          *,
          properties!property_id (
            title,
            title_ru,
            address,
            cover_image,
            images,
            check_in_time,
            check_out_time,
            house_rules,
            house_rules_ru
          )
        `)
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        guidebook: parseGuidebook(data as Record<string, unknown>),
        property: (data as Record<string, unknown>).properties as {
          title: string;
          title_ru: string | null;
          address: string | null;
          cover_image: string | null;
          images: string[] | null;
          check_in_time: string | null;
          check_out_time: string | null;
          house_rules: string | null;
          house_rules_ru: string | null;
        } | null,
      };
    },
    enabled: !!shareToken,
  });
}
