import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
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
      let q = typedFrom('property_maintenance_schedules')
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
      const { error } = await typedFrom('property_maintenance_schedules')
        .insert({ ...schedule, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markCompleted = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await typedFrom('property_maintenance_schedules')
        .update({ last_completed_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, last_completed_at')
        .maybeSingle();
      if (error) throw error;
      if (!data || data.id !== id || !data.last_completed_at) throw new Error('Maintenance completion was not confirmed. Refresh and retry.');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Marked as completed');
    },
    onError: (e: Error) => toast.error(e.message),
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
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await typedFrom('property_maintenance_schedules')
        .update(fields)
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data || data.id !== id) throw new Error('Maintenance update was not confirmed. Refresh and retry.');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await typedFrom('property_maintenance_schedules')
        .update({ is_active: false })
        .eq('id', id)
        .select('id, is_active')
        .maybeSingle();
      if (error) throw error;
      if (!data || data.id !== id || data.is_active !== false) throw new Error('Maintenance removal was not confirmed. Refresh and retry.');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, addSchedule, markCompleted, updateSchedule, deleteSchedule };
}
