import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePropertyWizard } from '../usePropertyWizard';
const mocks = vi.hoisted(() => ({ saveDraft: vi.fn(), submit: vi.fn(), invite: vi.fn(), actor: 'employee-a', draftInputs: vi.fn(), companyError: null as Error | null, from: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: 'company-a' }, isLoading: false, error: mocks.companyError, refetch: vi.fn() }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ activeOrgId: null }) }));
vi.mock('@/hooks/useTeamPermissions', () => ({ useTeamPermissions: () => ({ canAccess: () => true, isLoading: false }) }));
vi.mock('@/hooks/usePropertyOwnership', () => ({ useSendOwnershipInvite: () => ({ mutateAsync: mocks.invite }) }));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperty: () => ({ data: null, isLoading: false }), useUpdateOwnerProperty: () => ({ mutateAsync: mocks.submit, isPending: false }) }));
vi.mock('@/lib/propertyAuthoring', () => ({ readPropertyCreationScope: async () => ({ companyId: 'company-a', spaces: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/property-wizard/usePropertyWizardDraft', () => ({ usePropertyWizardDraft: (args: unknown) => { mocks.draftInputs(args); return { persistDraft: mocks.saveDraft, clearDraft: vi.fn(), resetDraftSnapshot: vi.fn(), markUnsaved: vi.fn(), isSavingDraft: false, isLoadingDraft: false }; } }));
const saved = { id: 'draft-a', updated_at: 'version-a' };
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
beforeEach(() => { vi.clearAllMocks(); mocks.actor = 'employee-a'; mocks.companyError = null; mocks.saveDraft.mockResolvedValue(saved); mocks.submit.mockResolvedValue({ ...saved, approval_status: 'pending' }); });
describe('managed wizard submission', () => {
  it('locks double submit across draft-save and pending transition', async () => {
    let finish: (value: typeof saved) => void = () => {};
    mocks.saveDraft.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(usePropertyWizard, { wrapper });
    let first: Promise<void>; let second: Promise<void>;
    act(() => { first = result.current.handleSubmit(); second = result.current.handleSubmit(); });
    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);
    await act(async () => { finish(saved); await Promise.all([first, second]); });
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.submit.mock.calls[0][0]).toEqual({ id: 'draft-a', is_active: false, _authoring: true, _expectedUpdatedAt: 'version-a', _submitForReview: true });
    expect(result.current.createdApprovalStatus).toBe('pending');
  });
  it('does not apply owner identity, CRM documents or ownership invitations in managed entry', async () => {
    const { result } = renderHook(usePropertyWizard, { wrapper });
    act(() => result.current.updateOwnershipData({ ownership_type: 'verbal', actual_owner_email: 'synthetic@example.test', send_invite_immediately: true }));
    await act(async () => { await result.current.handleSubmit(); });
    expect(mocks.invite).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not continue a previous actor’s pending save after account switch', async () => {
    let finish: (value: typeof saved) => void = () => {};
    mocks.saveDraft.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result, rerender } = renderHook(usePropertyWizard, { wrapper });
    let submission: Promise<void>; act(() => { submission = result.current.handleSubmit(); });
    mocks.actor = 'employee-b'; rerender();
    await act(async () => { finish(saved); await submission; });
    expect(mocks.submit).not.toHaveBeenCalled(); expect(result.current.showSuccess).toBe(false);
  });
  it('does not enable draft persistence when company verification failed', async () => {
    mocks.companyError = new Error('Membership unavailable');
    renderHook(usePropertyWizard, { wrapper });
    await waitFor(() => expect(mocks.draftInputs).toHaveBeenCalled());
    expect(mocks.draftInputs.mock.calls.at(-1)?.[0].userId).toBeUndefined();
  });
});
