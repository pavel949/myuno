/**
 * CRUD hook for project_units table (unit-level inventory for developments)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectUnit {
  id: string;
  project_id: string;
  unit_code: string | null;
  unit_type: string;
  floor: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  currency: string;
  price_per_sqm: number | null;
  status: 'available' | 'reserved' | 'sold' | 'held';
  view_type: string | null;
  floor_plan_url: string | null;
  property_id: string | null;
  buyer_contact_id: string | null;
  deal_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectUnitInsert = Omit<ProjectUnit, 'id' | 'created_at' | 'updated_at'>;

export function useProjectUnitsGrid(projectId?: string) {
  return useQuery({
    queryKey: ['project-units-grid', projectId],
    queryFn: async (): Promise<ProjectUnit[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('unit_code', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ProjectUnit[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProjectUnitInsert> & { project_id: string; unit_type: string }) => {
      const { error } = await supabase
        .from('project_units')
        .insert(data as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['project-units-grid', vars.project_id] });
      toast.success('Unit added');
    },
    onError: () => toast.error('Failed to add unit'),
  });
}

export function useUpdateProjectUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: { id: string; projectId: string } & Partial<ProjectUnit>) => {
      const { error } = await supabase
        .from('project_units')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['project-units-grid', projectId] });
      toast.success('Unit updated');
    },
    onError: () => toast.error('Failed to update unit'),
  });
}

export function useDeleteProjectUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_units')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['project-units-grid', projectId] });
      toast.success('Unit removed');
    },
    onError: () => toast.error('Failed to remove unit'),
  });
}

export function useProjectUnitStats(projectId?: string) {
  const { data: units = [] } = useProjectUnitsGrid(projectId);
  const total = units.length;
  const available = units.filter(u => u.status === 'available').length;
  const reserved = units.filter(u => u.status === 'reserved').length;
  const sold = units.filter(u => u.status === 'sold').length;
  const held = units.filter(u => u.status === 'held').length;
  return { total, available, reserved, sold, held };
}
