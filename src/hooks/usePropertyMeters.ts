import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface PropertyMeter {
  id: string;
  property_id: string;
  meter_type: 'electricity' | 'water' | 'gas';
  meter_name: string;
  meter_name_ru: string | null;
  unit: string;
  rate_per_unit: number | null;
  currency: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMeterInput {
  property_id: string;
  meter_type: PropertyMeter['meter_type'];
  meter_name: string;
  meter_name_ru?: string;
  unit?: string;
  rate_per_unit?: number;
  currency?: string;
  location?: string;
}

export const METER_TYPES = {
  electricity: { 
    en: 'Electricity', 
    ru: 'Электричество',
    icon: '⚡',
    defaultUnit: 'kWh',
  },
  water: { 
    en: 'Water', 
    ru: 'Вода',
    icon: '💧',
    defaultUnit: 'm³',
  },
  gas: { 
    en: 'Gas', 
    ru: 'Газ',
    icon: '🔥',
    defaultUnit: 'm³',
  },
} as const;

export function usePropertyMeters(propertyId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Fetch meters
  const { data: meters = [], isLoading } = useQuery({
    queryKey: ['property-meters', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('property_meters')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('meter_type', { ascending: true });

      if (error) throw error;
      return (data || []) as PropertyMeter[];
    },
    enabled: !!propertyId,
  });

  // Group by type
  const metersByType = meters.reduce((acc, meter) => {
    if (!acc[meter.meter_type]) {
      acc[meter.meter_type] = [];
    }
    acc[meter.meter_type].push(meter);
    return acc;
  }, {} as Record<string, PropertyMeter[]>);

  // Create meter
  const createMeter = useMutation({
    mutationFn: async (input: CreateMeterInput) => {
      const meterType = METER_TYPES[input.meter_type];
      
      const { data, error } = await supabase
        .from('property_meters')
        .insert({
          ...input,
          unit: input.unit || meterType.defaultUnit,
          currency: input.currency || 'THB',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-meters', propertyId] });
      toast({
        title: t('Meter added', 'Счётчик добавлен'),
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

  // Update meter
  const updateMeter = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyMeter> & { id: string }) => {
      const { data, error } = await supabase
        .from('property_meters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-meters', propertyId] });
      toast({
        title: t('Meter updated', 'Счётчик обновлён'),
      });
    },
  });

  // Delete meter (soft delete)
  const deleteMeter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_meters')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-meters', propertyId] });
      toast({
        title: t('Meter removed', 'Счётчик удалён'),
      });
    },
  });

  return {
    meters,
    metersByType,
    isLoading,
    createMeter,
    updateMeter,
    deleteMeter,
    hasMeters: meters.length > 0,
  };
}
