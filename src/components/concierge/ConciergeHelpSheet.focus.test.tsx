import { StrictMode, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConciergeHelpSheet } from './ConciergeHelpSheet';

const fixture = vi.hoisted(() => ({ invoke: vi.fn(), error: vi.fn(), success: vi.fn(), language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: fixture.invoke } } }));
vi.mock('@/lib/analytics/track', () => ({ trackEvent: vi.fn() }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null, appendTranscript: (a: string, b: string) => a + b }));
vi.mock('sonner', () => ({ toast: { error: fixture.error, success: fixture.success } }));
function ControlledHelp() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Ask for help</button><ConciergeHelpSheet open={open} onOpenChange={setOpen} topic="property" /></>;
}
beforeEach(() => { fixture.invoke.mockReset().mockResolvedValue({ error: new Error('Synthetic unavailable') }); fixture.error.mockClear(); fixture.success.mockClear(); fixture.language = 'en'; });
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
    expect(screen.queryByText('Your request is saved')).toBeNull();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(opener).toHaveFocus());
    expect(fixture.invoke).toHaveBeenCalledOnce();
  });
});

function fillRequest() {
  fireEvent.change(screen.getByLabelText(/Tell us what you need/), { target: { value: 'Synthetic request, no production calls' } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'fixture@example.test' } });
}
describe('help request acknowledgement', () => {
  it('acknowledges a saved request only with server success and a nonempty identifier', async () => {
    fixture.invoke.mockResolvedValue({ data: { success: true, request_id: 'synthetic-request-1' }, error: null });
    render(<ConciergeHelpSheet open onOpenChange={() => {}} topic="general" />); fillRequest();
    fireEvent.click(screen.getByRole('button', { name: 'Send to a concierge' }));
    expect(await screen.findByText('Your request is saved')).toBeVisible();
    expect(screen.getByText(/A team reply is still pending/)).toBeVisible();
    expect(fixture.success).toHaveBeenCalledWith('Request saved');
    expect(screen.queryByText(/verified specialist|1–2 hours|saved under|never pass/i)).toBeNull();
  });
  it.each([undefined, '', '   '])('does not acknowledge missing or blank request ID %s and permits retry', async request_id => {
    fixture.invoke.mockResolvedValueOnce({ data: { success: true, request_id }, error: null }).mockResolvedValueOnce({ data: { success: true, request_id: 'synthetic-retry' }, error: null });
    render(<ConciergeHelpSheet open onOpenChange={() => {}} topic="general" />); fillRequest();
    fireEvent.click(screen.getByRole('button', { name: 'Send to a concierge' }));
    await waitFor(() => expect(fixture.error).toHaveBeenCalledOnce());
    expect(screen.queryByText('Your request is saved')).toBeNull(); expect(fixture.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Send to a concierge' }));
    expect(await screen.findByText('Your request is saved')).toBeVisible(); expect(fixture.invoke).toHaveBeenCalledTimes(2);
  });
  it('synchronously blocks repeated form submit events while one request is pending', async () => {
    let finish!: (value: unknown) => void;
    fixture.invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<ConciergeHelpSheet open onOpenChange={() => {}} topic="general" />); fillRequest();
    const form = screen.getByRole('button', { name: 'Send to a concierge' }).closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(fixture.invoke).toHaveBeenCalledOnce(); expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    finish({ data: { success: true, request_id: 'synthetic-one' }, error: null });
    expect(await screen.findByText('Your request is saved')).toBeVisible();
  });
  it('localizes Thai content, selector labels, close action and request language', async () => {
    fixture.language = 'th'; fixture.invoke.mockResolvedValue({ data: { success: true, request_id: 'synthetic-th' }, error: null });
    render(<ConciergeHelpSheet open onOpenChange={() => {}} topic="property" />);
    expect(screen.getByRole('combobox', { name: 'เร่งด่วนเพียงใด' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'ช่องทางติดต่อกลับ' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'ปิด' })).toBeVisible();
    fireEvent.change(screen.getByLabelText(/บอกสิ่งที่คุณต้องการ/), { target: { value: 'คำขอทดสอบเท่านั้น' } });
    fireEvent.change(screen.getByLabelText(/อีเมล/), { target: { value: 'fixture@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'ส่งคำขอ' }));
    expect(await screen.findByText('บันทึกคำขอของคุณแล้ว')).toBeVisible();
    expect(fixture.invoke.mock.calls[0][1].body.language).toBe('th');
  });
});
