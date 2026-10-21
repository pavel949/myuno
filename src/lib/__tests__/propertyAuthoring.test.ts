import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createManagedPropertyDraft, readManagedPropertyDraft, listManagedPropertyDrafts, propertyAuthoringDelta, editablePropertyAuthoringPatch, propertyAuthoringPatch, propertyCreationSpace, PropertyDraftSaveError, saveManagedPropertyDraft } from '../propertyAuthoring';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), scope: vi.fn(), from: vi.fn(), single: vi.fn(), eq: vi.fn() }));
vi.mock('@/lib/untypedTables', () => ({ untypedRpc: mocks.rpc }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
const company = '11111111-1111-4111-8111-111111111111';
const space1 = '22222222-2222-4222-8222-222222222222';
const space2 = '33333333-3333-4333-8333-333333333333';
const property = '44444444-4444-4444-8444-444444444444';
const scope = { companyId: company, spaces: [{ id: space1, name_en: 'Assigned', name_ru: 'Назначено' }] };
const saved = { id: property, management_company_id: company, approval_status: 'draft', is_active: false, updated_at: '2026-10-19T01:00:00Z' };
beforeEach(() => {
  vi.clearAllMocks(); mocks.scope.mockResolvedValue(scope);
  const chain = { select: vi.fn().mockReturnThis(), eq: mocks.eq, single: mocks.single };
  mocks.eq.mockReturnValue(chain); mocks.from.mockReturnValue(chain);
  mocks.single.mockResolvedValue({ data: saved, error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === 'list_managed_property_authoring_spaces_checked' ? scope.spaces : name === 'create_managed_property_checked' ? property : saved, error: null }));
});
describe('managed property authoring gateway', () => {
  it('creates via actor-bound RPC, then saves an inactive draft without employee ownership', async () => {
    expect(await createManagedPropertyDraft({ companyId: company, patch: { title_en: 'Villa', title_ru: 'Вилла', images: ['https://assets.example/photo.webp'], price_per_night: 100 } })).toEqual(saved);
    expect(mocks.rpc.mock.calls[1]).toEqual(['create_managed_property_checked', { p_company_id: company, p_operating_space_id: space1, p_title_en: 'Villa', p_title_ru: 'Вилла', p_property_type: 'apartment', p_listing_type: 'rent' }]);
    expect(mocks.rpc.mock.calls[3][1]).toMatchObject({ p_property_id: property, p_expected_updated_at: saved.updated_at, p_submit: false, p_patch: { images: ['https://assets.example/photo.webp'], price_per_night: 100 } });
    expect(mocks.rpc.mock.calls[3][1].p_patch).not.toHaveProperty('owner_id');
    expect(mocks.rpc.mock.calls[2]).toEqual(['read_managed_property_draft_checked', { p_property_id: property }]);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('requires a choice with multiple authorized Spaces before making any write', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [...scope.spaces, { id: space2, name_en: 'Other', name_ru: 'Другая' }], error: null });
    await expect(createManagedPropertyDraft({ companyId: company, patch: {} })).rejects.toThrow('Select an Operating Space');
    expect(mocks.rpc.mock.calls.every(([name]) => name === 'list_managed_property_authoring_spaces_checked')).toBe(true);
  });
  it('revalidates selected Space at save time and does not fall back if assignment changed', async () => {
    await expect(createManagedPropertyDraft({ companyId: company, operatingSpaceId: space2, patch: {} })).rejects.toThrow('no longer authorized');
    expect(mocks.rpc.mock.calls.every(([name]) => name === 'list_managed_property_authoring_spaces_checked')).toBe(true);
  });
  it('fails closed when the space reader is missing or access is denied', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Access denied' } });
    await expect(createManagedPropertyDraft({ companyId: company, patch: {} })).rejects.toThrow('Access denied');
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('requires an explicit assigned Space even for legacy companies', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(createManagedPropertyDraft({ companyId: company, patch: {} })).rejects.toThrow('No Operating Space');
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('retains a known inactive shell ID on second-stage failure, without direct-write fallback', async () => {
    mocks.rpc.mockImplementation(async (name: string) => name === 'list_managed_property_authoring_spaces_checked' ? { data: scope.spaces, error: null } : name === 'create_managed_property_checked' ? { data: property, error: null } : name === 'read_managed_property_draft_checked' ? { data: saved, error: null } : { data: null, error: { message: 'Checked draft RPC unavailable' } });
    const error = await createManagedPropertyDraft({ companyId: company, patch: {} }).catch(error => error);
    expect(error).toBeInstanceOf(PropertyDraftSaveError); expect(error.propertyId).toBe(property);
    expect(mocks.rpc).toHaveBeenCalledTimes(4);
  });
  it('submits through the RPC with the expected version and propagates conflicts', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Property changed. Reload.' } });
    await expect(saveManagedPropertyDraft({ companyId: company, propertyId: property, expectedUpdatedAt: 'stale-version', patch: { title_en: 'Edit' }, submit: true })).rejects.toThrow('Property changed');
    expect(mocks.rpc).toHaveBeenCalledWith('save_managed_property_draft_checked', { p_property_id: property, p_expected_updated_at: 'stale-version', p_patch: { title_en: 'Edit' }, p_submit: true });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('allows only canonical catalogue fields and never status, owner, company or secrets', () => {
    expect(propertyAuthoringPatch({ title_en: 'Villa', images: ['cover'], price_per_night: 100, owner_id: 'actor', approval_status: 'approved', is_active: true, management_company_id: company, wifi_password: 'secret', management_type: 'full', _authoring: true })).toEqual({ title_en: 'Villa', images: ['cover'], price_per_night: 100 });
  });
  it('never interprets an empty ready Space list as all Spaces', () => {
    expect(() => propertyCreationSpace({ ...scope, spaces: [] })).toThrow('No Operating Space');
  });
});


describe('safe content-only reads and deltas', () => {
  it('reads only the checked projection and discards private columns in a malformed response', async () => {
    mocks.rpc.mockResolvedValue({ data: { ...saved, lock_code: 'secret', owner_id: 'owner', provider_id: 'provider' }, error: null });
    expect(await readManagedPropertyDraft(property, company)).toEqual(saved);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('never falls back to the base table when checked read is unavailable', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Function unavailable' } });
    await expect(readManagedPropertyDraft(property, company)).rejects.toThrow('Function unavailable');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('lists bounded actor-checked drafts with no operational assignment', async () => {
    mocks.rpc.mockResolvedValue({ data: [saved], error: null });
    expect(await listManagedPropertyDrafts(company, 50)).toEqual([saved]);
    expect(mocks.rpc).toHaveBeenCalledWith('list_managed_property_drafts_checked', { p_company_id: company, p_limit: 50, p_offset: 50 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('keeps an empty safe list empty', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await listManagedPropertyDrafts(company)).toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('rejects a different-company row', async () => {
    mocks.rpc.mockResolvedValue({ data: { ...saved, management_company_id: 'other' }, error: null });
    await expect(readManagedPropertyDraft(property, company)).rejects.toThrow('does not match');
  });
  it('omits unchanged price and booking defaults from a title-only delta', () => {
    expect(propertyAuthoringDelta({ title: 'New', price_per_night: 100, instant_booking: false }, { title: 'Old', price_per_night: 100, instant_booking: false })).toEqual({ title: 'New' });
  });
  it('clears removed optional fields and gallery references without deleting stored assets', async () => {
    const patch = propertyAuthoringDelta({ title: 'Villa', images: [] }, { title: 'Villa', floor: 3, images: ['someone-else/photo.webp'] });
    expect(patch).toEqual({ floor: null, images: [] });
    await saveManagedPropertyDraft({ propertyId: property, companyId: company, expectedUpdatedAt: saved.updated_at, patch });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([{ pricing: false, bookings: false }, { pricing: true, bookings: false }, { pricing: false, bookings: true }])('keeps pricing and booking authority separate: %j', capabilities => {
    const result = editablePropertyAuthoringPatch({ title: 'Villa', price_per_night: 100, instant_booking: true, seasonal_pricing: [] }, capabilities);
    expect(result).toEqual({ title: 'Villa', ...(capabilities.pricing ? { price_per_night: 100 } : {}), ...(capabilities.bookings ? { instant_booking: true } : {}) });
  });
});
