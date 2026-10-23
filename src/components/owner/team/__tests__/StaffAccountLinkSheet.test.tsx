import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { StaffAccountLinkSheet } from '../StaffAccountLinkSheet';

const state = vi.hoisted(() => ({
  canManage: true,
  company: { activeCompany: { company_id: 'company' } as { company_id: string } | null, isError: false, isLoading: false, refetch: vi.fn() },
  setup: { data: { members: [{ id: 'membership-pk', user_id: 'auth-user', name: 'Same Name', email: 'same@example.com' }], links: [] as { staff_member_id: string; company_member_id: string; user_id: string }[] }, isError: false, isLoading: false, isFetching: false, refetch: vi.fn() },
  save: vi.fn(), success: vi.fn(), error: vi.fn(), activity: vi.fn(), close: vi.fn(), forbidden: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => state.company }));
vi.mock('@/hooks/useTeamPermissions', () => ({ useCanManagePermissions: () => state.canManage }));
vi.mock('@/hooks/useStaffAccountLinks', () => ({ useStaffAccountSetup: () => state.setup, useSetStaffAccountLink: () => ({ mutateAsync: state.save, isPending: false }) }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { state.forbidden(); throw Error('Backend forbidden'); } }) }));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  SheetContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SheetHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  SheetDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));
const link = { staff_member_id: 'directory-id', company_member_id: 'membership-pk', user_id: 'auth-user' };
function mount() { return render(<StaffAccountLinkSheet open onOpenChange={state.close} staffId="directory-id" staffName="Same Name" onViewActivity={state.activity} />); }
beforeEach(() => {
  vi.clearAllMocks(); state.canManage = true; state.company.activeCompany = { company_id: 'company' };
  state.company.isError = false; state.company.isLoading = false;
  state.setup.isError = false; state.setup.isLoading = false; state.setup.isFetching = false; state.setup.data.links = [];
  state.save.mockResolvedValue(link); state.setup.refetch.mockResolvedValue({ data: { ...state.setup.data, links: [link] }, error: null });
  state.company.refetch.mockResolvedValue({ data: { company_id: 'company' }, error: null });
  vi.stubGlobal('fetch', () => { state.forbidden(); throw Error('Network forbidden'); });
});
afterEach(() => { expect(state.forbidden).not.toHaveBeenCalled(); cleanup(); vi.unstubAllGlobals(); });
describe('explicit directory to account selection', () => {
  it('never matches by name/email or saves before an intentional click', async () => {
    mount(); const select = screen.getByLabelText('Company member');
    expect(select).toHaveValue(''); expect(screen.getByText('No account linked.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link account' })).toBeDisabled();
    fireEvent.change(select, { target: { value: 'membership-pk' } });
    expect(state.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Link account' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledWith({ staffId: 'directory-id', memberId: 'membership-pk' }));
    expect(state.save).not.toHaveBeenCalledWith(expect.objectContaining({ staffId: 'auth-user' }));
    await waitFor(() => expect(state.success).toHaveBeenCalledOnce());
  });
  it.each(['company', 'setup'])('treats %s read failure as unknown, not unlinked', source => {
    if (source === 'company') state.company.isError = true; else state.setup.isError = true;
    mount(); expect(screen.getByRole('alert')).toHaveTextContent('Could not load company accounts.');
    expect(screen.queryByText('No account linked.')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument(); expect(state.save).not.toHaveBeenCalled();
  });
  it('requires selected company', () => { state.company.activeCompany = null; mount(); expect(screen.getByText('Select a company.')).toBeInTheDocument(); expect(screen.queryByRole('combobox')).not.toBeInTheDocument(); expect(state.save).not.toHaveBeenCalled(); });
  it('denies non-director controls', () => { state.canManage = false; mount(); expect(screen.getByText('Company directors manage account links.')).toBeInTheDocument(); expect(screen.queryByRole('combobox')).not.toBeInTheDocument(); });
  it('does not present failed mutation as saved', async () => {
    state.save.mockRejectedValue(Error('RPC denied')); mount(); fireEvent.change(screen.getByLabelText('Company member'), { target: { value: 'membership-pk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Link account' }));
    await waitFor(() => expect(state.error).toHaveBeenCalledWith('Could not save account link'));
    expect(state.success).not.toHaveBeenCalled();
  });
  it('unlink sends only directory identity and null membership without any grant call', async () => {
    state.setup.data.links = [link]; mount(); fireEvent.click(screen.getByRole('button', { name: 'Unlink account' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledWith({ staffId: 'directory-id', memberId: null }));
    expect(state.activity).not.toHaveBeenCalled();
  });
  it('fresh revoked link blocks activity despite cached active link', async () => {
    state.setup.data.links = [link]; state.setup.refetch.mockResolvedValue({ data: { members: [], links: [] }, error: null }); mount();
    fireEvent.click(screen.getByRole('button', { name: 'Activity Log' }));
    await waitFor(() => expect(state.error).toHaveBeenCalledWith('No active account linked'));
    expect(state.setup.refetch).toHaveBeenCalledOnce(); expect(state.activity).not.toHaveBeenCalled();
  });
  it('fresh link passes Auth ID, never directory ID, to activity', async () => {
    state.setup.data.links = [link]; mount(); fireEvent.click(screen.getByRole('button', { name: 'Activity Log' }));
    await waitFor(() => expect(state.activity).toHaveBeenCalledWith('auth-user', 'Same Name'));
    expect(state.setup.refetch).toHaveBeenCalledOnce(); expect(state.close).toHaveBeenCalledWith(false); expect(state.save).not.toHaveBeenCalled();
  });
  it('activity lookup error does not trust cached link', async () => {
    state.setup.data.links = [link]; state.setup.refetch.mockResolvedValue({ error: Error('denied'), data: state.setup.data }); mount();
    fireEvent.click(screen.getByRole('button', { name: 'Activity Log' }));
    await waitFor(() => expect(state.error).toHaveBeenCalled()); expect(state.activity).not.toHaveBeenCalled();
  });
  it('discards an in-flight activity result after company changes', async () => {
    state.setup.data.links = [link];
    let finish!: (value: unknown) => void;
    state.setup.refetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = mount(); fireEvent.click(screen.getByRole('button', { name: 'Activity Log' }));
    state.company.activeCompany = { company_id: 'other-company' };
    view.rerender(<StaffAccountLinkSheet open onOpenChange={state.close} staffId="directory-id" staffName="Same Name" onViewActivity={state.activity} />);
    await act(async () => { finish({ data: { members: [], links: [link] }, error: null }); });
    expect(state.activity).not.toHaveBeenCalled(); expect(state.close).not.toHaveBeenCalled();
  });
  it('retries the failed company source without invoking link mutations', () => {
    state.company.isError = true; mount(); fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.company.refetch).toHaveBeenCalledOnce(); expect(state.setup.refetch).not.toHaveBeenCalled(); expect(state.save).not.toHaveBeenCalled();
  });
  it('shows pending accounts separately from an unlinked employee', () => {
    state.setup.isFetching = true; mount(); expect(screen.getByRole('status')).toHaveTextContent('Loading accounts');
    expect(screen.queryByText('No account linked.')).not.toBeInTheDocument(); expect(state.save).not.toHaveBeenCalled();
  });

  it.each(['company-change', 'unmount'] as const)('suppresses stale save notifications after %s', async transition => {
    let finish!: (value: unknown) => void;
    state.save.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = mount();
    fireEvent.change(screen.getByLabelText('Company member'), { target: { value: 'membership-pk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Link account' }));
    expect(state.save).toHaveBeenCalledOnce();
    if (transition === 'unmount') view.unmount();
    else {
      state.company.activeCompany = { company_id: 'other-company' };
      view.rerender(<StaffAccountLinkSheet open onOpenChange={state.close} staffId="directory-id" staffName="Same Name" onViewActivity={state.activity} />);
    }
    await act(async () => { finish(link); });
    expect(state.success).not.toHaveBeenCalled(); expect(state.error).not.toHaveBeenCalled();
  });

});
