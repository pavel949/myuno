import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UtilityType = 'electricity' | 'water' | 'internet' | 'cam' | 'insurance' | 'gas' | 'other';

export interface UtilitySchedule {
  id: string;
  property_id: string;
  utility_type: UtilityType;
  provider_name: string | null;
  account_number: string | null;
  due_day: number | null;
  amount_estimate: number | null;
  currency: string;
  last_paid_date: string | null;
  last_paid_amount: number | null;
  auto_remind_days: number;
  is_active: boolean;
  owner_id: string | null;
  created_at: string;
}

export interface CreateUtilitySchedule {
  property_id: string;
  utility_type: UtilityType;
  provider_name?: string;
  account_number?: string;
  due_day?: number;
  amount_estimate?: number;
  currency?: string;
  auto_remind_days?: number;
}

export function useUtilitySchedules(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['utility-schedules', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_utility_schedules')
        .select('*')
        .eq('property_id', propertyId!)
        .eq('is_active', true)
        .order('due_day', { ascending: true });
      if (error) throw error;
      return data as UtilitySchedule[];
    },
    enabled: !!propertyId && !!user,
  });

  const addSchedule = useMutation({
    mutationFn: async (input: CreateUtilitySchedule) => {
      const { data, error } = await supabase
        .from('property_utility_schedules')
        .insert({ ...input, owner_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-schedules', propertyId] });
    },
  });

  const markPaid = useMutation({
    mutationFn: async ({ scheduleId, amount }: { scheduleId: string; amount?: number }) => {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('property_utility_schedules')
        .update({ last_paid_date: today, ...(amount != null ? { last_paid_amount: amount } : {}) })
        .eq('id', scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-schedules', propertyId] });
    },
  });

  const removeSchedule = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('property_utility_schedules')
        .update({ is_active: false })
        .eq('id', scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-schedules', propertyId] });
    },
  });

  return { schedules: schedules || [], isLoading, addSchedule, markPaid, removeSchedule };
}

/** Get utility schedules for multiple properties — used in dashboard */
export function useUtilityOverview(propertyIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['utility-overview', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await supabase
        .from('property_utility_schedules')
        .select('id, property_id, utility_type, due_day, amount_estimate, currency, last_paid_date, provider_name')
        .in('property_id', propertyIds)
        .eq('is_active', true);
      if (error) throw error;
      return data as Pick<UtilitySchedule, 'id' | 'property_id' | 'utility_type' | 'due_day' | 'amount_estimate' | 'currency' | 'last_paid_date' | 'provider_name'>[];
    },
    enabled: propertyIds.length > 0 && !!user,
  });
}
