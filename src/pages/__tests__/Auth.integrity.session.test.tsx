import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '../Auth';
const f = vi.hoisted(() => ({ auth: { user: null, isLoading: false } as any, signUp: vi.fn(), invoke: vi.fn(), getUser: vi.fn(), availableRoles: ['user'] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ ...f.auth, signUp: f.signUp, signIn: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({ isMCPortal: false, isLoading: false }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ activeRole: 'user', availableRoles: f.availableRoles, hasMCMembership: false, isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: f.getUser }, functions: { invoke: f.invoke }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { primary_role: 'user' }, error: null }) }) }) }) } }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/auth/GoogleSignInButton', () => ({ GoogleSignInButton: () => null, OAuthDivider: () => null }));
vi.mock('@/components/auth/AuthValuePanel', () => ({ AuthValuePanel: () => null }));
function mount(path = '/auth?mode=signup') { return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/auth" element={<Auth />} /><Route path="/" element={<p>Destination</p>} /></Routes></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); f.auth = { user: null, isLoading: false }; f.invoke.mockResolvedValue({ data: null, error: null }); });
afterEach(cleanup);
it('actual full signup shows confirmation without unauthenticated integrity requests', async () => {
 f.signUp.mockResolvedValue({ error: null, data: { user: { id: 'synthetic-new-user' }, session: null } });
 const view = mount(); fireEvent.change(screen.getByLabelText('auth.phone*'), { target: { value: '+66000000000' } }); fireEvent.click(screen.getByText('auth.continue'));
 await screen.findByTestId('signup-button');
 fireEvent.change(screen.getByLabelText('auth.email*'), { target: { value: 'synthetic@example.test' } });
 for (const input of view.container.querySelectorAll('input[type="password"]')) fireEvent.change(input, { target: { value: 'synthetic-password' } });
 for (const input of view.container.querySelectorAll('input[autocomplete="given-name"],input[autocomplete="family-name"]')) fireEvent.change(input, { target: { value: 'Synthetic' } });
 fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByTestId('signup-button'));
 await waitFor(() => expect(f.signUp).toHaveBeenCalled());
 expect(await screen.findByText('Confirm your email — we sent you a verification link.')).toBeInTheDocument();
 expect(f.invoke.mock.calls.filter(([name]) => name === 'verify-signup-integrity')).toHaveLength(0);
 fireEvent.click(screen.getByText('Refresh')); expect(f.getUser).not.toHaveBeenCalled();
});
it('confirmed same-actor pending signup resumes integrity before navigation', async () => {
 sessionStorage.setItem('myuno_pending_signup_integrity', 'synthetic-new-user'); f.auth.user = { id: 'synthetic-new-user' }; f.auth.session = { user: f.auth.user };
 f.getUser.mockResolvedValue({ data: { user: f.auth.user }, error: null }); f.invoke.mockResolvedValue({ data: { ok: true, warnings: [] }, error: null });
 mount('/auth'); expect(await screen.findByText('Signup status')).toBeInTheDocument();
 await waitFor(() => expect(f.invoke).toHaveBeenCalledWith('verify-signup-integrity', expect.anything()));
 expect(screen.queryByText('Destination')).not.toBeInTheDocument();
 fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]); expect(await screen.findByText('Destination')).toBeInTheDocument();
});
it('another authenticated actor does not verify a pending signup identity', async () => {
 sessionStorage.setItem('myuno_pending_signup_integrity', 'synthetic-new-user'); f.auth.user = { id: 'synthetic-other-user' }; f.auth.session = { user: f.auth.user }; mount('/auth');
 expect(await screen.findByText('Destination')).toBeInTheDocument(); expect(f.invoke).not.toHaveBeenCalled();
});
