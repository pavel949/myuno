import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ProjectLifecycleStatus } from '@/lib/real-estate/canonicalModel';
import { applyProjectCatalogFilters, applyProjectCatalogSort, createProjectCatalogQuery } from './projectCatalogQuery';
import { normalizeProjectFacilityIds } from '@/lib/propertyAttributeRegistry';

function withNormalizedProjectAmenities<T extends { amenities?: string[] | null }>(row: T): T {
  if (!row) return row;
  const amenities = row.amenities;
  if (!Array.isArray(amenities) || amenities.length === 0) return row;
  return { ...row, amenities: normalizeProjectFacilityIds(amenities) };
}

export type ProjectStatus = ProjectLifecycleStatus;

export interface PropertyProject {
  id: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  developer_id?: string;
  developer_name?: string;
  year_built?: number;
  total_units?: number;
  cover_image?: string;
  images?: string[];
  video_url?: string;
  amenities?: string[];
  infrastructure?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  // Off-plan specific fields
  project_status?: ProjectStatus;
  completion_date?: string;
  construction_progress?: number;
  price_from?: number;
  price_to?: number;
  investment_enabled?: boolean;
  funding_goal?: number;
  min_investment?: number;
  roi_projected?: number;
  muuno_score?: number;
  risk_level?: string;
  units_available?: number;
  units_sold?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Admin moderation fields
  needs_review?: boolean;
  is_approved?: boolean;
}

export interface CreatePropertyProjectData {
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  developer_name?: string;
  year_built?: number;
  total_units?: number;
  cover_image?: string;
  images?: string[];
  video_url?: string;
  amenities?: string[];
  infrastructure?: string[];
}

export function usePropertyProjects() {
  return useQuery({
    queryKey: ['property-projects'],
    queryFn: async () => {
      let query = createProjectCatalogQuery('*');
      query = applyProjectCatalogFilters(query, { isActive: true });
      query = applyProjectCatalogSort(query, 'name');
      const { data, error } = await query;

      if (error) throw error;
      return (data as PropertyProject[]).map((p) => withNormalizedProjectAmenities(p));
    },
  });
}

// Admin: fetch all projects including inactive
export function useAdminPropertyProjects() {
  return useQuery({
    queryKey: ['admin-property-projects'],
    queryFn: async () => {
      const { data, error } = await applyProjectCatalogSort(
        createProjectCatalogQuery('*'),
        'newest',
      );

      if (error) throw error;
      return (data as PropertyProject[]).map((p) => withNormalizedProjectAmenities(p));
    },
  });
}

export function usePropertyProject(id?: string) {
  return useQuery({
    queryKey: ['property-project', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('property_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return withNormalizedProjectAmenities(data as PropertyProject);
    },
    enabled: !!id,
  });
}

export function useCreatePropertyProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (projectData: CreatePropertyProjectData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('property_projects')
        .insert({
          ...projectData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PropertyProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-projects'] });
      toast.success('Project created successfully');
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });
}

export function useUpdatePropertyProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...projectData }: Partial<PropertyProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('property_projects')
        .update(projectData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-projects'] });
      queryClient.invalidateQueries({ queryKey: ['property-project', data.id] });
      toast.success('Project updated successfully');
    },
    onError: () => {
      toast.error('Failed to update project');
    },
  });
}

export function useMyPropertyProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-property-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = createProjectCatalogQuery('*');
      query = applyProjectCatalogFilters(query, { createdBy: user.id });
      query = applyProjectCatalogSort(query, 'newest');
      const { data, error } = await query;

      if (error) throw error;
      return data as PropertyProject[];
    },
    enabled: !!user?.id,
  });
}
