/**
 * Hook for dynamic property quick filters
 * Loads property_highlights from lookup_values and property_projects for complex filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, isAfter } from 'date-fns';
import type { Property } from '@/hooks/useProperties';

export interface QuickFilter {
  id: string;
  type: 'boolean' | 'highlight' | 'amenity' | 'computed' | 'project';
  labelEn: string;
  labelRu: string;
  icon?: string;
  field?: string; // for boolean: 'instant_booking', 'is_verified'
  value?: string; // for highlight/amenity: value_key
  projectId?: string; // for complex/residence filtering
  metadata?: Record<string, unknown>;
}

export interface PropertyProject {
  id: string;
  nameEn: string;
  nameRu: string;
  propertyCount: number;
  coverImage?: string;
}

export interface DistrictOption {
  id: string;
  valueKey: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
}

interface LookupValueRow {
  id: string;
  value_key: string;
  value_en: string;
  value_ru: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: unknown;
}

export function usePropertyQuickFilters() {
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const [projects, setProjects] = useState<PropertyProject[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch property_highlight from lookup_values
      const { data: highlights, error: highlightsError } = await supabase
        .from('lookup_values')
        .select('id, value_key, value_en, value_ru, icon, sort_order, is_active, metadata')
        .eq('lookup_type', 'property_highlight')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // highlightsError is non-blocking

      // Fetch property_projects for complex filtering
      const { data: projectsData, error: projectsError } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru, cover_image')
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      // projectsError is non-blocking

      // Fetch districts from lookup_values
      const { data: districtsData, error: districtsError } = await supabase
        .from('lookup_values')
        .select('id, value_key, value_en, value_ru, icon')
        .eq('lookup_type', 'district')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // districtsError is non-blocking

      // Count properties per project
      const { data: projectCounts } = await supabase
        .from('properties')
        .select('project_id')
        .not('project_id', 'is', null);

      const countMap = new Map<string, number>();
      (projectCounts || []).forEach((p: { project_id: string }) => {
        countMap.set(p.project_id, (countMap.get(p.project_id) || 0) + 1);
      });

      // Transform highlights to QuickFilter format
      const filters: QuickFilter[] = (highlights || []).map((h: LookupValueRow) => {
        const meta = (h.metadata && typeof h.metadata === 'object' && !Array.isArray(h.metadata)) 
          ? h.metadata as Record<string, unknown>
          : {};
        return {
          id: h.value_key,
          type: (meta.type as QuickFilter['type']) || 'highlight',
          labelEn: h.value_en,
          labelRu: h.value_ru || h.value_en,
          icon: h.icon || undefined,
          field: meta.field as string | undefined,
          value: meta.value as string | undefined,
          metadata: meta,
        };
      });

      setQuickFilters(filters);

      // Transform projects
      const projectsList: PropertyProject[] = (projectsData || [])
        .map((p: { id: string; name_en: string; name_ru: string; cover_image?: string }) => ({
          id: p.id,
          nameEn: p.name_en,
          nameRu: p.name_ru,
          propertyCount: countMap.get(p.id) || 0,
          coverImage: p.cover_image,
        }))
        .filter((p) => p.propertyCount > 0); // Only show projects with properties

      setProjects(projectsList);

      // Transform districts
      const districtsList: DistrictOption[] = (districtsData || []).map(
        (d: { id: string; value_key: string; value_en: string; value_ru: string | null; icon: string | null }) => ({
          id: d.id,
          valueKey: d.value_key,
          labelEn: d.value_en,
          labelRu: d.value_ru || d.value_en,
          icon: d.icon || undefined,
        })
      );

      setDistricts(districtsList);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return {
    quickFilters,
    projects,
    districts,
    isLoading,
  };
}

/**
 * Apply quick filters to a list of properties
 */
export function applyQuickFilters(
  properties: Property[],
  selectedFilters: string[],
  selectedProjectId?: string | null
): Property[] {
  if (selectedFilters.length === 0 && !selectedProjectId) {
    return properties;
  }

  return properties.filter((property) => {
    // Project filter
    if (selectedProjectId && property.project_id !== selectedProjectId) {
      return false;
    }

    // Quick filters - must match ALL selected
    for (const filterId of selectedFilters) {
      if (!matchesQuickFilter(property, filterId)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if a property matches a specific quick filter
 */
export function matchesQuickFilter(property: Property, filterId: string): boolean {
  switch (filterId) {
    // Boolean fields
    case 'instant_book':
      return property.instant_booking === true;
    case 'verified':
      return property.is_verified === true;
    case 'featured':
      return property.is_featured === true;

    // Computed filters
    case 'new_listing':
      if (!property.created_at) return false;
      return isAfter(new Date(property.created_at), subDays(new Date(), 30));
    case 'special_offer':
      return (property.monthly_discount || 0) > 0 || (property.weekly_discount || 0) > 0;

    // Highlight-based (stored in property.highlights array)
    case 'sea_view':
    case 'walking_to_beach':
    case 'full_service':
    case 'designer_interior':
      return (property.highlights || []).includes(filterId) ||
             (property.amenities || []).includes(filterId.replace('_', '-'));

    // Amenity-based
    case 'pet_friendly':
      return (property.amenities || []).some(a => 
        a.toLowerCase().includes('pet') || a === 'pet-friendly'
      );
    case 'pool':
      return (property.amenities || []).some(a => 
        a.toLowerCase().includes('pool')
      );
    case 'gym':
      return (property.amenities || []).some(a => 
        a.toLowerCase().includes('gym') || a.toLowerCase().includes('fitness')
      );

    default:
      // Check in highlights array as fallback
      return (property.highlights || []).includes(filterId);
  }
}
