import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type AreaGuide, areaInventoryFilters } from '@/content/areas/areaRegistry';
import { useProperties, usePropertiesCount } from './useProperties';
import { useOffplanProjects } from './useOffplanProjects';
import { useResaleProperties } from './useResaleProperties';
import { applyProjectCatalogFilters } from './projectCatalogQuery';

export const uniqueById = <T extends { id: string }>(rows: readonly T[]) => [...new Map(rows.map(row => [row.id, row])).values()];
/** Counts use server exact counts, never the length of a truncated preview.
 * Each category retains its existing search predicate and entity identity.
 */
export function useAreaInventory(area: AreaGuide) {
  const filters = areaInventoryFilters(area);
  const rentals = usePropertiesCount(filters.rentals);
  const projects = useQuery({ queryKey: ['area-project-count', filters.projects], queryFn: async () => {
    const query = supabase.from('property_projects').select('id', { count: 'exact', head: true });
    // The public project search uses active + exact district (not rental aliases).
    const { count, error } = await applyProjectCatalogFilters(query, { isActive: true, ...filters.projects });
    if (error) throw error;
    if (count == null) throw new Error('Exact inventory count unavailable');
    return count;
  } });
  const resale = useQuery({ queryKey: ['area-resale-count', filters.resale], queryFn: async () => {
    const { count, error } = await supabase.from('resale_properties').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('zone', filters.resale.zone);
    if (error) throw error;
    if (count == null) throw new Error('Exact inventory count unavailable');
    return count;
  } });
  return { rentals, projects, resale };
}

export function useAreaPreviews(area: AreaGuide) {
  const filters = areaInventoryFilters(area);
  return {
    rentals: useProperties(filters.rentals, 6),
    projects: useOffplanProjects(filters.projects),
    resale: useResaleProperties(filters.resale),
  };
}
