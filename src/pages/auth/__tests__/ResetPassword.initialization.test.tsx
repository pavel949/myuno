import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
const mock = vi.hoisted(() => ({ getSession: vi.fn(), setSession: vi.fn(), updateUser: vi.fn(), signOut: vi.fn(), navigate: vi.fn(), error: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mock.getSession, setSession: mock.setSession, updateUser: mock.updateUser } } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ signOut: mock.signOut }) }));
vi.mock('sonner', () => ({ toast: { error: mock.error, success: vi.fn() } }));
vi.mock('react-router-dom', async () => { const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom'); return { ...actual, useNavigate: () => mock.navigate }; });
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/uno/BrandWordmark', () => ({ BrandWordmark: () => null }));
vi.mock('@/components/uno/PremiumButton', () => ({ PremiumButton: ({ children, onClick, type, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button onClick={onClick} type={type} disabled={disabled}>{children}</button> }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); window.history.replaceState(null, '', '/auth/reset-password'); mock.getSession.mockResolvedValue({ data: { session: null }, error: null }); mock.setSession.mockResolvedValue({ error: null }); mock.updateUser.mockResolvedValue({ error: null }); mock.signOut.mockResolvedValue(undefined); });
const show = () => render(<MemoryRouter><ResetPassword /></MemoryRouter>);
describe('reset link initialization recovery', () => {
  it('offers recovery instead of an endless spinner when session initialization rejects', async () => {
    mock.getSession.mockRejectedValue(new Error('synthetic network failure')); show();
    expect(await screen.findByText('Could not verify link')).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Request new link' })).toHaveAttribute('href', '/auth/forgot-password');
    expect(screen.queryByText('Checking link...')).not.toBeInTheDocument();
  });
  it('offers recovery when applying the email session rejects', async () => {
    window.history.replaceState(null, '', '/auth/reset-password#access_token=synthetic&refresh_token=synthetic&type=recovery'); mock.setSession.mockRejectedValue(new Error('synthetic network failure')); show();
    expect(await screen.findByText('Could not verify link')).toBeInTheDocument(); expect(screen.queryByText('Checking link...')).not.toBeInTheDocument();
  });
  it('retains the valid-session password form', async () => {
    mock.getSession.mockResolvedValue({ data: { session: { user: { id: 'synthetic' } } }, error: null }); show(); expect(await screen.findByRole('heading', { name: 'New password' })).toBeInTheDocument();
  });
  it('retains expired-link recovery without a session', async () => { show(); expect(await screen.findByText('Invalid or expired link')).toBeInTheDocument(); });
});

async function submitSavedPassword() {
  mock.getSession.mockResolvedValue({ data: { session: { user: { id: 'synthetic' } } }, error: null }); show();
  await screen.findByRole('heading', { name: 'New password' });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Synthetic-pass-123' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Synthetic-pass-123' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save password' })); });
}
describe('password change versus sign-out confirmation', () => {
  it('keeps password success truthful while showing refused sign-out without navigation', async () => {
    mock.signOut.mockRejectedValue(new Error('synthetic revocation failure')); await submitSavedPassword();
    expect(await screen.findByText('Your password was changed, but sign-out was not confirmed. Retry sign-out.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Password updated!' })).toBeInTheDocument(); expect(mock.navigate).not.toHaveBeenCalled();
    expect(mock.updateUser).toHaveBeenCalledTimes(1); expect(mock.error).toHaveBeenCalledWith('Sign-out could not be confirmed. Please try again.');
  });
  it('retries logout without changing the password again and navigates only on confirmation', async () => {
    mock.signOut.mockRejectedValueOnce(new Error('synthetic revocation failure')); await submitSavedPassword();
    const retry = await screen.findByRole('button', { name: 'Retry sign-out' }); await act(async () => { fireEvent.click(retry); });
    await waitFor(() => expect(mock.navigate).toHaveBeenCalledWith('/auth', { replace: true })); expect(mock.signOut).toHaveBeenCalledTimes(2); expect(mock.updateUser).toHaveBeenCalledTimes(1);
  });
});
