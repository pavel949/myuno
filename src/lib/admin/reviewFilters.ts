/** Read-only views of existing catalogue fields. These filters never assign a status. */
export const PROPERTY_APPROVAL_FILTERS = ['all', 'pending', 'draft', 'rejected', 'approved'] as const;
export const ACTIVITY_FILTERS = ['all', 'active', 'inactive'] as const;
export const PROJECT_REVIEW_FILTERS = ['all', 'pending', 'needs_review', 'orphan', 'stale', 'approved'] as const;
export const PROJECT_STAGE_FILTERS = ['all', 'offplan', 'under_construction', 'completed'] as const;
export const UNASSIGNED_DEVELOPER_ID = '00000000-0000-0000-0000-000000000001';

export function readFilter<T extends string>(value: string | null, allowed: readonly T[]): T {
  return allowed.find(option => option === value) ?? allowed[0];
}

export function updateReviewParams(previous: URLSearchParams, updates: Record<string, string>): URLSearchParams {
  const next = new URLSearchParams(previous);
  Object.entries(updates).forEach(([key, value]) => {
    const isEnumFilter = ['activity', 'status', 'stage', 'filter'].includes(key);
    if (!value || (isEnumFilter && value === 'all')) next.delete(key);
    else next.set(key, value);
  });
  return next;
}

function matchesSearch(query: string, fields: (string | null | undefined)[]) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || fields.some(field => field?.toLocaleLowerCase().includes(normalized));
}

type PropertyReviewRecord = {
  title_en?: string | null; title_ru?: string | null; internal_name?: string | null;
  district?: string | null; address?: string | null;
  is_active?: boolean | null; approval_status?: string | null;
};
export function matchesPropertyReview(property: PropertyReviewRecord, filters: {
  q: string;
  activity: typeof ACTIVITY_FILTERS[number];
  status: typeof PROPERTY_APPROVAL_FILTERS[number];
}) {
  return matchesSearch(filters.q, [property.title_en, property.title_ru, property.internal_name, property.district, property.address])
    && (filters.activity === 'all' || property.is_active === (filters.activity === 'active'))
    && (filters.status === 'all' || property.approval_status === filters.status);
}

type ProjectReviewRecord = {
  name_en?: string | null; name_ru?: string | null; address?: string | null;
  district?: string | null; developer_name?: string | null; developer_id?: string | null;
  project_status?: string | null; is_approved?: boolean | null; needs_review?: boolean | null;
  updated_at?: string | null;
};
export function matchesProjectReview(project: ProjectReviewRecord, filters: {
  q: string;
  stage: typeof PROJECT_STAGE_FILTERS[number];
  review: typeof PROJECT_REVIEW_FILTERS[number];
}, now = Date.now()) {
  if (!matchesSearch(filters.q, [project.name_en, project.name_ru, project.address, project.district, project.developer_name])) return false;
  if (filters.stage !== 'all' && project.project_status !== filters.stage) return false;
  switch (filters.review) {
    case 'orphan': return project.developer_id === UNASSIGNED_DEVELOPER_ID;
    case 'needs_review': return project.needs_review === true;
    case 'pending': return project.is_approved === false;
    case 'approved': return project.is_approved === true;
    // Same predicate as useAdminNewbuildsKpi, not a new persisted review state.
    case 'stale': return project.is_approved === true && !!project.updated_at
      && Date.parse(project.updated_at) <= now - 45 * 24 * 3600 * 1000;
    default: return true;
  }
}
