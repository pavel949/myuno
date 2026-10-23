import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import StaffPage from '../StaffPage';
const state = vi.hoisted(() => ({ actor: 'actor', company: 'company', create: vi.fn(), invite: vi.fn(), actualInvite: vi.fn(), capability: vi.fn(), link: vi.fn(), forbidden: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ symbol: '฿' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: state.actor } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: state.company }, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [] }) }));
vi.mock('@/hooks/useStaffMembers', () => ({
  useAllStaffMembers: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
  useCreateStaffMember: () => ({ isPending: false, mutateAsync: state.create }),
  useUpdateStaffMember: () => ({ isPending: false, mutateAsync: state.forbidden }),
  useDeactivateStaffMember: () => ({ mutate: state.forbidden }),
  useStaffPropertyAssignments: () => ({ data: [] }),
  STAFF_ROLES: [{ value: 'staff', labelEn: 'Staff', labelRu: 'Сотрудник' }],
  PAY_TYPES: [{ value: 'salary', labelEn: 'Salary', labelRu: 'Оклад' }],
}));
vi.mock('@/hooks/useTeamPermissions', () => ({ useCanManagePermissions: () => true }));
vi.mock('@/hooks/useStaffAccountLinks', () => ({
  useStaffAccountSetup: () => ({ data: { members: [{ id: 'membership-pk', user_id: 'auth-user', name: 'Same Name', email: 'same@example.com' }], links: [] }, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() }),
  useSetStaffAccountLink: () => ({ mutateAsync: state.link, isPending: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: state.invite }, from: state.forbidden, rpc: state.forbidden } }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: () => null }));
