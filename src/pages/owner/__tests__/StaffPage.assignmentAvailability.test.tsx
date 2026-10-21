import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StaffPage from '../StaffPage';

const state = vi.hoisted(() => ({ language: 'en', update: vi.fn().mockResolvedValue({}) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ symbol: '$' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [{ property_id: 'property-a', title: 'Villa', title_ru: 'Вилла' }] }) }));
vi.mock('@/hooks/useTeamPermissions', () => ({ useMemberPermissions: () => ({ data: [] }), useCanManagePermissions: () => true, MODULES: [] }));
vi.mock('@/hooks/useStaffMembers', () => ({
  useAllStaffMembers: () => ({ data: [{ id: 'staff-a', name: 'Maria', role: 'staff', pay_type: 'salary', is_active: true, created_at: '2026-01-01' }], isLoading: false }),
  useCreateStaffMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStaffMember: () => ({ mutateAsync: state.update, isPending: false }),
  useDeactivateStaffMember: () => ({ mutate: vi.fn(), isPending: false }),
  useStaffPropertyAssignments: () => ({ data: [] }),
  // No assignment mutation exports: the unavailable UI must not depend on them.
  STAFF_ROLES: [{ value: 'staff', labelEn: 'Staff', labelRu: 'Сотрудник' }],
  PAY_TYPES: [{ value: 'salary', labelEn: 'Salary', labelRu: 'Оклад' }],
}));
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: () => null }));
vi.mock('@/components/owner/vendors/VendorDocumentsTab', () => ({ VendorDocumentsTab: () => null }));
vi.mock('@/components/owner/team/MemberPermissionsSheet', () => ({ MemberPermissionsSheet: () => null }));
vi.mock('@/components/owner/team/MemberActivitySheet', () => ({ MemberActivitySheet: () => null }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: () => null,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => null,
}));

afterEach(cleanup);
beforeEach(() => state.update.mockClear());
describe('staff assignment availability', () => {
  it.each(['en', 'ru'])('shows an honest notice while preserving staff editing in %s', async language => {
    state.language = language;
    const ru = language === 'ru';
    render(<MemoryRouter><StaffPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: ru ? 'Редактировать' : 'Edit' }));
    expect(screen.getByText(ru
      ? 'Назначение сотрудников на объекты сейчас недоступно. Сохранить назначения здесь нельзя.'
      : 'Assigning employees to properties is currently unavailable. Assignments cannot be saved here.')).toBeTruthy();
    expect(screen.queryByText(ru ? '+ Добавить объект' : '+ Add property')).toBeNull();
    expect(screen.queryByRole('button', { name: ru ? 'Убрать' : 'Remove' })).toBeNull();
    fireEvent.change(screen.getByDisplayValue('Maria'), { target: { value: 'Maria Updated' } });
    fireEvent.click(screen.getByRole('button', { name: ru ? 'Сохранить изменения' : 'Save Changes' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'staff-a', name: 'Maria Updated' })));
  });
});
