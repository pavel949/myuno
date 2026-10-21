import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CompanyAccessLifetime } from '@/lib/companyAccessOperation';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
const state = vi.hoisted(() => ({
  lifetime: null as CompanyAccessLifetime | null,
  language: 'en', enabled: true, loading: false, error: false, fetching: false, enforced: true,
  invite: vi.fn(), change: vi.fn(), refetch: vi.fn(),
  members: [{ id: 'verified-member-id', user_id: 'auth-id', role: 'staff', is_active: true, full_name: 'Synthetic Employee', email: 'synthetic@example.test' }],
  assignments: [] as { operating_space_id: string; company_member_id: string; is_active: boolean }[],
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useCompanyTeam', () => ({
  get TEAM_ACCESS_ENABLED() { return state.enabled; },
  useCompanyAccessContext: () => state.lifetime,
  useCompanyTeam: () => ({ isLoading: state.loading, isError: state.error, isFetching: state.fetching, refetch: state.refetch,
    data: state.error || state.loading ? undefined : { members: state.members, spaces: [{ id: 'space-one', name_en: 'Condominiums', name_ru: 'Кондоминиумы', is_active: true }], assignments: state.assignments, permissions: [], spacesEnforced: state.enforced } }),
  useInviteCompanyMember: () => ({ isPending: false, mutateAsync: state.invite }),
  useChangeCompanyMemberAccess: () => ({ isPending: false, mutateAsync: state.change }),
}));
import { CompanyAccessPanel } from '@/components/owner/team/CompanyAccessPanel';
beforeEach(() => {
  vi.clearAllMocks(); state.lifetime = new CompanyAccessLifetime('actor-a', 'company'); state.language = 'en'; state.enabled = true; state.loading = false; state.error = false; state.fetching = false; state.enforced = true;
  state.assignments = []; state.invite.mockResolvedValue({ success: true, code: 'invited', invite_email_sent: true, access_setup_required: true }); state.change.mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('company access panel', () => {
  it('keeps compact square controls inside full-height touch labels', () => {
    render(<CompanyAccessPanel />);
    for (const control of screen.getAllByRole('checkbox')) {
      expect(control).toHaveClass('h-5', 'w-5', 'min-h-0');
      expect(control.closest('label')).toHaveClass('min-h-11');
    }
  });
  it.each([
    ['en', 'Company account access', 'Edit tariffs'], ['ru', 'Доступ аккаунтов компании', 'Редактирование тарифов'], ['th', 'สิทธิ์บัญชีของบริษัท', 'แก้ไขอัตราราคา'],
  ])('renders explicit controls in %s', (language, title, pricing) => {
    state.language = language; render(<CompanyAccessPanel />);
    expect(screen.getByText(title)).toBeTruthy(); expect(screen.getByRole('checkbox', { name: pricing })).not.toBeChecked();
  });
  it('disabled activation prevents all invitation and permission controls', () => {
    state.enabled = false; render(<CompanyAccessPanel />);
    expect(screen.getByRole('button', { name: 'Send secure invitation' })).toBeDisabled();
    for (const control of screen.getAllByRole('checkbox')) expect(control).toBeDisabled();
    expect(state.invite).not.toHaveBeenCalled(); expect(state.change).not.toHaveBeenCalled();
  });
  it('missing permissions data is a blocker, never an editable empty roster', () => {
    state.error = true; render(<CompanyAccessPanel />);
    expect(screen.getByRole('alert')).toHaveTextContent('Access data is unavailable');
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
  it('explicit property grant targets verified company membership rather than HR UUID', async () => {
    render(<CompanyAccessPanel />); fireEvent.click(screen.getByRole('checkbox', { name: 'Edit property drafts' }));
    await waitFor(() => expect(state.change).toHaveBeenCalledWith({ memberId: 'verified-member-id', kind: 'module', module: 'properties', capability: 'edit', enabled: true }));
  });
  it('pricing grant is separate from finance and properties', async () => {
    render(<CompanyAccessPanel />); fireEvent.click(screen.getByRole('checkbox', { name: 'Edit tariffs' }));
    await waitFor(() => expect(state.change).toHaveBeenCalledWith({ memberId: 'verified-member-id', kind: 'module', module: 'pricing', capability: 'edit', enabled: true }));
  });
  it('Space assignment is explicit and starts with no selected Spaces', async () => {
    render(<CompanyAccessPanel />); const checkbox = screen.getByRole('checkbox', { name: 'Condominiums' });
    expect(checkbox).not.toBeChecked(); fireEvent.click(checkbox);
    await waitFor(() => expect(state.change).toHaveBeenCalledWith({ memberId: 'verified-member-id', kind: 'space', spaceId: 'space-one', active: true }));
  });
  it('warns when Space isolation has not been activated', () => {
    state.enforced = false; render(<CompanyAccessPanel />);
    expect(screen.getByText(/Operating Space isolation is not enabled/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send secure invitation' })).toBeDisabled();
    for (const control of screen.getAllByRole('checkbox')) expect(control).toBeDisabled();
  });
  it('duplicate invitation clicks dispatch only once while pending', async () => {
    let finish!: (value: unknown) => void; state.invite.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<CompanyAccessPanel />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Employee' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.test' } });
    const button = screen.getByRole('button', { name: 'Send secure invitation' });
    fireEvent.click(button); fireEvent.click(button); expect(state.invite).toHaveBeenCalledTimes(1);
    finish({ success: true, code: 'invited', invite_email_sent: true, access_setup_required: true });
    await waitFor(() => expect(screen.getByText(/Secure invitation sent\. Configure permissions/)).toBeTruthy());
  });
  it('partial failure remains visible without success copy', async () => {
    state.invite.mockRejectedValue(new Error('Invitation sent; membership incomplete'));
    render(<CompanyAccessPanel />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Employee' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send secure invitation' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invitation sent; membership incomplete'));
    expect(screen.queryByText(/Secure invitation sent\. Configure permissions/)).toBeNull();
  });
});

describe('panel context changes', () => {
  it.each(['resolve', 'reject'])('suppresses late invite %s after same-company actor switch', async outcome => {
    let finish!: (value: unknown) => void;
    let fail!: (reason: unknown) => void;
    state.invite.mockReturnValue(new Promise((resolve, reject) => { finish = resolve; fail = reject; }));
    const view = render(<CompanyAccessPanel />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Actor A invite' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send secure invitation' }));
    state.lifetime!.invalidate(); state.lifetime = new CompanyAccessLifetime('actor-b', 'company');
    view.rerender(<CompanyAccessPanel />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Actor B draft' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@example.test' } });
    await act(async () => { if (outcome === 'resolve') finish({ success: true, code: 'invited', invite_email_sent: true, access_setup_required: true }); else fail(new Error('Old account failure')); });
    expect(screen.getByLabelText('Full name')).toHaveValue('Actor B draft');
    expect(screen.getByLabelText('Email')).toHaveValue('b@example.test');
    expect(screen.queryByText(/Secure invitation sent/)).toBeNull();
    expect(screen.queryByText('Old account failure')).toBeNull();
  });
  it('suppresses late access success after company changes', async () => {
    let finish!: () => void;
    state.change.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    const view = render(<CompanyAccessPanel />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Edit property drafts' }));
    state.lifetime!.invalidate(); state.lifetime = new CompanyAccessLifetime('actor-a', 'company-b');
    view.rerender(<CompanyAccessPanel />);
    await act(async () => { finish(); });
    expect(screen.queryByText(/Access change saved/)).toBeNull();
  });
});
