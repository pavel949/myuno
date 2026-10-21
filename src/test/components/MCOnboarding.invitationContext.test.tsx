import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  actor: 'actor-a', invoke: vi.fn(), register: vi.fn(), authChanged: undefined as undefined | ((event: string, session: { user: { id: string } } | null) => void),
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: state.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ setActiveCompanyId: vi.fn() }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }), useMutation: vi.fn(), useQuery: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('sonner', () => ({ toast: state.toast }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ functions: { invoke: state.invoke } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: { id: state.actor }, access_token: 'synthetic-only' } } }),
    getUser: () => Promise.resolve({ data: { user: { id: state.actor } } }),
    onAuthStateChange: (callback: typeof state.authChanged) => { state.authChanged = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
  },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
  functions: { invoke: state.register },
} }));
vi.mock('@/components/layout/OnboardingLayout', () => ({ OnboardingLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('framer-motion', () => ({ AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>, motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> } }));

async function openInvites() {
  // Import after synthetic activation; real source remains disabled by default.
  const { default: MCOnboarding } = await import('@/pages/mc/MCOnboarding');
  const view = render(<MCOnboarding />);
  fireEvent.change(screen.getByLabelText('Name (EN) *'), { target: { value: 'Synthetic Company' } });
  fireEvent.change(screen.getByLabelText('Name (RU) *'), { target: { value: 'Synthetic Company RU' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Company' }));
  await screen.findByText('Company Logo');
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  fireEvent.change(screen.getByPlaceholderText('Employee name'), { target: { value: 'First Synthetic' } });
  fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'first@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Another' }));
  fireEvent.change(screen.getAllByPlaceholderText('Employee name')[1], { target: { value: 'Second Synthetic' } });
  fireEvent.change(screen.getAllByPlaceholderText('email@example.com')[1], { target: { value: 'second@example.test' } });
  return { ...view, MCOnboarding };
}
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); vi.stubEnv('VITE_TEAM_MEMBER_ACCESS_ENABLED', 'true'); state.actor = 'actor-a';
  state.register.mockResolvedValue({ data: { company_id: 'synthetic-company' }, error: null });
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const success = { data: { success: true, code: 'invited', invite_email_sent: true, access_setup_required: true }, error: null };
describe('onboarding invitation lifetime', () => {
  it('defaults every invitation row to least-privilege staff', async () => {
    state.invoke.mockResolvedValue(success);
    await openInvites();
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    await waitFor(() => expect(state.invoke).toHaveBeenCalledTimes(2));
    for (const call of state.invoke.mock.calls) expect(call[1].body.role).toBe('staff');
    await screen.findByText('All Set!');
  });
  it.each(['actor-render', 'auth-event', 'unmount'])('stops the queued invite and late UI after %s', async mode => {
    let finish!: (result: typeof success) => void;
    state.invoke.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const view = await openInvites();
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    await waitFor(() => expect(state.invoke).toHaveBeenCalledTimes(1));
    state.toast.info.mockClear(); state.toast.success.mockClear(); state.toast.error.mockClear();
    if (mode === 'actor-render') { state.actor = 'actor-b'; view.rerender(<view.MCOnboarding />); }
    if (mode === 'auth-event') act(() => state.authChanged?.('SIGNED_IN', { user: { id: 'actor-b' } }));
    if (mode === 'unmount') view.unmount();
    await act(async () => { finish(success); });
    expect(state.invoke).toHaveBeenCalledTimes(1);
    expect(state.toast.info).not.toHaveBeenCalled(); expect(state.toast.success).not.toHaveBeenCalled(); expect(state.toast.error).not.toHaveBeenCalled();
    expect(screen.queryByText('All Set!')).toBeNull();
    if (mode === 'actor-render') expect(screen.getByLabelText('Name (EN) *')).toHaveValue('');
  });
});