vi.mock('@/components/owner/vendors/VendorDocumentsTab', () => ({ VendorDocumentsTab: () => null }));
vi.mock('@/pages/owner/TeamPage', () => ({ default: () => null }));
vi.mock('@/components/owner/team/MemberActivitySheet', () => ({ MemberActivitySheet: () => null }));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  SheetContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SheetHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));
vi.mock('@/components/ui/switch', () => ({ Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => <input type="checkbox" aria-label="Send login credentials" checked={checked} onChange={event => onCheckedChange(event.target.checked)} /> }));
function start(invite = true) {
  const view = render(<MemoryRouter><StaffPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Add first staff member' }));
  fireEvent.change(screen.getByPlaceholderText('e.g. Nong Yui'), { target: { value: 'Same Name' } });
  fireEvent.change(screen.getByPlaceholderText('staff@company.com'), { target: { value: 'same@example.com' } });
  expect(screen.getByRole('checkbox', { name: 'Send login credentials' })).not.toBeChecked();
  if (invite) fireEvent.click(screen.getByRole('checkbox', { name: 'Send login credentials' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add Staff Member' }));
  return view;
}
beforeEach(() => {
  vi.clearAllMocks(); state.actor = 'actor'; state.company = 'company'; state.forbidden.mockImplementation(() => { throw Error('Unapproved write forbidden'); });
  state.create.mockResolvedValue({ id: 'directory-created', name: 'Same Name', role: 'staff', is_active: true });
  state.capability.mockResolvedValue({ data: { contract_version: 2 }, error: null });
  state.invite.mockImplementation((name: string, options: { body: { action?: string } }) => {
    expect(name).toBe('invite-team-member');
    return options.body.action === 'capabilities' ? state.capability() : state.actualInvite(name, options);
  });
  state.actualInvite.mockResolvedValue({ data: { user_id: 'auth-user', company_member_id: 'membership-pk', email_sent: true }, error: null });
  state.link.mockResolvedValue({ staff_member_id: 'directory-created', company_member_id: 'membership-pk', user_id: 'auth-user' });
  vi.stubGlobal('fetch', () => { state.forbidden(); throw Error('Network forbidden'); });
});
afterEach(() => { expect(state.forbidden).not.toHaveBeenCalled(); cleanup(); vi.unstubAllGlobals(); });
describe('real StaffPage create to invite to explicit account-link flow', () => {
  it('holds save busy through invitation and links only after explicit member choice', async () => {
    let resolve!: (value: unknown) => void;
    state.actualInvite.mockImplementation(() => new Promise(done => { resolve = done; }));
    start(); await waitFor(() => expect(state.actualInvite).toHaveBeenCalledOnce());
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Saving...' }));
    expect(state.create).toHaveBeenCalledOnce(); expect(state.actualInvite).toHaveBeenCalledOnce(); expect(state.link).not.toHaveBeenCalled();
    await act(async () => { resolve({ data: { user_id: 'auth-user', company_member_id: 'membership-pk', email_sent: true }, error: null }); });
    const select = await screen.findByLabelText('Company member'); expect(select).toHaveValue('');
    expect(state.link).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Link account' })).toBeDisabled();
    fireEvent.change(select, { target: { value: 'membership-pk' } }); expect(state.link).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Link account' }));
    await waitFor(() => expect(state.link).toHaveBeenCalledWith({ staffId: 'directory-created', memberId: 'membership-pk' }));
    expect(state.link).toHaveBeenCalledOnce(); expect(state.create).toHaveBeenCalledOnce(); expect(state.actualInvite).toHaveBeenCalledOnce();
    expect(state.invite).toHaveBeenCalledWith('invite-team-member', { body: { company_id: 'company', action: 'capabilities' } });
    expect(state.capability.mock.invocationCallOrder[0]).toBeLessThan(state.create.mock.invocationCallOrder[0]);
    expect(state.create.mock.invocationCallOrder[0]).toBeLessThan(state.actualInvite.mock.invocationCallOrder[0]);
    expect(state.actualInvite).toHaveBeenCalledWith('invite-team-member', { body: { company_id: 'company', full_name: 'Same Name', email: 'same@example.com', phone: undefined, role: 'staff' } });
  });
  it('old edge response without membership confirmation does not open linking or claim sent', async () => {
    state.actualInvite.mockResolvedValue({ data: { user_id: 'auth-user', email_sent: true }, error: null });
    start(); await waitFor(() => expect(state.error).toHaveBeenCalledWith(expect.stringContaining('Company account was not confirmed')));
    expect(screen.queryByLabelText('Company member')).not.toBeInTheDocument(); expect(state.success).not.toHaveBeenCalled(); expect(state.link).not.toHaveBeenCalled();
    expect(state.create).toHaveBeenCalledOnce(); expect(state.actualInvite).toHaveBeenCalledOnce();
  });
  it('confirmed account with undelivered email offers explicit linking without false sent notification', async () => {
    state.actualInvite.mockResolvedValue({ data: { user_id: 'auth-user', company_member_id: 'membership-pk', email_sent: false }, error: null });
    start(); expect(await screen.findByLabelText('Company member')).toHaveValue('');
    expect(state.error).toHaveBeenCalledWith('Account is available, but the email was not sent.');
    expect(state.success).not.toHaveBeenCalled(); expect(state.link).not.toHaveBeenCalled();
  });
  it('directory-only is default and does not invite or grant account access', async () => {
    start(false); await waitFor(() => expect(screen.queryByRole('button', { name: 'Add Staff Member' })).not.toBeInTheDocument());
    expect(state.create).toHaveBeenCalledOnce(); expect(state.actualInvite).not.toHaveBeenCalled(); expect(state.link).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Company member')).not.toBeInTheDocument();
  });
  it.each(['company', 'actor'] as const)('does not invite from a stale create after %s changes', async scope => {
    let resolve!: (value: unknown) => void;
    state.create.mockImplementation(() => new Promise(done => { resolve = done; }));
    const view = start(); await waitFor(() => expect(state.create).toHaveBeenCalledOnce());
    state[scope] = 'other'; view.rerender(<MemoryRouter><StaffPage /></MemoryRouter>);
    await act(async () => { resolve({ id: 'directory-created', name: 'Same Name', role: 'staff', is_active: true }); });
    expect(state.actualInvite).not.toHaveBeenCalled(); expect(state.link).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Company member')).not.toBeInTheDocument(); expect(state.success).not.toHaveBeenCalled();
  });
  it('discards pending invitation result after company switch without stale panel or toast', async () => {
    let resolve!: (value: unknown) => void;
    state.actualInvite.mockImplementation(() => new Promise(done => { resolve = done; }));
    const view = start(); await waitFor(() => expect(state.actualInvite).toHaveBeenCalledOnce());
    state.company = 'other'; view.rerender(<MemoryRouter><StaffPage /></MemoryRouter>);
    await act(async () => { resolve({ data: { user_id: 'auth-user', company_member_id: 'membership-pk', email_sent: true }, error: null }); });
    expect(screen.queryByLabelText('Company member')).not.toBeInTheDocument(); expect(state.link).not.toHaveBeenCalled();
    expect(state.success).not.toHaveBeenCalled(); expect(state.error).not.toHaveBeenCalled();
  });

  it('legacy edge capability rejection preserves form and prevents directory creation', async () => {
    state.capability.mockResolvedValue({ data: null, error: Error('Missing required fields') });
    start(); await waitFor(() => expect(state.capability).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add Staff Member' })).toBeEnabled());
    expect(screen.getByPlaceholderText('e.g. Nong Yui')).toHaveValue('Same Name');
    expect(state.create).not.toHaveBeenCalled(); expect(state.actualInvite).not.toHaveBeenCalled();
    expect(state.link).not.toHaveBeenCalled(); expect(state.success).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Company member')).not.toBeInTheDocument();
  });

});
