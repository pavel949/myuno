import { StrictMode, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConciergeHelpSheet } from './ConciergeHelpSheet';

const fixture = vi.hoisted(() => ({ invoke: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: fixture.invoke } } }));
vi.mock('@/lib/analytics/track', () => ({ trackEvent: vi.fn() }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null, appendTranscript: (a: string, b: string) => a + b }));
vi.mock('sonner', () => ({ toast: { error: fixture.error } }));
function ControlledHelp() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Ask for help</button><ConciergeHelpSheet open={open} onOpenChange={setOpen} topic="property" /></>;
}
beforeEach(() => { fixture.invoke.mockReset().mockResolvedValue({ error: new Error('Synthetic unavailable') }); fixture.error.mockClear(); });
describe('controlled help sheet focus', () => {
  it('keeps default initial focus and restores an external opener after Escape', async () => {
    render(<StrictMode><ControlledHelp /></StrictMode>);
    const opener = screen.getByRole('button', { name: 'Ask for help' }); opener.focus();
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(fixture.invoke).not.toHaveBeenCalled();
  });
  it('retains entered values and honest error state before returning focus on close', async () => {
    render(<ControlledHelp />);
    const opener = screen.getByRole('button', { name: 'Ask for help' }); opener.focus(); fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog');
    const message = dialog.querySelector('#hr-message')!;
    const email = dialog.querySelector('#hr-email')!;
    fireEvent.change(message, { target: { value: 'Synthetic request not sent to production' } });
    fireEvent.change(email, { target: { value: 'fixture@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send to a concierge' }));
    await waitFor(() => expect(fixture.error).toHaveBeenCalled());
    expect(message).toHaveValue('Synthetic request not sent to production');
    expect(email).toHaveValue('fixture@example.test');
    expect(screen.queryByText('Thank you, we have your message')).toBeNull();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(opener).toHaveFocus());
    expect(fixture.invoke).toHaveBeenCalledOnce();
  });
});
