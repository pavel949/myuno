import { untypedRpc } from '@/lib/untypedTables';
import { MANAGED_PROPERTY_DRAFT_FIELDS } from '@/lib/managedPropertyDraftFields';
import { propertyAuthoringPatch } from '@/lib/propertyAuthoring';
import type { OwnerProperty } from '@/types/property';

export type PropertyRevisionStatus = 'draft' | 'pending' | 'rejected' | 'approved';
export interface PropertyRevision {
  version: string;
  status: PropertyRevisionStatus;
  base: Record<string, unknown>;
  patch: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reason?: string | null;
}
export interface PropertyRevisionState {
  property: OwnerProperty;
  revision: PropertyRevision | null;
  conflict: boolean;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Property revision response was not confirmed');
  return value as Record<string, unknown>;
}
function content(value: unknown) {
  const row = record(value);
  const fields = new Set<string>(MANAGED_PROPERTY_DRAFT_FIELDS);
  if (Object.keys(row).some(key => !fields.has(key))) throw new Error('Property revision contains unsupported content');
  return row;
}
export function parsePropertyRevisionState(value: unknown, propertyId?: string, companyId?: string): PropertyRevisionState {
  const result = record(value);
  const row = record(result.property);
  if (typeof row.id !== 'string' || typeof row.management_company_id !== 'string'
    || typeof row.updated_at !== 'string' || row.approval_status !== 'approved' || row.is_active !== true
    || typeof result.conflict !== 'boolean' || (propertyId && row.id !== propertyId)
    || (companyId && row.management_company_id !== companyId)) throw new Error('Property revision does not match this published property');
  const fields = new Set<string>([...MANAGED_PROPERTY_DRAFT_FIELDS, 'id', 'management_company_id', 'approval_status', 'is_active', 'created_at', 'updated_at', 'rejection_reason']);
  const property = Object.fromEntries(Object.entries(row).filter(([key]) => fields.has(key))) as unknown as OwnerProperty;
  let revision: PropertyRevision | null = null;
  if (result.revision !== null) {
    const draft = record(result.revision);
    if (typeof draft.version !== 'string' || !uuid.test(draft.version)
      || !['draft', 'pending', 'rejected', 'approved'].includes(String(draft.status))
      || typeof draft.created_at !== 'string' || typeof draft.updated_at !== 'string'
      || (draft.reason != null && typeof draft.reason !== 'string')) throw new Error('Property revision version was not confirmed');
    revision = {
      version: draft.version, status: draft.status as PropertyRevisionStatus,
      base: content(draft.base), patch: content(draft.patch),
      created_at: draft.created_at, updated_at: draft.updated_at,
      submitted_at: typeof draft.submitted_at === 'string' ? draft.submitted_at : null,
      reviewed_at: typeof draft.reviewed_at === 'string' ? draft.reviewed_at : null,
      reason: typeof draft.reason === 'string' ? draft.reason : null,
    };
  }
  return { property, revision, conflict: result.conflict };
}
export function propertyRevisionEditingRow(state: PropertyRevisionState): OwnerProperty {
  if (!state.revision || state.revision.status === 'approved') return state.property;
  return { ...state.property, ...state.revision.base, ...state.revision.patch } as OwnerProperty;
}
export async function readPropertyRevision(propertyId: string, companyId?: string) {
  const { data, error } = await untypedRpc('read_managed_property_revision_checked', { p_property_id: propertyId });
  if (error) throw new Error(error.message);
  return parsePropertyRevisionState(data, propertyId, companyId);
}
export async function listPendingPropertyRevisions(offset = 0, limit = 50) {
  const { data, error } = await untypedRpc('list_managed_property_revisions_checked', { p_limit: limit, p_offset: offset });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Property revision queue was not confirmed');
  return data.map(value => {
    const state = parsePropertyRevisionState(value);
    if (state.revision?.status !== 'pending') throw new Error('Property revision queue contains an unexpected status');
    return state;
  });
}
export async function savePropertyRevision(args: {
  propertyId: string; companyId: string; expectedUpdatedAt: string; expectedRevision: string | null;
  patch: Record<string, unknown>; submit?: boolean; restart?: boolean;
}) {
  if (!args.expectedUpdatedAt) throw new Error('Reload the property revision before saving');
  const { data, error } = await untypedRpc('save_managed_property_revision_checked', {
    p_property_id: args.propertyId, p_expected_updated_at: args.expectedUpdatedAt,
    p_expected_revision: args.expectedRevision, p_patch: propertyAuthoringPatch(args.patch),
    p_submit: args.submit === true, p_restart: args.restart === true,
  });
  if (error) throw new Error(error.message);
  const state = parsePropertyRevisionState(data, args.propertyId, args.companyId);
  if (state.revision?.status !== (args.submit ? 'pending' : 'draft') || state.conflict
    || state.property.updated_at === args.expectedUpdatedAt || state.revision.version === args.expectedRevision) {
    throw new Error('Property revision save was not confirmed. Reload before retrying.');
  }
  return state;
}
export async function reviewPropertyRevision(state: PropertyRevisionState, decision: 'approve' | 'reject', reason?: string) {
  if (!state.revision || state.revision.status !== 'pending') throw new Error('Reload the pending revision before review');
  if (decision === 'approve' && state.conflict) throw new Error('Published content changed. Return this revision for correction.');
  if (decision === 'reject' && !reason?.trim()) throw new Error('A reason is required to return the revision');
  const { data, error } = await untypedRpc('review_managed_property_revision_checked', {
    p_property_id: state.property.id, p_expected_updated_at: state.property.updated_at,
    p_expected_revision: state.revision.version, p_decision: decision, p_reason: reason?.trim() || null,
  });
  if (error) throw new Error(error.message);
  const saved = parsePropertyRevisionState(data, state.property.id, state.property.management_company_id!);
  if (saved.revision?.status !== (decision === 'approve' ? 'approved' : 'rejected')
    || saved.revision.version === state.revision.version || saved.property.updated_at === state.property.updated_at) {
    throw new Error('Property revision review was not confirmed. Reload before retrying.');
  }
  return saved;
}
