import { typedFrom } from '@/lib/untypedTables';

export type ProjectCatalogSort =
  | 'featured_score'
  | 'name'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'progress';

export interface ProjectCatalogFilters {
  isActive?: boolean;
  isApproved?: boolean;
  statuses?: string[];
  district?: string;
  locationArea?: string;
  developerId?: string;
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  investmentOnly?: boolean;
  createdBy?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProjectCatalogQuery = any;

export function applyProjectCatalogFilters(
  query: ProjectCatalogQuery,
  filters?: ProjectCatalogFilters,
): ProjectCatalogQuery {
  let q = query;

  if (filters?.isActive !== undefined) q = q.eq('is_active', filters.isActive);
  if (filters?.isApproved !== undefined) q = q.eq('is_approved', filters.isApproved);
  if (filters?.statuses && filters.statuses.length > 0) q = q.in('project_status', filters.statuses);
  if (filters?.district) q = q.eq('district', filters.district);
  if (filters?.locationArea) q = q.eq('location_area', filters.locationArea);
  if (filters?.developerId) q = q.eq('developer_id', filters.developerId);
  if (filters?.minPrice) q = q.gte('price_from', filters.minPrice);
  if (filters?.maxPrice) q = q.lte('price_from', filters.maxPrice);
  if (filters?.minScore) q = q.gte('muuno_score', filters.minScore);
  if (filters?.investmentOnly) q = q.eq('investment_enabled', true);
  if (filters?.createdBy) q = q.eq('created_by', filters.createdBy);

  return q;
}

export function applyProjectCatalogSort(
  query: ProjectCatalogQuery,
  sort: ProjectCatalogSort = 'featured_score',
): ProjectCatalogQuery {
  switch (sort) {
    case 'name':
      return query.order('name_en');
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'price_asc':
      return query.order('price_from', { ascending: true });
    case 'price_desc':
      return query.order('price_from', { ascending: false });
    case 'progress':
      return query.order('construction_progress', { ascending: false });
    default:
      return query
        .order('is_featured', { ascending: false })
        .order('muuno_score', { ascending: false, nullsFirst: false });
  }
}

export function createProjectCatalogQuery(select: string): ProjectCatalogQuery {
  return typedFrom('property_projects').select(select);
}
