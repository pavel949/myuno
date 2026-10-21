import { MANAGED_COMPLEX_DRAFT_FIELDS } from '@/lib/managedComplexDraftFields';
import type { BoundCompanyAccessOperation } from '@/lib/companyAccessOperation';
import { propertyCreationSpace, type PropertyCreationScope } from '@/lib/propertyAuthoring';
import type { PropertyComplex, ComplexFormData } from '@/hooks/usePropertyComplexes';

export type ComplexReviewStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type ManagedComplexDraft = Omit<PropertyComplex, 'owner_id'> & {
  management_company_id: string;
  authoring_space_id: string;
  approval_status: ComplexReviewStatus;
  is_active: boolean;
  rejection_reason?: string | null;
};

const statuses = new Set<string>(['draft', 'pending', 'approved', 'rejected']);
const projectionFields = new Set<string>([...MANAGED_COMPLEX_DRAFT_FIELDS, 'id', 'management_company_id', 'authoring_space_id', 'approval_status', 'is_active', 'created_at', 'updated_at', 'rejection_reason']);

function managedComplexRow(data: unknown, companyId: string, complexId?: string): ManagedComplexDraft {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Complex response was not confirmed');
  const row = data as Record<string, unknown>;
  if (typeof row.id !== 'string' || row.management_company_id !== companyId || typeof row.authoring_space_id !== 'string' || typeof row.name !== 'string' || typeof row.updated_at !== 'string' || !row.updated_at || typeof row.approval_status !== 'string' || !statuses.has(row.approval_status) || typeof row.is_active !== 'boolean' || ((row.approval_status === 'approved') !== row.is_active) || (complexId && row.id !== complexId)) throw new Error('Complex response does not match this workspace');
  return Object.fromEntries(Object.entries(row).filter(([key]) => projectionFields.has(key))) as unknown as ManagedComplexDraft;
}

export function complexAuthoringPatch(data: ComplexFormData | Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set<string>(MANAGED_COMPLEX_DRAFT_FIELDS);
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => allowed.has(key) && value !== undefined));
}

/** Preserve clearing and exact server timestamp strings; never parse CAS tokens. */
export function complexAuthoringDelta(next: ComplexFormData, baseline: ComplexFormData): Record<string, unknown> {
  const current = complexAuthoringPatch(next), previous = complexAuthoringPatch(baseline);
  return Object.fromEntries([...new Set([...Object.keys(current), ...Object.keys(previous)])]
    .filter(key => JSON.stringify(current[key]) !== JSON.stringify(previous[key]))
    .map(key => [key, current[key] === undefined ? null : current[key]]));
}

async function complexRpc(operation: BoundCompanyAccessOperation, name: string, args: Record<string, unknown>) {
  operation.assertCurrent();
  const result = await operation.client.rpc(name, args);
  operation.assertCurrent();
  if (result.error) throw new Error(result.error.message);
  return result.data as unknown;
}

export async function readComplexCreationScope(operation: BoundCompanyAccessOperation): Promise<PropertyCreationScope> {
  const data = await complexRpc(operation, 'list_managed_property_authoring_spaces_checked', { p_company_id: operation.companyId });
  if (!Array.isArray(data) || data.some(row => !row || typeof row.id !== 'string' || typeof row.name_en !== 'string' || typeof row.name_ru !== 'string')) throw new Error('Complex Operating Spaces could not be verified');
  return { companyId: operation.companyId!, spaces: data };
}

export async function listManagedComplexDrafts(operation: BoundCompanyAccessOperation, offset = 0, limit = 50): Promise<ManagedComplexDraft[]> {
  const data = await complexRpc(operation, 'list_managed_complex_drafts_checked', { p_company_id: operation.companyId, p_limit: limit, p_offset: offset });
  if (!Array.isArray(data)) throw new Error('Complex list was not confirmed');
  return data.map(row => managedComplexRow(row, operation.companyId!));
}

