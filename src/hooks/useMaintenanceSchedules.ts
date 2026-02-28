import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MaintenanceSchedule {
  id: string;
  property_id: string;
  category: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  frequency: string;
  last_completed_at: string | null;
  next_due_date: string;
  assigned_provider_id: string | null;
  estimated_cost: number;
  currency: string;
  is_active: boolean;
  priority: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  property?: { title: string } | null;
}

export function useMaintenanceSchedules(propertyId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['maintenance-schedules', user?.id, propertyId];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('property_maintenance_schedules' as any)
        .select('*, property:properties!property_id(title)')
        .eq('is_active', true)
        .order('next_due_date', { ascending: true });

      if (propertyId) {
        q = q.eq('property_id', propertyId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MaintenanceSchedule[];
    },
  });

  const addSchedule = useMutation({
    mutationFn: async (schedule: {
      property_id: string;
      category: string;
      title: string;
      title_ru?: string;
      description?: string;
      frequency: string;
      next_due_date: string;
      estimated_cost?: number;
      currency?: string;
      priority?: string;
    }) => {
      const { error } = await supabase
        .from('property_maintenance_schedules' as any)
        .insert({ ...schedule, created_by: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule added');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markCompleted = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_maintenance_schedules' as any)
        .update({ last_completed_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Marked as completed');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSchedule = useMutation({
    mutationFn: async (updates: {
      id: string;
      frequency?: string;
      next_due_date?: string;
      estimated_cost?: number;
      currency?: string;
      priority?: string;
      notes?: string | null;
    }) => {
      const { id, ...fields } = updates;
      const { error } = await supabase
        .from('property_maintenance_schedules' as any)
        .update(fields as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_maintenance_schedules' as any)
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule removed');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, addSchedule, markCompleted, updateSchedule, deleteSchedule };
}
