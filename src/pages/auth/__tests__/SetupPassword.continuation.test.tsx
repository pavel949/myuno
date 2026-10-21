import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SetupPassword from '../SetupPassword';
const mocks = vi.hoisted(() => ({ user: null as null | { id?: string; user_metadata: Record<string, unknown> }, loading: false, updateUser: vi.fn(), navigate: vi.fn(), language: 'en', params: '' }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate, useSearchParams: () => [new URLSearchParams(mocks.params)] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, isLoading: mocks.loading }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { updateUser: mocks.updateUser } } }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/uno/BrandWordmark', () => ({ BrandWordmark: () => null }));
vi.mock('@/components/auth/PasswordStrengthIndicator', () => ({ PasswordStrengthIndicator: () => null }));
vi.mock('@/components/auth/UnderlineInput', () => ({ UnderlineInput: ({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void }) => <label>{label}<input value={value} onChange={event => onChange(event.target.value)} {...props} /></label> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.user = null; mocks.loading = false; mocks.language = 'en'; mocks.params = ''; mocks.updateUser.mockResolvedValue({ error: null }); });
describe('invited account password setup', () => {
  it('offers existing-account recovery and sign in, never duplicate signup', () => {
    render(<SetupPassword />);
    expect(screen.queryByText(/sign.up/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset password by email' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/auth/forgot-password');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/auth');
  });
  it('waits for auth initialization before declaring the link expired', () => {
    mocks.loading = true; render(<SetupPassword />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Invite link not active')).not.toBeInTheDocument();
  });
  it('uses shared login routing after saving, preserving the destination', async () => {
    mocks.user = { user_metadata: { role: 'admin' } }; mocks.params = 'redirect=%2Fmc%2Fproperties';
    render(<SetupPassword />);
    expect(screen.queryByText('Role: admin.')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Test-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Test-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/auth?redirect=%2Fmc%2Fproperties', { replace: true }));
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
  });
  it('returns a previously completed invite to shared login routing', async () => {
    mocks.user = { user_metadata: { password_set: true } }; render(<SetupPassword />);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/auth', { replace: true }));
  });
  it('keeps the password form on an update error', async () => {
    mocks.user = { user_metadata: {} }; mocks.updateUser.mockResolvedValue({ error: new Error('Expired session') });
    render(<SetupPassword />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Test-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Test-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});


describe('setup localization and interruption', () => {
  it('renders Thai recovery actions', () => {
    mocks.language = 'th'; render(<SetupPassword />);
    expect(screen.getByRole('button', { name: 'ตั้งรหัสผ่านใหม่ทางอีเมล' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
  });
  it('does not navigate after unmounting during password save', async () => {
    let resolve: (value: { error: null }) => void = () => {};
    mocks.updateUser.mockImplementation(() => new Promise(result => { resolve = result; }));
    mocks.user = { id: 'first-account', user_metadata: {} };
    const view = render(<SetupPassword />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Test-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Test-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));
    view.unmount(); resolve({ error: null });
    await Promise.resolve();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('does not navigate a different account when an earlier save resolves', async () => {
    let resolve: (value: { error: null }) => void = () => {};
    mocks.updateUser.mockImplementation(() => new Promise(result => { resolve = result; }));
    mocks.user = { id: 'first-account', user_metadata: {} };
    const view = render(<SetupPassword />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Test-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Test-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));
    mocks.user = { id: 'second-account', user_metadata: {} };
    view.rerender(<SetupPassword />); resolve({ error: null });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save & continue' })).toBeEnabled());
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('coalesces repeated submit events while the password save is pending', async () => {
    let resolve: (value: { error: null }) => void = () => {};
    mocks.updateUser.mockImplementation(() => new Promise(result => { resolve = result; }));
    mocks.user = { id: 'first-account', user_metadata: {} };
    render(<SetupPassword />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Test-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Test-pass-123' } });
    const form = screen.getByRole('button', { name: 'Save & continue' }).closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
    resolve({ error: null });
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
  });
});