export async function readManagedComplexDraft(operation: BoundCompanyAccessOperation, complexId: string): Promise<ManagedComplexDraft> {
  const data = await complexRpc(operation, 'read_managed_complex_draft_checked', { p_complex_id: complexId });
  return managedComplexRow(data, operation.companyId!, complexId);
}

export async function saveManagedComplexDraft(operation: BoundCompanyAccessOperation, args: { complexId?: string; operatingSpaceId?: string; expectedUpdatedAt?: string; patch: ComplexFormData | Record<string, unknown>; submit?: boolean }): Promise<ManagedComplexDraft> {
  const submit = args.submit === true;
  let data: unknown;
  if (args.complexId) {
    if (!args.expectedUpdatedAt) throw new Error('Reload this complex before saving');
    data = await complexRpc(operation, 'save_managed_complex_draft_checked', { p_complex_id: args.complexId, p_expected_updated_at: args.expectedUpdatedAt, p_patch: complexAuthoringPatch(args.patch), p_submit: submit });
  } else {
    // Revalidate at action time using the same verified account and frozen token.
    const scope = await readComplexCreationScope(operation);
    const spaceId = propertyCreationSpace(scope, args.operatingSpaceId);
    // Checked creation and content are atomic. Never invent a legal owner.
    data = await complexRpc(operation, 'create_managed_complex_checked', { p_company_id: operation.companyId, p_operating_space_id: spaceId, p_patch: complexAuthoringPatch(args.patch), p_submit: submit });
  }
  const saved = managedComplexRow(data, operation.companyId!, args.complexId);
  if (saved.is_active || saved.approval_status !== (submit ? 'pending' : 'draft')) throw new Error('The expected complex state was not confirmed. Reload before retrying.');
  return saved;
}

/** Protected-platform-admin queue. Each row retains its own company binding. */
export async function listManagedComplexSubmissions(operation: BoundCompanyAccessOperation, offset = 0, limit = 50): Promise<ManagedComplexDraft[]> {
  const data = await complexRpc(operation, 'list_managed_complex_submissions_checked', { p_company_id: null, p_limit: limit, p_offset: offset });
  if (!Array.isArray(data)) throw new Error('Complex review queue was not confirmed');
  return data.map(value => {
    const row = value as Record<string, unknown> | null;
    if (!row || typeof row.management_company_id !== 'string') throw new Error('Complex review scope was not confirmed');
    const projected = managedComplexRow(row, row.management_company_id);
    if (projected.approval_status !== 'pending' || projected.is_active) throw new Error('Only pending inactive complex submissions are reviewable');
    return projected;
  });
}

export async function readManagedComplexSubmission(operation: BoundCompanyAccessOperation, submission: ManagedComplexDraft): Promise<ManagedComplexDraft> {
  const data = await complexRpc(operation, 'read_managed_complex_draft_checked', { p_complex_id: submission.id });
  const row = managedComplexRow(data, submission.management_company_id, submission.id);
  if (row.approval_status !== 'pending' || row.is_active) throw new Error('Submission changed. Refresh the queue.');
  return row;
}

export async function reviewManagedComplexSubmission(operation: BoundCompanyAccessOperation, submission: ManagedComplexDraft, decision: 'approve' | 'reject', reason = ''): Promise<ManagedComplexDraft> {
  if (!submission.updated_at || submission.approval_status !== 'pending' || submission.is_active) throw new Error('Reload the pending submission before review');
  if (decision === 'reject' && !reason.trim()) throw new Error('A reason is required to return a complex for changes');
  const data = await complexRpc(operation, 'review_managed_complex_submission_checked', { p_complex_id: submission.id, p_expected_updated_at: submission.updated_at, p_decision: decision, p_reason: decision === 'reject' ? reason.trim() : null });
  const row = managedComplexRow(data, submission.management_company_id, submission.id);
  if (row.approval_status !== (decision === 'approve' ? 'approved' : 'rejected') || row.is_active !== (decision === 'approve')) throw new Error('Complex review was not confirmed. Refresh the queue.');
  return row;
}
