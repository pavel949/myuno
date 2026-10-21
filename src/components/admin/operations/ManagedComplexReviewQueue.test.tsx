import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManagedComplexReviewQueue } from './ManagedComplexReviewQueue';
const mocks = vi.hoisted(() => ({ list: vi.fn(), read: vi.fn(), review: vi.fn(), legacy: vi.fn(), actor: 'admin-a', isAdmin: true, language: 'en' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: mocks.isAdmin, isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) } } }));
vi.mock('@/lib/companyAccessOperation', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/companyAccessOperation')>(), bindCompanyAccessOperation: vi.fn(async lease => { lease.assertCurrent(); return { ...lease, client: {} }; }) }));
vi.mock('@/lib/complexAuthoring', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/complexAuthoring')>(), listManagedComplexSubmissions: mocks.list, readManagedComplexSubmission: mocks.read, reviewManagedComplexSubmission: mocks.review }));
vi.mock('@/hooks/usePropertyComplexes', () => ({ useCreateComplex: () => ({ mutateAsync: mocks.legacy }), useUpdateComplex: () => ({ mutateAsync: mocks.legacy }) }));
vi.mock('@/components/shared/GooglePlacesAutocomplete', () => ({ GooglePlacesAutocomplete: () => <div>Address control</div> }));
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: () => <div>Media control</div> }));
const pending = { id: 'complex-a', name: 'Pending Residence', management_company_id: 'company-b', authoring_space_id: 'space-b', approval_status: 'pending', is_active: false, created_at: '2026-10-19T00:00:00Z', updated_at: '2026-10-19T01:23:45.123456Z' };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(<QueryClientProvider client={client}><ManagedComplexReviewQueue /></QueryClientProvider>);
  return { ...result, refresh: () => result.rerender(<QueryClientProvider client={client}><ManagedComplexReviewQueue /></QueryClientProvider>) };
}
async function openReview() { fireEvent.click(await screen.findByRole('button', { name: 'Review details' })); await screen.findByRole('dialog', { name: 'Review complex' }); }
beforeEach(() => { vi.clearAllMocks(); mocks.actor = 'admin-a'; mocks.isAdmin = true; mocks.language = 'en'; mocks.list.mockResolvedValue([pending]); mocks.read.mockResolvedValue(pending); mocks.review.mockResolvedValue({ ...pending, approval_status: 'approved', is_active: true }); });
afterEach(cleanup);
describe('managed complex admin review', () => {
  it('does not read the queue when protected administrator access is unverified', () => {
    mocks.isAdmin = false; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('administrator access could not be verified');
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it('distinguishes a missing checked queue from no submissions', async () => {
    mocks.list.mockRejectedValue(new Error('RPC missing')); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('queue is unavailable');
    expect(screen.queryByText('No pending complexes on this page.')).not.toBeInTheDocument();
  });
  it('reloads the exact submission, displays read-only content, and publishes via checked review', async () => {
    mount(); await openReview();
    expect(mocks.read.mock.calls[0][1]).toEqual(pending);
    expect(screen.getByLabelText('Name (EN)')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save draft' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Approve and publish' }));
    expect(await screen.findByText('Complex published.')).toBeInTheDocument();
    expect(mocks.review.mock.calls[0][0]).toMatchObject({ actorId: 'admin-a' });
    expect(mocks.review.mock.calls[0].slice(1)).toEqual([pending, 'approve', '']);
    expect(mocks.legacy).not.toHaveBeenCalled();
  });
  it('requires a reason before returning the submission for correction', async () => {
    mocks.review.mockResolvedValue({ ...pending, approval_status: 'rejected' }); mount(); await openReview();
    expect(screen.getByRole('button', { name: 'Return for changes' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Reason for changes' }), { target: { value: 'Correct district' } });
    fireEvent.click(screen.getByRole('button', { name: 'Return for changes' }));
    expect(await screen.findByText('Complex returned for changes.')).toBeInTheDocument();
    expect(mocks.review.mock.calls[0].slice(1)).toEqual([pending, 'reject', 'Correct district']);
  });
  it('keeps conflicts visible and disables decisions until reloading', async () => {
    mocks.review.mockRejectedValue(new Error('version conflict')); mount(); await openReview();
    fireEvent.click(screen.getByRole('button', { name: 'Approve and publish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Review was not confirmed');
    expect(screen.getByRole('button', { name: 'Approve and publish' })).toBeDisabled();
    expect(screen.queryByText('Complex published.')).not.toBeInTheDocument();
  });
  it('prevents double approval while the first result is pending', async () => {
    let finish!: (value: unknown) => void; mocks.review.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    mount(); await openReview(); const approve = screen.getByRole('button', { name: 'Approve and publish' });
    fireEvent.click(approve); fireEvent.click(approve);
    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(1));
    await act(async () => finish({ ...pending, approval_status: 'approved', is_active: true }));
  });
  it('removes the review form when administrator access is revoked', async () => {
    const view = mount(); await openReview(); mocks.isAdmin = false; view.refresh();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(mocks.review).not.toHaveBeenCalled();
  });
  it('discards a delayed read after account switch', async () => {
    let finish!: (value: unknown) => void; mocks.read.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = mount(); fireEvent.click(await screen.findByRole('button', { name: 'Review details' }));
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(1)); mocks.actor = 'admin-b'; view.refresh();
    await act(async () => finish(pending)); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('localizes the Thai review and decision affordances', async () => {
    mocks.language = 'th'; mount(); fireEvent.click(await screen.findByRole('button', { name: 'ตรวจสอบรายละเอียด' }));
    expect(await screen.findByRole('button', { name: 'อนุมัติและเผยแพร่' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'เหตุผลที่ต้องแก้ไข' })).toBeInTheDocument();
  });
});
