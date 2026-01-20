import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LookupValue {
  id: string;
  lookup_type: string;
  value_key: string;
  value_en: string;
  value_ru: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type LookupType = 
  | 'district' 
  | 'cuisine' 
  | 'tour_type' 
  | 'amenity' 
  | 'property_type' 
  | 'yacht_type' 
  | 'event_category'
  | 'service_type'
  | 'pet_type'
  | 'vehicle_type'
  | 'gym_type'
  | 'salon_type'
  | 'clinic_specialty';

export const LOOKUP_TYPE_LABELS: Record<LookupType, { en: string; ru: string }> = {
  district: { en: 'Districts / Locations', ru: 'Районы / Локации' },
  cuisine: { en: 'Cuisine Types', ru: 'Типы кухни' },
  tour_type: { en: 'Tour Types', ru: 'Типы туров' },
  amenity: { en: 'Amenities', ru: 'Удобства' },
  property_type: { en: 'Property Types', ru: 'Типы недвижимости' },
  yacht_type: { en: 'Yacht Types', ru: 'Типы яхт' },
  event_category: { en: 'Event Categories', ru: 'Категории мероприятий' },
  service_type: { en: 'Service Types', ru: 'Типы услуг' },
  pet_type: { en: 'Pet Types', ru: 'Типы питомцев' },
  vehicle_type: { en: 'Vehicle Types', ru: 'Типы транспорта' },
  gym_type: { en: 'Gym Types', ru: 'Типы залов' },
  salon_type: { en: 'Salon Types', ru: 'Типы салонов' },
  clinic_specialty: { en: 'Medical Specialties', ru: 'Медицинские специальности' },
};

export function useLookupValues(lookupType?: LookupType) {
  const { user } = useAuth();
  const [values, setValues] = useState<LookupValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchValues = useCallback(async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('lookup_values')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (lookupType) {
      query = query.eq('lookup_type', lookupType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching lookup values:', error);
      toast.error('Failed to load lookup values');
    } else {
      setValues((data || []) as LookupValue[]);
    }
    
    setIsLoading(false);
  }, [lookupType]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  const createValue = async (valueData: Omit<LookupValue, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('lookup_values')
      .insert(valueData as any)
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to create value');
      return { error };
    }
    
    toast.success('Value created successfully');
    await fetchValues();
    return { data };
  };

  const updateValue = async (id: string, valueData: Partial<LookupValue>) => {
    const { data, error } = await supabase
      .from('lookup_values')
      .update(valueData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to update value');
      return { error };
    }
    
    toast.success('Value updated successfully');
    await fetchValues();
    return { data };
  };

  const deleteValue = async (id: string) => {
    const { error } = await supabase
      .from('lookup_values')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete value');
      return { error };
    }
    
    toast.success('Value deleted successfully');
    await fetchValues();
    return { error: null };
  };

  const reorderValues = async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }));
    
    for (const update of updates) {
      await supabase
        .from('lookup_values')
        .update({ sort_order: update.sort_order } as any)
        .eq('id', update.id);
    }
    
    await fetchValues();
  };

  return {
    values,
    isLoading,
    createValue,
    updateValue,
    deleteValue,
    reorderValues,
    refetch: fetchValues,
  };
}

// Hook to get lookup values for use in forms (read-only, cached)
export function useLookupOptions(lookupType: LookupType) {
  const [options, setOptions] = useState<{ value: string; label_en: string; label_ru: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('lookup_values')
        .select('value_key, value_en, value_ru')
        .eq('lookup_type', lookupType)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      setOptions(
        (data || []).map((item: any) => ({
          value: item.value_key,
          label_en: item.value_en,
          label_ru: item.value_ru || item.value_en,
        }))
      );
      setIsLoading(false);
    };
    
    fetchOptions();
  }, [lookupType]);

  return { options, isLoading };
}
