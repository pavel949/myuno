import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { StaffMember } from '@/hooks/useStaffMembers';

const fixture = vi.hoisted(() => ({
  rows: [] as StaffMember[], loading: false, error: null as Error | null,
  companyLoading: false, companyError: false, canManage: true,
  retry: vi.fn(), retryCompany: vi.fn(), assignment: vi.fn(),
  permissionReads: vi.fn(() => ({ data: [] })), permissionEditor: vi.fn(() => null),
  properties: [] as Array<{ property_id: string; title: string; title_ru: string }>,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-actor' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ symbol: '฿', code: 'THB' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({
  activeCompany: null, isLoading: fixture.companyLoading, isError: fixture.companyError, refetch: fixture.retryCompany,
}) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: fixture.properties }) }));
vi.mock('@/hooks/useStaffMembers', () => ({
  useAllStaffMembers: () => ({ data: fixture.rows, isLoading: fixture.loading, error: fixture.error, refetch: fixture.retry }),
  useCreateStaffMember: () => ({ isPending: false, mutateAsync: () => { throw Error('Forbidden staff write'); } }),
  useUpdateStaffMember: () => ({ isPending: false, mutateAsync: () => { throw Error('Forbidden staff write'); } }),
  useDeactivateStaffMember: () => ({ mutate: () => { throw Error('Forbidden staff write'); } }),
  useStaffPropertyAssignments: () => ({ data: [], isLoading: false }),
  useAssignStaffToProperty: () => ({ mutate: fixture.assignment }),
  useRemoveStaffAssignment: () => ({ mutate: fixture.assignment }),
  STAFF_ROLES: [{ value: 'staff', labelRu: 'Сотрудник', labelEn: 'Staff' }],
  PAY_TYPES: [{ value: 'salary', labelRu: 'Оклад', labelEn: 'Salary' }],
}));
vi.mock('@/hooks/useTeamPermissions', () => ({
  useMemberPermissions: fixture.permissionReads, MODULES: [],
  useCanManagePermissions: () => fixture.canManage,
}));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: () => null }));
vi.mock('@/components/owner/vendors/VendorDocumentsTab', () => ({ VendorDocumentsTab: () => null }));
vi.mock('@/components/owner/team/MemberPermissionsSheet', () => ({ MemberPermissionsSheet: fixture.permissionEditor }));
vi.mock('@/pages/owner/TeamPage', () => ({ default: () => <div>Existing property delegation boundary</div> }));
vi.mock('@/components/owner/team/MemberActivitySheet', () => ({ MemberActivitySheet: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => { throw Error('Database denied'); },
  functions: { invoke: () => { throw Error('Invitations denied'); } },
} }));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => children,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}));
import StaffPage from '../StaffPage';

function mount() { return render(<MemoryRouter><StaffPage /></MemoryRouter>); }
beforeEach(() => {
  fixture.rows = []; fixture.loading = false; fixture.error = null; fixture.companyLoading = false;
  fixture.companyError = false; fixture.canManage = true; fixture.retry.mockReset(); fixture.retryCompany.mockReset();
  fixture.properties = []; fixture.assignment.mockReset(); fixture.permissionReads.mockClear(); fixture.permissionEditor.mockClear();
  vi.stubGlobal('fetch', () => { throw new Error('Production network denied'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('staff setup and empty states without real employees or assignments', () => {
  it('offers optional staff entry for a genuinely empty authorized directory', () => {
    mount();
    expect(screen.getByText('No staff yet')).toBeInTheDocument();
    expect(screen.getByText(/configure the workspace before inviting your team/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add first staff member' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('preserves the existing management permission boundary in the empty state', () => {
    fixture.canManage = false;
    mount();
    expect(screen.getByText('No staff yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add first staff member' })).not.toBeInTheDocument();
  });

  it('shows a failed read with retry instead of asserting an empty directory or zero totals', () => {
    fixture.error = new Error('Synthetic denied');
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load staff');
    expect(screen.queryByText('No staff yet')).not.toBeInTheDocument();
    expect(screen.getAllByText('–')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fixture.retry).toHaveBeenCalledOnce();
  });

  it('keeps unresolved membership state separate from a true empty directory', () => {
    fixture.companyLoading = true;
    const view = mount();
    expect(screen.queryByText('No staff yet')).not.toBeInTheDocument();
    fixture.companyLoading = false; fixture.companyError = true;
    view.rerender(<MemoryRouter><StaffPage /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load company');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fixture.retryCompany).toHaveBeenCalledOnce();
    expect(fixture.retry).not.toHaveBeenCalled();
  });

  it('distinguishes filtered-out staff and clears filters to reveal existing synthetic rows', () => {
    fixture.rows = [{
      id: 'synthetic-staff', owner_id: 'synthetic-owner', name: 'Synthetic inactive person',
      role: 'staff', pay_type: 'salary', is_active: false,
      created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
    }];
    mount();
    expect(screen.getByText('No matching staff')).toBeInTheDocument();
    expect(screen.queryByText('No staff yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add first staff member' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('Synthetic inactive person')).toBeInTheDocument();
    expect(screen.queryByText('No matching staff')).not.toBeInTheDocument();
  });

  it('keeps staff editing without presenting a nonfunctional property assignment selector', () => {
    fixture.rows = [{
      id: 'synthetic-staff', owner_id: 'synthetic-owner', name: 'Synthetic employee',
      role: 'staff', pay_type: 'salary', is_active: true,
      created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
    }];
    fixture.properties = [{ property_id: 'synthetic-property', title: 'Synthetic property', title_ru: '' }];
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit Staff Member')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.queryByText('Property Assignments')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Add property')).not.toBeInTheDocument();
    expect(fixture.assignment).not.toHaveBeenCalled();
  });


  it('opens existing property delegations instead of querying or editing permissions with a directory ID', async () => {
    fixture.rows = [{
      id: 'directory-row-only', owner_id: 'synthetic-owner', name: 'Directory-only employee',
      role: 'staff', pay_type: 'salary', is_active: true,
      created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
    }];
    mount();
    expect(fixture.permissionReads).not.toHaveBeenCalled();
    expect(fixture.permissionEditor).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Open Access & Delegation' }));
    expect(await screen.findByText('Existing property delegation boundary')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Access & Delegation' })).toHaveAttribute('data-state', 'active');
    expect(fixture.permissionReads).not.toHaveBeenCalled();
    expect(fixture.permissionEditor).not.toHaveBeenCalled();
  });

});

