import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePropertyWizard } from '../usePropertyWizard';
const mocks = vi.hoisted(() => ({ saveDraft: vi.fn(), submit: vi.fn(), invite: vi.fn(), actor: 'employee-a', draftInputs: vi.fn(), companyError: null as Error | null, companyId: 'company-a' as string | null, clearDraft: vi.fn(), from: vi.fn(), documents: new Map<string, Record<string, unknown>>(), failType: '', loseType: '' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: mocks.companyId ? { company_id: mocks.companyId } : null, isLoading: false, error: mocks.companyError, refetch: vi.fn() }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ activeOrgId: null }) }));
vi.mock('@/hooks/useTeamPermissions', () => ({ useTeamPermissions: () => ({ canAccess: () => true, isLoading: false }) }));
vi.mock('@/hooks/usePropertyOwnership', () => ({ useSendOwnershipInvite: () => ({ mutateAsync: mocks.invite }) }));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperty: () => ({ data: null, isLoading: false }), useUpdateOwnerProperty: () => ({ mutateAsync: mocks.submit, isPending: false }) }));
vi.mock('@/lib/propertyAuthoring', () => ({ readPropertyCreationScope: async () => ({ companyId: 'company-a', spaces: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, auth: { getUser: async () => ({ data: { user: { id: mocks.actor } } }) } } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/property-wizard/usePropertyWizardDraft', () => ({ usePropertyWizardDraft: (args: unknown) => { mocks.draftInputs(args); return { persistDraft: mocks.saveDraft, clearDraft: mocks.clearDraft, resetDraftSnapshot: vi.fn(), markUnsaved: vi.fn(), isSavingDraft: false, isLoadingDraft: false }; } }));
const saved = { id: 'draft-a', updated_at: 'version-a' };
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
beforeEach(() => { vi.clearAllMocks(); mocks.actor = 'employee-a'; mocks.companyError = null; mocks.companyId = 'company-a'; mocks.documents.clear(); mocks.failType = ''; mocks.loseType = ''; mocks.saveDraft.mockResolvedValue(saved); mocks.submit.mockResolvedValue({ ...saved, approval_status: 'pending' }); });
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

describe('owner documents gate submission', () => {
  function installDocuments() {
    mocks.companyId = null;
    mocks.from.mockImplementation((table: string) => {
      if(table !== 'property_documents') throw Error('Unexpected table');
      let payload: Record<string, unknown> | null = null;
      let selectedId = '';
      const query = {
        insert: (value: Record<string, unknown>) => { payload = value; return query; },
        select: () => query,
        eq: (_key: string, value: string) => { selectedId = value; return query; },
        single: async () => {
          if(!payload) return {data:mocks.documents.get(selectedId) ?? null,error:null};
          if(payload.document_type === mocks.failType) return {data:null,error:{message:'Document refused'}};
          const key=String(payload.id);
          if(mocks.documents.has(key)) return {data:null,error:{code:'23505',message:'Duplicate'}};
          mocks.documents.set(key,payload);if(payload.document_type === mocks.loseType){mocks.loseType='';return {data:null,error:{message:'Response lost'}};}return {data:payload,error:null};
        },
        then: (resolve: (value: unknown) => void) => resolve({data:null,error:{message:'Document refused'}}),
      };
      return query;
    });
  }
  async function start() {
    installDocuments();
    const hook=renderHook(usePropertyWizard,{wrapper});
    act(()=>{hook.result.current.updateOwnershipData({management_document_url:'https://synthetic.test/management',ownership_document_url:'https://synthetic.test/title'});});
    return hook;
  }
  it('does not submit for review or clear the known draft when a required document is refused',async()=>{
    const {result}=await start();mocks.failType='power_of_attorney';
    await act(async()=>{await result.current.handleSubmit();});
    expect(mocks.submit).not.toHaveBeenCalled();expect(mocks.clearDraft).not.toHaveBeenCalled();expect(result.current.showSuccess).toBe(false);
  });
  it('retries partial document persistence against the same draft without duplicating accepted documents',async()=>{
    const {result}=await start();mocks.failType='ownership_title';
    await act(async()=>{await result.current.handleSubmit();});
    expect(mocks.submit).not.toHaveBeenCalled();expect(mocks.documents.size).toBe(1);
    mocks.failType='';await act(async()=>{await result.current.handleSubmit();});
    expect(mocks.documents.size).toBe(2);expect(mocks.submit).toHaveBeenCalledTimes(1);expect(mocks.submit.mock.calls[0][0].id).toBe(saved.id);expect(result.current.showSuccess).toBe(true);
  });
  it('recovers a lost document insert response using the same persisted identity',async()=>{
    const {result}=await start();mocks.loseType='power_of_attorney';
    await act(async()=>{await result.current.handleSubmit();});
    expect(mocks.submit).not.toHaveBeenCalled();expect(mocks.documents.size).toBe(1);expect(mocks.clearDraft).not.toHaveBeenCalled();
    const persistedId=[...mocks.documents.keys()][0];
    await act(async()=>{await result.current.handleSubmit();});
    expect(mocks.documents.size).toBe(2);expect(mocks.documents.has(persistedId)).toBe(true);expect(mocks.submit).toHaveBeenCalledTimes(1);expect(result.current.showSuccess).toBe(true);
  });
  it('does not accept an existing document identity with mismatching persisted ownership',async()=>{
    const {result}=await start();mocks.failType='ownership_title';
    await act(async()=>{await result.current.handleSubmit();});
    const [id,row]=[...mocks.documents][0];mocks.documents.set(id,{...row,uploaded_by:'another-actor'});
    mocks.failType='';await act(async()=>{await result.current.handleSubmit();});
    expect(mocks.submit).not.toHaveBeenCalled();expect(result.current.showSuccess).toBe(false);
  });
});
