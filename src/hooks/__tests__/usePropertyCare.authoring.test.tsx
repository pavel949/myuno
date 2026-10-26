import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateOwnerProperty, useUpdateOwnerProperty } from '../usePropertyCare';
const mocks = vi.hoisted(() => ({ create: vi.fn(), save: vi.fn(), read: vi.fn(), independent: vi.fn(), from: vi.fn(), notify: vi.fn(), companyError: null as Error | null }));
vi.mock('@/lib/propertyAuthoring', async original => ({ ...(await original<typeof import('@/lib/propertyAuthoring')>()), createManagedPropertyDraft: mocks.create, saveManagedPropertyDraft: mocks.save, readManagedPropertyDraft: mocks.read, readIndependentPropertyForAuthoring: mocks.independent }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'employee-a' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: 'company-a' }, isLoading: false, error: mocks.companyError }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false, isLoading: false }) }));
vi.mock('@/hooks/useCompanyAccessLifetime', () => ({ useCompanyAccessLifetime: () => ({ begin: () => ({ assertCurrent: vi.fn(), finish: vi.fn() }) }) }));
vi.mock('@/lib/companyAccessOperation', () => ({ bindCompanyAccessOperation: vi.fn(async () => ({ assertCurrent: vi.fn() })) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, functions: { invoke: mocks.notify } } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const safe = { id: 'property-a', management_company_id: 'company-a', updated_at: 'version-2', approval_status: 'draft', is_active: false };
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>; }
beforeEach(() => { vi.clearAllMocks(); mocks.companyError = null; mocks.create.mockResolvedValue(safe); mocks.save.mockResolvedValue(safe); mocks.read.mockResolvedValue(safe); mocks.independent.mockResolvedValue(null); mocks.notify.mockResolvedValue({ error: null }); });
describe('managed authoring mutations', () => {
  it('creates only through checked creation, without adding employee ownership', async () => {
    const { result } = renderHook(useCreateOwnerProperty, { wrapper });
    await act(async () => { await result.current.mutateAsync({ title: 'Villa', _operatingSpaceId: 'space-a', _silent: true }); });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'company-a', operatingSpaceId: 'space-a' }));
    expect(mocks.create.mock.calls[0][0].patch).not.toHaveProperty('owner_id');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not reinterpret a failed company lookup as independent owner creation', async () => {
    mocks.companyError = new Error('Membership read failed');
    const { result } = renderHook(useCreateOwnerProperty, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ title: 'Villa', _silent: true })).rejects.toThrow('could not be verified'); });
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('uses only safe reads and checked save for an employee, stripping authority fields', async () => {
    const { result } = renderHook(useUpdateOwnerProperty, { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 'property-a', title: 'Edit', _authoring: true, _expectedUpdatedAt: 'version-1', _silent: true, owner_id: 'employee-a', is_active: true }); });
    expect(mocks.save).toHaveBeenCalledWith({ propertyId: 'property-a', companyId: 'company-a', expectedUpdatedAt: 'version-1', patch: { title: 'Edit' }, submit: undefined, operation: expect.anything() });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('never falls back to a direct update if the checked workflow is unavailable', async () => {
    mocks.save.mockRejectedValue(new Error('RPC unavailable'));
    const { result } = renderHook(useUpdateOwnerProperty, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ id: 'property-a', title: 'Edit', _authoring: true, _expectedUpdatedAt: 'version-1', _silent: true })).rejects.toThrow('RPC unavailable'); });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('keeps a confirmed pending save successful even when notification fails', async () => {
    mocks.save.mockResolvedValue({ ...safe, approval_status: 'pending' }); mocks.notify.mockResolvedValue({ error: new Error('Email unavailable') });
    const { result } = renderHook(useUpdateOwnerProperty, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ id: 'property-a', _authoring: true, _expectedUpdatedAt: 'version-1', _submitForReview: true, _silent: true })).resolves.toMatchObject({ approval_status: 'pending' }); });
    expect(mocks.notify).toHaveBeenCalledWith('notify-admin-property-submission', { body: { propertyId: 'property-a' } });
  });
  it('preserves independently verified provider updates with exact provider filtering', async () => {
    mocks.independent.mockResolvedValue({ ...safe, provider_id: 'provider-a' });
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: safe, error: null }) };
    mocks.from.mockReturnValue(chain);
    const { result } = renderHook(useUpdateOwnerProperty, { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 'property-a', title: 'Provider edit', _authoring: true, _silent: true }); });
    expect(chain.eq).toHaveBeenCalledWith('provider_id', 'provider-a');
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
