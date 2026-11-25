import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ProjectLifecycleStatus } from '@/lib/real-estate/canonicalModel';
import { applyProjectCatalogFilters, applyProjectCatalogSort, createProjectCatalogQuery } from './projectCatalogQuery';
import { invalidateProjectPriceReaders } from '@/lib/real-estate/invalidateProjectPriceReaders';
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
  developer_id?: string | null;
  developer_name?: string;
  year_built?: number;
  total_units?: number;
  cover_image?: string;
  images?: string[];
  gallery_urls?: string[] | null;
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
  developer_id?: string | null;
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
  gallery_urls?: string[] | null;
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

// Guest pages request only descriptive, public project facts; no investment or private fields.
export const GUEST_PROJECT_COLUMNS = 'id,name_en,name_ru,description_en,description_ru,address,district,lat,lng,cover_image,images,video_url,amenities,infrastructure,is_active';

/** Public, allowlisted project collection for guest discovery surfaces. */
export function usePublicPropertyProjects(limit = 24, district?: string, projectIds?: string[]) {
  const ids = projectIds === undefined ? undefined : [...new Set(projectIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: ids === undefined
      ? district ? ['public-property-projects', limit, district] : ['public-property-projects', limit]
      : ['public-property-projects', limit, district ?? null, { ids }],
    enabled: ids === undefined || ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (ids?.length === 0) return [];
      let query = createProjectCatalogQuery(GUEST_PROJECT_COLUMNS).eq('is_active', true);
      if (ids) query = query.in('id', ids);
      if (district) query = query.eq('district', district);
      const { data, error } = await query.order('name_en').limit(limit);

      if (error) throw error;
      return (data as unknown as PropertyProject[]).map((p) => withNormalizedProjectAmenities(p));
    },
  });
}

const GUEST_PROJECT_DETAIL_COLUMNS = `${GUEST_PROJECT_COLUMNS},gallery_urls` as const;

export function usePropertyProject(id?: string, publicOnly = false) {
  return useQuery({
    queryKey: ['property-project', id, publicOnly],
    queryFn: async () => {
      if (!id) return null;
      
      let query = supabase.from('property_projects')
        .select(publicOnly ? GUEST_PROJECT_DETAIL_COLUMNS : '*')
        .eq('id', id);
      if (publicOnly) query = query.eq('is_active', true);
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return withNormalizedProjectAmenities(data as unknown as PropertyProject);
    },
    enabled: !!id,
  });
}

const projectCollectionKeys = [
  'property-projects', 'admin-property-projects', 'public-property-projects', 'my-property-projects',
  'admin-nb-projects', 'project-districts', 'newbuild-locations', 'admin-newbuilds-kpi', 'developer-projects',
];

export function invalidateProjectCatalog(queryClient: QueryClient, projectIds?: Iterable<string>) {
  const ids = projectIds ? new Set(projectIds) : undefined;
  return Promise.all([
    invalidateProjectPriceReaders(queryClient),
    queryClient.invalidateQueries({
      predicate: ({ queryKey: [family, id] }) =>
        (typeof family === 'string' && projectCollectionKeys.includes(family)) ||
        (family === 'property-project' && (!ids || (typeof id === 'string' && ids.has(id)))),
    }),
  ]);
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
      if (!data?.id || (projectData.developer_id !== undefined && data.developer_id !== projectData.developer_id)) {
        throw new Error('Project update was not confirmed');
      }
      return data as PropertyProject;
    },
    onSuccess: (data) => {
      void invalidateProjectCatalog(queryClient, [data.id]);
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
      if (data?.id !== id || (projectData.developer_id !== undefined && data.developer_id !== projectData.developer_id)) {
        throw new Error('Project update was not confirmed');
      }
      return data as PropertyProject;
    },
    onSuccess: (data) => {
      void invalidateProjectCatalog(queryClient, [data.id]);
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
