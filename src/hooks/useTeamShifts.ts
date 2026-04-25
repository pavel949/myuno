/**
 * Team shifts & timesheets — schedule and clock-in/out for staff.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';

export interface TeamShift {
  id: string;
  company_id: string;
  assignee_user_id: string;
  property_id: string | null;
  role_label: string | null;
  start_at: string;
  end_at: string;
  status: ShiftStatus;
  notes: string | null;
  created_at: string;
}

export interface TeamTimesheet {
  id: string;
  company_id: string;
  shift_id: string | null;
  user_id: string;
  property_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export function useCompanyShifts(range?: { from?: string; to?: string }) {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['team-shifts', activeCompany?.company_id, range?.from, range?.to],
    queryFn: async (): Promise<TeamShift[]> => {
      if (!activeCompany) return [];
      let q = supabase
        .from('team_shifts')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('start_at', { ascending: true });
      if (range?.from) q = q.gte('start_at', range.from);
      if (range?.to) q = q.lte('start_at', range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as TeamShift[];
    },
    enabled: !!activeCompany,
  });
}

export function useMyShifts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-shifts', user?.id],
    queryFn: async (): Promise<TeamShift[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('team_shifts')
        .select('*')
        .eq('assignee_user_id', user.id)
        .gte('end_at', new Date(Date.now() - 86400000).toISOString())
        .order('start_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TeamShift[];
    },
    enabled: !!user,
  });
}

export function useCompanyTimesheets(range?: { from?: string; to?: string }) {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['team-timesheets', activeCompany?.company_id, range?.from, range?.to],
    queryFn: async (): Promise<TeamTimesheet[]> => {
      if (!activeCompany) return [];
      let q = supabase
        .from('team_timesheets')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('clock_in_at', { ascending: false })
        .limit(500);
      if (range?.from) q = q.gte('clock_in_at', range.from);
      if (range?.to) q = q.lte('clock_in_at', range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as TeamTimesheet[];
    },
    enabled: !!activeCompany,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: {
      assignee_user_id: string;
      property_id?: string;
      role_label?: string;
      start_at: string;
      end_at: string;
      notes?: string;
    }) => {
      if (!activeCompany || !user) throw new Error('Missing context');
      const { error } = await supabase.from('team_shifts').insert({
        company_id: activeCompany.company_id,
        assignee_user_id: args.assignee_user_id,
        property_id: args.property_id ?? null,
        role_label: args.role_label ?? null,
        start_at: args.start_at,
        end_at: args.end_at,
        notes: args.notes ?? null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shift scheduled');
      qc.invalidateQueries({ queryKey: ['team-shifts'] });
      qc.invalidateQueries({ queryKey: ['my-shifts'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: { shift_id?: string; property_id?: string; lat?: number; lng?: number }) => {
      if (!user || !activeCompany) throw new Error('Missing context');
      const { data, error } = await supabase
        .from('team_timesheets')
        .insert({
          company_id: activeCompany.company_id,
          user_id: user.id,
          shift_id: args.shift_id ?? null,
          property_id: args.property_id ?? null,
          clock_in_lat: args.lat ?? null,
          clock_in_lng: args.lng ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      if (args.shift_id) {
        await supabase.from('team_shifts').update({ status: 'in_progress' }).eq('id', args.shift_id);
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Clocked in');
      qc.invalidateQueries({ queryKey: ['team-timesheets'] });
      qc.invalidateQueries({ queryKey: ['my-shifts'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to clock in'),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { timesheet_id: string; shift_id?: string; notes?: string }) => {
      const { error } = await supabase
        .from('team_timesheets')
        .update({ clock_out_at: new Date().toISOString(), notes: args.notes ?? null })
        .eq('id', args.timesheet_id);
      if (error) throw error;
      if (args.shift_id) {
        await supabase.from('team_shifts').update({ status: 'completed' }).eq('id', args.shift_id);
      }
    },
    onSuccess: () => {
      toast.success('Clocked out');
      qc.invalidateQueries({ queryKey: ['team-timesheets'] });
      qc.invalidateQueries({ queryKey: ['my-shifts'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to clock out'),
  });
}
