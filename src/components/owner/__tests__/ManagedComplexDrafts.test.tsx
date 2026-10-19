import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManagedComplexDrafts } from '../ManagedComplexDrafts';

const mocks = vi.hoisted(() => ({ list: vi.fn(), read: vi.fn(), scope: vi.fn(), save: vi.fn(), legacyCreate: vi.fn(), legacyUpdate: vi.fn(), actor: 'employee-a', company: 'company-a', language: 'en', authCallback: null as null | ((event: string, session: unknown) => void) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: mocks.company ? { company_id: mocks.company } : null, isLoading: false, error: null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { onAuthStateChange: vi.fn((callback) => { mocks.authCallback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; }) } } }));
vi.mock('@/lib/companyAccessOperation', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/companyAccessOperation')>(), bindCompanyAccessOperation: vi.fn(async lease => { lease.assertCurrent(); return { ...lease, client: {} }; }) }));
vi.mock('@/lib/complexAuthoring', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/complexAuthoring')>(), listManagedComplexDrafts: mocks.list, readManagedComplexDraft: mocks.read, readComplexCreationScope: mocks.scope, saveManagedComplexDraft: mocks.save }));
vi.mock('@/hooks/usePropertyComplexes', () => ({ useCreateComplex: () => ({ mutateAsync: mocks.legacyCreate }), useUpdateComplex: () => ({ mutateAsync: mocks.legacyUpdate }) }));
vi.mock('@/components/shared/GooglePlacesAutocomplete', () => ({ GooglePlacesAutocomplete: () => <div>Address control</div> }));
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: () => <div>Media control</div> }));
const draft = { id: 'complex-a', name: 'Synthetic Residence', management_company_id: 'company-a', authoring_space_id: 'space-a', approval_status: 'draft', is_active: false, created_at: '2026-10-19T00:00:00Z', updated_at: '2026-10-19T01:23:45.123456Z' };
const spaces = [{ id: 'space-a', name_en: 'Assigned Space', name_ru: 'Назначенная область' }];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(<QueryClientProvider client={client}><ManagedComplexDrafts /></QueryClientProvider>);
  return { ...result, client, refresh: () => result.rerender(<QueryClientProvider client={client}><ManagedComplexDrafts /></QueryClientProvider>) };
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.actor = 'employee-a'; mocks.company = 'company-a'; mocks.language = 'en';
  mocks.list.mockResolvedValue([]); mocks.read.mockResolvedValue(draft); mocks.scope.mockResolvedValue({ companyId: 'company-a', spaces }); mocks.save.mockResolvedValue(draft);
});
afterEach(cleanup);
async function openNew() {
  await screen.findByText('No drafts in this workspace.');
  fireEvent.click(screen.getByRole('button', { name: 'New complex' }));
  await waitFor(() => expect(screen.getByLabelText('Operating Space')).toHaveValue('space-a'));
  fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Synthetic New' } });
}

describe('managed complex UI', () => {
  it('offers checked creation in an explicitly assigned Space and never legacy employee ownership', async () => {
    mount(); await openNew();
    expect(screen.getByRole('tab', { name: 'Mgmt' })).toBeDisabled();
    expect(screen.queryByText(/AI Intake/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save.mock.calls[0][0]).toMatchObject({ actorId: 'employee-a', companyId: 'company-a' });
    expect(mocks.save.mock.calls[0][1]).toMatchObject({ operatingSpaceId: 'space-a', patch: { name: 'Synthetic New' }, submit: false });
    expect(mocks.legacyCreate).not.toHaveBeenCalled(); expect(mocks.legacyUpdate).not.toHaveBeenCalled();
  });
  it('distinguishes unavailable from an empty draft list and disables create', async () => {
    mocks.list.mockRejectedValue(new Error('Missing RPC')); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Complex data entry is unavailable');
    expect(screen.queryByText('No drafts in this workspace.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New complex' })).toBeDisabled();
  });
  it('rechecks exact draft before editing and saves only a delta plus opaque CAS', async () => {
    mocks.list.mockResolvedValue([draft]); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await screen.findByLabelText('Name (EN)');
    expect(mocks.read.mock.calls[0][1]).toBe('complex-a');
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Edited' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save.mock.calls[0][1]).toEqual({ complexId: 'complex-a', expectedUpdatedAt: draft.updated_at, operatingSpaceId: 'space-a', patch: { name: 'Edited' }, submit: true });
  });
  it.each(['pending', 'approved'])('keeps %s content read-only', async approval_status => {
    const row = { ...draft, approval_status, is_active: approval_status === 'approved' };
    mocks.list.mockResolvedValue([row]); mocks.read.mockResolvedValue(row); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    expect(await screen.findByLabelText('Name (EN)')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save draft' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit for review' })).not.toBeInTheDocument();
  });
  it('shows returned feedback and allows correction', async () => {
    const row = { ...draft, approval_status: 'rejected', rejection_reason: 'Correct the district' };
    mocks.list.mockResolvedValue([row]); mocks.read.mockResolvedValue(row); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    expect(await screen.findByText(/Correct the district/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled();
  });
  it('requires an explicit choice when more than one Space is assigned', async () => {
    mocks.scope.mockResolvedValue({ companyId: 'company-a', spaces: [...spaces, { ...spaces[0], id: 'space-b', name_en: 'Other Space' }] });
    mount(); await screen.findByText('No drafts in this workspace.');
    fireEvent.click(screen.getByRole('button', { name: 'New complex' }));
    await screen.findByRole('option', { name: 'Other Space' });
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'New' } });
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Operating Space'), { target: { value: 'space-b' } });
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled();
  });
  it('explains an unassigned Space inside the open form without creating an owner shell', async () => {
    mocks.scope.mockResolvedValue({ companyId: 'company-a', spaces: [] });
    mount(); await screen.findByText('No drafts in this workspace.'); fireEvent.click(screen.getByRole('button', { name: 'New complex' }));
    expect(await screen.findByText('No active Space is assigned. Contact your administrator.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled(); expect(mocks.save).not.toHaveBeenCalled();
  });
  it('blocks retry after an unconfirmed save rather than duplicating a new complex', async () => {
    mocks.save.mockRejectedValue(new Error('Transport error'));
    mount(); await openNew(); fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('a new complex may already have been created');
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' })); expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it('prevents duplicate dispatch while saving', async () => {
    let finish!: (value: unknown) => void; mocks.save.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    mount(); await openNew(); const save = screen.getByRole('button', { name: 'Save draft' });
    fireEvent.click(save); fireEvent.click(save);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    await act(async () => finish(draft));
  });
  it('closes and invalidates the previous editor on account or company switch', async () => {
    const mounted = mount(); await openNew();
    mocks.actor = 'employee-b'; mocks.company = 'company-b'; mounted.refresh();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await screen.findByText('No drafts in this workspace.');
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('discards a late read response after the workspace changed', async () => {
    let finish!: (value: unknown) => void; mocks.list.mockResolvedValue([draft]); mocks.read.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const mounted = mount(); fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(1));
    mocks.actor = 'employee-b'; mounted.refresh();
    await act(async () => finish(draft));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('localizes Thai entry, status, form and actions', async () => {
    mocks.language = 'th'; mocks.list.mockResolvedValue([draft]); mount();
    expect(await screen.findByText('ฉบับร่าง')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'เปิด' }));
    expect(await screen.findByLabelText('ชื่อ (EN)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บันทึกฉบับร่าง' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ส่งเพื่อตรวจสอบ' })).toBeInTheDocument();
  });
});
