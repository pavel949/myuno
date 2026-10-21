import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ComplexesPage from '../ComplexesPage';
const mocks = vi.hoisted(() => ({ scope: vi.fn(), actor: 'employee-a', company: 'company-a', role: 'staff', admin: false, language: 'en', permission: true, error: null as Error | null, rows: [] as unknown[], refetch: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: mocks.company, role: mocks.role } }) }));
vi.mock('@/hooks/useTeamPermissions', () => ({ useTeamPermissions: () => ({ canAccess: () => mocks.permission }) }));
vi.mock('@/hooks/useUserRoles', () => ({ useUserRoles: () => ({ hasRole: () => mocks.admin }) }));
vi.mock('@/hooks/usePropertyComplexes', () => ({ usePropertyComplexes: (scope: unknown) => { mocks.scope(scope); return { data: mocks.rows, isLoading: false, error: mocks.error, refetch: mocks.refetch }; } }));
vi.mock('@/components/owner/ManagedComplexDrafts', () => ({ ManagedComplexDrafts: () => <div>Checked creation workflow</div> }));
vi.mock('@/components/owner/ComplexCard', () => ({ ComplexCard: ({ complex, onClick }) => <button onClick={onClick}>{complex.name}</button> }));
vi.mock('@/components/owner/ComplexFormDialog', () => ({ ComplexFormDialog: ({ complex }) => <div role="dialog">{complex.name}</div> }));
beforeEach(() => { vi.clearAllMocks(); mocks.actor = 'employee-a'; mocks.company = 'company-a'; mocks.role = 'staff'; mocks.admin = false; mocks.language = 'en'; mocks.permission = true; mocks.error = null; mocks.rows = []; });
afterEach(cleanup);
describe('complex page independent and employee routes', () => {
  it('does not query broad company private rows for a content-only staff user', () => {
    render(<ComplexesPage />);
    expect(mocks.scope).toHaveBeenCalledWith({ companyId: 'company-a', includeCompany: false, platformAdmin: false });
    expect(screen.getByText('Checked creation workflow')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Complex/ })).not.toBeInTheDocument();
  });
  it('retains existing company-manager and protected-admin query affordances', () => {
    mocks.role = 'manager'; mocks.admin = true; render(<ComplexesPage />);
    expect(mocks.scope).toHaveBeenCalledWith({ companyId: 'company-a', includeCompany: true, platformAdmin: true });
  });
  it('never opens governed rows in the legacy ownership editor', () => {
    mocks.rows = [{ id: 'owned', name: 'Independent owned complex' }, { id: 'managed', name: 'Governed draft', approval_status: 'draft' }];
    render(<ComplexesPage />);
    expect(screen.queryByText('Governed draft')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Independent owned complex' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Independent owned complex');
  });
  it('discards an independent editor when the account or company changes', () => {
    mocks.rows = [{ id: 'owned', name: 'Independent owned complex' }];
    const view = render(<ComplexesPage />); fireEvent.click(screen.getByRole('button', { name: 'Independent owned complex' }));
    mocks.actor = 'employee-b'; view.rerender(<ComplexesPage />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('does not turn a failed legacy query into an empty successful list', () => {
    mocks.error = new Error('Denied'); render(<ComplexesPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
    expect(screen.queryByText('No existing complexes available to manage.')).not.toBeInTheDocument();
  });
  it('localizes page headings and search in Thai', () => {
    mocks.language = 'th'; render(<ComplexesPage />);
    expect(screen.getByRole('heading', { name: 'โครงการที่พักอาศัย' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'ค้นหาโครงการ' })).toBeInTheDocument();
  });
});
