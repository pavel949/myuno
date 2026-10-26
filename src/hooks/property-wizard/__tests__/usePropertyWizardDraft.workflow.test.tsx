import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePropertyWizardDraft } from '../usePropertyWizardDraft';
import { initialFormData, initialOwnershipData } from '../initialData';
import { PropertyDraftSaveError } from '@/lib/propertyAuthoring';
import { AuthoringCreationResumeRequired } from '@/lib/authoringCreateIntent';
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), from: vi.fn(), created: vi.fn(), setForm: vi.fn() }));
vi.mock('@/hooks/usePropertyCare', () => ({ useCreateOwnerProperty: () => ({ mutateAsync: mocks.create }), useUpdateOwnerProperty: () => ({ mutateAsync: mocks.update }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
const lifetime = { begin: () => ({ finish: vi.fn() }) };
vi.mock('@/hooks/useCompanyAccessLifetime', () => ({ useCompanyAccessLifetime: () => lifetime }));
vi.mock('@/lib/companyAccessOperation', () => ({ bindCompanyAccessOperation: vi.fn(async () => ({})) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const args = { userId: 'employee-a', cloneFromId: null, formData: { ...initialFormData, title: 'Draft villa' }, setFormData: mocks.setForm, ownershipData: initialOwnershipData, activeOrgId: null, isRu: false, companyId: 'company-a', operatingSpaceId: 'space-a', resumeDraftId: null, onDraftCreated: mocks.created };
const saved = { id: 'draft-a', updated_at: '2026-10-19T00:00:00Z' };
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue(saved); mocks.update.mockResolvedValue(saved); });
describe('managed draft continuity', () => {
  it('does not restore another employee’s latest company draft', async () => {
    const { result } = renderHook(() => usePropertyWizardDraft(args));
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('coalesces blur/autosave/submit creation and preserves the explicit resume ID', async () => {
    let resolve: (value: typeof saved) => void = () => {};
    mocks.create.mockImplementation(() => new Promise(result => { resolve = result; }));
    const { result } = renderHook(() => usePropertyWizardDraft(args));
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    let first: Promise<unknown>; let second: Promise<unknown>;
    act(() => { first = result.current.persistDraft(); second = result.current.persistDraft(); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(saved); await Promise.all([first, second]); });
    expect(result.current.draftPropertyId).toBe('draft-a');
    expect(mocks.created).toHaveBeenCalledWith('draft-a');
  });
  it('retries a partial shell by updating its ID, never creating a duplicate', async () => {
    mocks.create.mockRejectedValueOnce(new PropertyDraftSaveError('draft-a', new Error('Second stage failed'), saved.updated_at));
    const { result } = renderHook(() => usePropertyWizardDraft(args));
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    await act(async () => { await result.current.persistDraft(); });
    expect(result.current.saveState).toBe('error');
    await act(async () => { await result.current.persistDraft(); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ id: 'draft-a', _authoring: true, _silent: true });
  });
  it('keeps a partial shell with an unknown version blocked until reload', async () => {
    mocks.create.mockRejectedValueOnce(new PropertyDraftSaveError('draft-a', new Error('Read unavailable')));
    const { result } = renderHook(() => usePropertyWizardDraft(args));
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    await act(async () => { await result.current.persistDraft(); });
    expect(result.current.draftLoadError).toContain('Reload');
    await act(async () => { await result.current.persistDraft(); });
    expect(mocks.create).toHaveBeenCalledTimes(1); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('retains a resolved uncertain creation and requires reopening before changed content is saved', async () => {
    mocks.create.mockRejectedValueOnce(new AuthoringCreationResumeRequired({ id: 'draft-existing', updated_at: 'known-version' }));
    const { result } = renderHook(() => usePropertyWizardDraft(args));
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    await act(async () => { await result.current.persistDraft(); });
    expect(result.current.draftLoadError).toContain('previous creation was saved');
    expect(mocks.created).toHaveBeenCalledWith('draft-existing');
    await act(async () => { await result.current.persistDraft(); });
    expect(mocks.create).toHaveBeenCalledTimes(1); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('omits ungranted pricing and booking defaults during managed creation', async () => {
    const { result } = renderHook(() => usePropertyWizardDraft({ ...args, capabilities: { pricing: false, bookings: false } }));
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    await act(async () => { await result.current.persistDraft(); });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ title: 'Draft villa' });
    for (const key of ['payment_policy', 'deposit_currency', 'instant_booking', 'listing_modes', 'min_stay_nights']) expect(mocks.create.mock.calls[0][0]).not.toHaveProperty(key);
  });
  it('does not adopt the previous account’s late save response after a switch', async () => {
    let resolve: (value: typeof saved) => void = () => {};
    mocks.create.mockImplementation(() => new Promise(result => { resolve = result; }));
    const { result, rerender } = renderHook(({ userId }) => usePropertyWizardDraft({ ...args, userId }), { initialProps: { userId: 'employee-a' } });
    await waitFor(() => expect(result.current.isLoadingDraft).toBe(false));
    let saving: Promise<unknown>; act(() => { saving = result.current.persistDraft(); });
    rerender({ userId: 'employee-b' });
    await act(async () => { resolve(saved); await saving; });
    expect(result.current.draftPropertyId).toBeUndefined();
    expect(mocks.created).not.toHaveBeenCalled();
  });
});
