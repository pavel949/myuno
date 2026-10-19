import { beforeEach, describe, expect, it, vi } from 'vitest';
import { complexAuthoringDelta, complexAuthoringPatch, listManagedComplexSubmissions, readManagedComplexSubmission, reviewManagedComplexSubmission, listManagedComplexDrafts, readComplexCreationScope, readManagedComplexDraft, saveManagedComplexDraft } from '../complexAuthoring';
import type { BoundCompanyAccessOperation } from '../companyAccessOperation';
import type { ManagedComplexDraft } from '../complexAuthoring';
import { MANAGED_COMPLEX_DRAFT_FIELDS } from '../managedComplexDraftFields';

const mocks = vi.hoisted(() => ({ sharedRpc: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/untypedTables', () => ({ untypedRpc: mocks.sharedRpc }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
const rpc = vi.fn();
const current = vi.fn();
const operation = { actorId: 'employee-a', companyId: 'company-a', client: { rpc }, assertCurrent: current } as unknown as BoundCompanyAccessOperation;
const saved = { id: 'complex-a', name: 'Synthetic Residence', management_company_id: 'company-a', authoring_space_id: 'space-a', approval_status: 'draft', is_active: false, created_at: '2026-10-19T00:00:00Z', updated_at: '2026-10-19T01:23:45.123456Z' };
const spaces = [{ id: 'space-a', name_en: 'Assigned', name_ru: 'Назначенная' }];
beforeEach(() => {
  vi.clearAllMocks();
  current.mockImplementation(() => {});
  rpc.mockImplementation(async (name: string) => ({ data: name === 'list_managed_property_authoring_spaces_checked' ? spaces : saved, error: null }));
});

describe('canonical managed complex authoring', () => {
  it('atomically creates content and draft with no fabricated owner or manager relation', async () => {
    expect(await saveManagedComplexDraft(operation, { operatingSpaceId: 'space-a', patch: { name: saved.name, owner_id: 'employee-a', is_active: true, management_company_id: 'other', images: ['https://example.test/image.webp'] } })).toEqual(saved);
    expect(rpc.mock.calls).toEqual([
      ['list_managed_property_authoring_spaces_checked', { p_company_id: 'company-a' }],
      ['create_managed_complex_checked', { p_company_id: 'company-a', p_operating_space_id: 'space-a', p_patch: { name: saved.name, images: ['https://example.test/image.webp'] }, p_submit: false }],
    ]);
    expect(mocks.sharedRpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('submits atomically at creation and verifies pending inactive readback', async () => {
    rpc.mockImplementation(async (name: string) => ({ data: name === 'list_managed_property_authoring_spaces_checked' ? spaces : { ...saved, approval_status: 'pending' }, error: null }));
    expect(await saveManagedComplexDraft(operation, { patch: { name: saved.name }, submit: true })).toMatchObject({ approval_status: 'pending', is_active: false });
    expect(rpc.mock.calls[1][1].p_submit).toBe(true);
  });
  it('compares the exact server revision without losing microseconds', async () => {
    await saveManagedComplexDraft(operation, { complexId: saved.id, expectedUpdatedAt: saved.updated_at, patch: { name: 'New name' } });
    expect(rpc).toHaveBeenCalledWith('save_managed_complex_draft_checked', { p_complex_id: saved.id, p_expected_updated_at: saved.updated_at, p_patch: { name: 'New name' }, p_submit: false });
  });
  it('rejects saves without a known revision before dispatch', async () => {
    await expect(saveManagedComplexDraft(operation, { complexId: saved.id, patch: { name: 'New' } })).rejects.toThrow('Reload');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('never falls back to direct insertion when checked creation is unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'RPC missing' } });
    await expect(saveManagedComplexDraft(operation, { patch: { name: 'New' } })).rejects.toThrow('RPC missing');
    expect(rpc).toHaveBeenCalledTimes(1); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('revalidates Space assignment at dispatch and fails closed on removed assignment', async () => {
    await expect(saveManagedComplexDraft(operation, { operatingSpaceId: 'other', patch: { name: 'New' } })).rejects.toThrow('no longer authorized');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('never treats zero assigned Spaces as all', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(saveManagedComplexDraft(operation, { patch: { name: 'New' } })).rejects.toThrow('No Operating Space');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('requires explicit selection when multiple Spaces are assigned', async () => {
    rpc.mockResolvedValueOnce({ data: [...spaces, { ...spaces[0], id: 'space-b' }], error: null });
    await expect(saveManagedComplexDraft(operation, { patch: { name: 'New' } })).rejects.toThrow('Select an Operating Space');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('uses the bound account and stops between scope lookup and create after switching', async () => {
    current.mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error('Account changed'); });
    await expect(saveManagedComplexDraft(operation, { patch: { name: 'New' } })).rejects.toThrow('Account changed');
    expect(rpc).toHaveBeenCalledTimes(1); expect(mocks.sharedRpc).not.toHaveBeenCalled();
  });
  it('does not accept a response after its account scope expired', async () => {
    current.mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error('Stale'); });
    await expect(readManagedComplexDraft(operation, saved.id)).rejects.toThrow('Stale');
  });
  it('returns only the safe projection even if the server includes extra fields', async () => {
    rpc.mockResolvedValue({ data: { ...saved, owner_id: 'owner', content_author_user_id: 'author', juristic_email: 'private@example.test', cam_fee_per_sqm: 99, reviewed_by: 'admin', description: 'Internal notes' }, error: null });
    expect(await readManagedComplexDraft(operation, saved.id)).toEqual(saved);
  });
  it('lists a bounded own-authored projection with no base-table fallback', async () => {
    rpc.mockResolvedValue({ data: [saved], error: null });
    expect(await listManagedComplexDrafts(operation, 50)).toEqual([saved]);
    expect(rpc).toHaveBeenCalledWith('list_managed_complex_drafts_checked', { p_company_id: 'company-a', p_limit: 50, p_offset: 50 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('preserves a verified empty list', async () => { rpc.mockResolvedValue({ data: [], error: null }); expect(await listManagedComplexDrafts(operation)).toEqual([]); });
  it.each([{ management_company_id: 'other' }, { id: 'other' }, { updated_at: '' }, { approval_status: 'unknown' }, { is_active: true }, { authoring_space_id: undefined }])('rejects inconsistent or unscoped readback %j', async patch => {
    rpc.mockResolvedValue({ data: { ...saved, ...patch }, error: null });
    await expect(readManagedComplexDraft(operation, saved.id)).rejects.toThrow('does not match');
  });
  it('rejects unconfirmed expected submit transition', async () => {
    await expect(saveManagedComplexDraft(operation, { complexId: saved.id, expectedUpdatedAt: saved.updated_at, patch: {}, submit: true })).rejects.toThrow('expected complex state');
  });
  it('preserves a server conflict and never retries with a new version automatically', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Complex changed. Reload.' } });
    await expect(saveManagedComplexDraft(operation, { complexId: saved.id, expectedUpdatedAt: saved.updated_at, patch: {} })).rejects.toThrow('Complex changed');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed Space response', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'x', name: 'Wrong field' }], error: null });
    await expect(readComplexCreationScope(operation)).rejects.toThrow('could not be verified');
  });
  it('never includes scope, identity, moderation, pricing or legal contacts in content', () => {
    expect(complexAuthoringPatch({ name: 'Complex', description_en: 'Public content', total_units: 0, lat: 0, lng: 0, owner_id: 'actor', content_author_user_id: 'actor', management_company_id: 'company', authoring_space_id: 'space', approval_status: 'approved', is_active: true, juristic_phone: 'private', cam_fee_per_sqm: 99, description: 'MC notes' })).toEqual({ name: 'Complex', description_en: 'Public content', total_units: 0, lat: 0, lng: 0 });
    expect(MANAGED_COMPLEX_DRAFT_FIELDS).toHaveLength(20);
  });
  it('saves only actual changes and preserves cleared optional values and media references', () => {
    expect(complexAuthoringDelta({ name: 'New', images: [] }, { name: 'Old', total_floors: 7, images: ['someone-else/photo.webp'] })).toEqual({ name: 'New', total_floors: null, images: [] });
  });
});


describe('protected complex publication review gateway', () => {
  const pending = { ...saved, approval_status: 'pending' } as ManagedComplexDraft;
  it('loads only bounded pending submissions while retaining each company binding', async () => {
    rpc.mockResolvedValue({ data: [pending, { ...pending, id: 'complex-b', management_company_id: 'company-b' }], error: null });
    expect(await listManagedComplexSubmissions(operation, 50)).toHaveLength(2);
    expect(rpc).toHaveBeenCalledWith('list_managed_complex_submissions_checked', { p_company_id: null, p_limit: 50, p_offset: 50 });
  });
  it('rejects a draft accidentally returned as a pending review submission', async () => {
    rpc.mockResolvedValue({ data: [saved], error: null });
    await expect(listManagedComplexSubmissions(operation)).rejects.toThrow('Only pending');
  });
  it('reads the exact target and refuses changed company context', async () => {
    rpc.mockResolvedValue({ data: { ...pending, management_company_id: 'other' }, error: null });
    await expect(readManagedComplexSubmission(operation, pending)).rejects.toThrow('does not match');
  });
  it('does not preview an already published row as awaiting review', async () => {
    rpc.mockResolvedValue({ data: { ...pending, approval_status: 'approved', is_active: true }, error: null });
    await expect(readManagedComplexSubmission(operation, pending)).rejects.toThrow('Submission changed');
  });
  it('publishes through the checked review RPC with its exact persisted revision', async () => {
    rpc.mockResolvedValue({ data: { ...pending, approval_status: 'approved', is_active: true }, error: null });
    expect(await reviewManagedComplexSubmission(operation, pending, 'approve')).toMatchObject({ approval_status: 'approved', is_active: true });
    expect(rpc).toHaveBeenCalledWith('review_managed_complex_submission_checked', { p_complex_id: pending.id, p_expected_updated_at: pending.updated_at, p_decision: 'approve', p_reason: null });
  });
  it('requires a nonblank rejection reason before dispatch', async () => {
    await expect(reviewManagedComplexSubmission(operation, pending, 'reject', '  ')).rejects.toThrow('reason is required');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('returns a complex for correction with trimmed feedback and verifies inactive rejection', async () => {
    rpc.mockResolvedValue({ data: { ...pending, approval_status: 'rejected', rejection_reason: 'Correct district' }, error: null });
    expect(await reviewManagedComplexSubmission(operation, pending, 'reject', ' Correct district ')).toMatchObject({ approval_status: 'rejected', is_active: false });
    expect(rpc.mock.calls[0][1].p_reason).toBe('Correct district');
  });
  it('does not report success on an unchanged or conflicting review result', async () => {
    rpc.mockResolvedValue({ data: pending, error: null });
    await expect(reviewManagedComplexSubmission(operation, pending, 'approve')).rejects.toThrow('review was not confirmed');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('propagates revoked admin access with no raw update fallback', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'platform admin required' } });
    await expect(reviewManagedComplexSubmission(operation, pending, 'approve')).rejects.toThrow('platform admin required');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
