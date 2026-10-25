import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthSheetProvider, useAuthSheet } from '../AuthSheetContext';
import { EmailStep } from '@/components/auth/auth-sheet/EmailStep';
import { OtpStep } from '@/components/auth/auth-sheet/OtpStep';
const f = vi.hoisted(() => ({ flow: 'email', auth: { user: null, session: null, isLoading: false } as any, signIn: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(), first: vi.fn(), second: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ ...f.auth, signIn: f.signIn }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: f.getUser, verifyOtp: f.verifyOtp } } }));
vi.mock('@/components/ui/input-otp', () => ({ InputOTP: ({ value, onChange }: any) => <input aria-label="Synthetic OTP" value={value} onChange={event => onChange(event.target.value)} />, InputOTPGroup: () => null, InputOTPSlot: () => null }));
vi.mock('@/components/auth/AuthSheet', () => ({ AuthSheet: ({ open, onSuccess }: any) => !open ? null : f.flow === 'email' ? <EmailStep onBack={() => {}} onSuccess={onSuccess} /> : <OtpStep phone="+66000000000" onBack={() => {}} onSuccess={onSuccess} /> }));
function Consumer() { const auth = useAuthSheet(); return <><button onClick={() => auth.openAuthSheet({ intent: 'first', onSuccess: f.first })}>Open A</button><button onClick={() => auth.openAuthSheet({ intent: 'second', onSuccess: f.second })}>Open B</button><button onClick={auth.closeAuthSheet}>Close intent</button></>; }
function View() { return <AuthSheetProvider><Consumer /></AuthSheetProvider>; }
const actor = { id: 'synthetic-actor' };
function submit() {
 if (f.flow === 'email') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'synthetic@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'synthetic-password' } });
  fireEvent.submit(screen.getByLabelText('Password').closest('form')!);
 } else {
  fireEvent.change(screen.getByLabelText('Synthetic OTP'), { target: { value: '123456' } });
  fireEvent.submit(screen.getByLabelText('Synthetic OTP').closest('form')!);
 }
}
afterEach(() => { cleanup(); vi.clearAllMocks(); f.auth = { user: null, session: null, isLoading: false }; });
describe.each(['email', 'otp'])('originating intent boundary for actual %s step', flow => {
 it.each(['close/reopen', 'replace'])('rejects a late auth response after %s and allows only the new attempt', async action => {
  f.flow = flow; let finish!: (value: unknown) => void;
  const writer = flow === 'email' ? f.signIn : f.verifyOtp;
  writer.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const response = flow === 'email' ? { error: null, user: actor } : { error: null, data: { user: actor, session: { user: actor } } };
  writer.mockResolvedValue(response); f.getUser.mockResolvedValue({ error: null, data: { user: actor } });
  const view = render(<View />); fireEvent.click(screen.getByText('Open A')); submit(); await waitFor(() => expect(writer).toHaveBeenCalledTimes(1));
  if (action === 'close/reopen') fireEvent.click(screen.getByText('Close intent'));
  fireEvent.click(screen.getByText('Open B'));
  expect(screen.getByLabelText(flow === 'email' ? 'Password' : 'Synthetic OTP')).toHaveValue('');
  await act(async () => finish(response));
  f.auth = { user: actor, session: { user: actor }, isLoading: false }; view.rerender(<View />);
  await act(async () => {});
  expect(f.getUser).not.toHaveBeenCalled(); expect(f.first).not.toHaveBeenCalled(); expect(f.second).not.toHaveBeenCalled();
  submit(); await waitFor(() => expect(f.second).toHaveBeenCalledTimes(1)); expect(f.first).not.toHaveBeenCalled();
 });
});
