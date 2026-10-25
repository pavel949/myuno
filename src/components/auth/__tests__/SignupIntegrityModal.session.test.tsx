import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SignupIntegrityModal } from '../SignupIntegrityModal';
const f = vi.hoisted(() => ({ actor: 'synthetic-a', invoke: vi.fn(), getUser: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: f.actor }, session: { user: { id: f.actor }, access_token: f.actor }, isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: f.getUser }, functions: { invoke: f.invoke } } }));
const props = { open: true, onClose: () => {}, userId: 'synthetic-a', expectedPhone: null, initialReport: null, initialError: null, emailConfirmationRequired: false, language: 'en' as const };
afterEach(() => { cleanup(); vi.clearAllMocks(); f.actor = 'synthetic-a'; });
it('discards an integrity response when the authenticated actor changes', async () => {
 let finish!: (value: unknown) => void;
 f.getUser.mockImplementation(async () => ({ data: { user: { id: f.actor } }, error: null }));
 f.invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
 const view = render(<SignupIntegrityModal {...props} />); await waitFor(() => expect(f.invoke).toHaveBeenCalledTimes(1));
 f.actor = 'synthetic-b'; view.rerender(<SignupIntegrityModal {...props} />);
 await act(async () => finish({ data: { ok: true, profile_exists: true, phone_saved: true, phone_matches: true, terms_accepted: true, privacy_accepted: true, warnings: [] }, error: null }));
 expect(screen.queryByText('All data saved.')).not.toBeInTheDocument(); expect(screen.queryByText('Profile created')).not.toBeInTheDocument();
});
it('email confirmation never invokes authenticated verification via mount or focus', async () => {
 render(<SignupIntegrityModal {...props} emailConfirmationRequired />);
 window.dispatchEvent(new Event('focus')); await act(async () => {});
 expect(f.invoke).not.toHaveBeenCalled(); expect(f.getUser).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
});
