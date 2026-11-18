import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { observeLeadNotification } from './leadNotification';
import { attemptChannel, emailAccepted, whatsAppAccepted } from '../../supabase/functions/notify-admin-order/delivery';

describe('notification acceptance is separate from saved intake', () => {
  it.each([
    [{ data: { success: true }, error: null }, 'accepted'],
    [{ data: { success: true, partial: true }, error: null }, 'unconfirmed'],
    [{ data: { success: false }, error: null }, 'unconfirmed'],
    [{ data: null, error: null }, 'unconfirmed'],
    [{ data: { success: true }, error: new Error('HTTP') }, 'unconfirmed'],
  ] as const)('observes resolved invoke response %o', async (response, expected) => {
    expect(await observeLeadNotification(async () => response)).toBe(expected);
  });
  it('does not reject a saved enquiry after transport failure', async () => {
    expect(await observeLeadNotification(async () => { throw Error('network'); })).toBe('unconfirmed');
  });
  it('bounds an ambiguous attempt without retrying', async () => {
    vi.useFakeTimers();
    try {
      const invoke = vi.fn(() => new Promise<{ data: unknown; error: unknown }>(() => {}));
      const outcome = observeLeadNotification(invoke, 10);
      await vi.advanceTimersByTimeAsync(10);
      expect(await outcome).toBe('unconfirmed');
      expect(invoke).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
});

describe('independent provider outcomes', () => {
  it('does not skip WhatsApp when email is unconfigured', async () => {
    const email = vi.fn(async () => {});
    const whatsapp = vi.fn(async () => {});
    expect(await Promise.all([attemptChannel(false, email), attemptChannel(true, whatsapp)])).toEqual(['not_configured', 'accepted']);
    expect(email).not.toHaveBeenCalled();
    expect(whatsapp).toHaveBeenCalledTimes(1);
  });
  it('does not skip the second channel after rejection', async () => {
    expect(await Promise.all([attemptChannel(true, async () => { throw Error(); }), attemptChannel(true, async () => {})])).toEqual(['unconfirmed', 'accepted']);
  });
  it('bounds a provider timeout without claiming rejection or retrying', async () => {
    vi.useFakeTimers();
    try {
      const send = vi.fn(() => new Promise<void>(() => {}));
      const outcome = attemptChannel(true, send, 10);
      await vi.advanceTimersByTimeAsync(10);
      expect(await outcome).toBe('unconfirmed');
      expect(send).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
  it('requires Resend acceptance ID and no error', () => {
    expect(emailAccepted({ data: { id: 'email-id' }, error: null })).toBe(true);
    for (const value of [null, {}, { data: {} }, { data: { id: 'x' }, error: { message: 'rejected' } }]) expect(emailAccepted(value)).toBe(false);
  });
  it('requires explicit WhatsApp acceptance and ID', () => {
    expect(whatsAppAccepted({ sent: 'true', id: 123 })).toBe(true);
    expect(whatsAppAccepted({ sent: true, id: 'message-id' })).toBe(true);
    for (const value of [null, {}, { sent: false, id: 1 }, { sent: 'true' }, { sent: true, id: 1, error: 'rejected' }]) expect(whatsAppAccepted(value)).toBe(false);
  });
});

describe('source integration guards (not browser acceptance)', () => {
  const detail = readFileSync(new URL('../pages/property/OffplanDetail.tsx', import.meta.url), 'utf8');
  const hook = readFileSync(new URL('../hooks/useUniversalLead.ts', import.meta.url), 'utf8');
  const edge = readFileSync(new URL('../../supabase/functions/notify-admin-order/index.ts', import.meta.url), 'utf8');
  it('clears unit context for project actions and route changes', () => {
    expect(detail).toContain('const openProjectEnquiry = () => {\n    setSelectedUnit(null);');
    expect(detail.match(/onClick={openProjectEnquiry}/g)).toHaveLength(2);
    expect(detail).toContain('setSelectedUnit(null);\n  }, [id]);');
    expect(detail).toContain("key={`${project.id}:${selectedUnit?.id || 'project'}`}");
    expect(detail).toContain('if (!open) setSelectedUnit(null)');
  });
  it('only attempts notification after receipt, observes it, and keeps origin alongside notes', () => {
    expect(hook.indexOf('await attempt.submit')).toBeLessThan(hook.indexOf('await observeLeadNotification'));
    expect(hook).toContain('if (receipt.shouldDispatch && data)');
    expect(hook).toContain('input.notes].filter(Boolean)');
    expect(hook).toContain('return data;');
  });
  it('awaits both platform-only channels without logging contacts or provider payloads', () => {
    expect(edge).toContain('const [email, whatsapp] = await Promise.all');
    expect(edge).toContain('to: adminEmails');
    expect(edge).not.toContain('phoneOverride');
    expect(edge).not.toContain("console.info('[WhatsApp] Message:'");
    expect(edge).not.toContain('https://uno.ae');
  });
});

describe('strict configured recipients', () => {
  it('missing settings never choose a legacy recipient', async () => {
    const { configuredAdminContacts } = await import('../../supabase/functions/_shared/admin-notification-contacts');
    expect(configuredAdminContacts([])).toEqual({ emails: [], whatsapp: '' });
  });
  it('uses valid explicitly configured recipients only', async () => {
    const { configuredAdminContacts } = await import('../../supabase/functions/_shared/admin-notification-contacts');
    expect(configuredAdminContacts([
      { key: 'admin_emails', value: '["synthetic@example.invalid"]' },
      { key: 'admin_whatsapp', value: '+66 000 000 000' },
    ])).toEqual({ emails: ['synthetic@example.invalid'], whatsapp: '66000000000' });
  });
  it('fails malformed channels closed independently', async () => {
    const { configuredAdminContacts } = await import('../../supabase/functions/_shared/admin-notification-contacts');
    expect(configuredAdminContacts([
      { key: 'admin_emails', value: ['valid@example.invalid', 'bad\naddress'] },
      { key: 'admin_whatsapp', value: 'undefined' },
    ])).toEqual({ emails: [], whatsapp: '' });
  });
});
