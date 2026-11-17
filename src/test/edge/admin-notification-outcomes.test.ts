import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { classifyEmailAcceptance, classifyWhatsAppAcceptance } from '../../../supabase/functions/notify-admin-order/outcomes';

describe('admin notification provider acceptance', () => {
  it.each([null, {}, { data: null }, { error: { message: 'private provider error' } }, { data: { id: '' } }, { data: { id: 'id' }, error: { message: 'failed' } }])('does not report email success for %j', result => {
    expect(classifyEmailAcceptance(result)).toBe('failed');
  });
  it('labels an email provider ID accepted, not delivered', () => {
    expect(classifyEmailAcceptance({ data: { id: 'synthetic-id' }, error: null })).toBe('accepted');
  });
  it.each([null, {}, { sent: false }, { sent: 'false', id: 123 }, { sent: 'true' }, { sent: 'true', id: 0 }, { sent: true, id: 1, error: 'failed' }])('does not infer WhatsApp acceptance from HTTP 200: %j', result => {
    expect(classifyWhatsAppAcceptance(true, result)).toBe('failed');
  });
  it('rejects HTTP errors even with a success-shaped body', () => {
    expect(classifyWhatsAppAcceptance(false, { sent: 'true', id: 123 })).toBe('failed');
  });
  it.each([true, 'true'])('requires explicit WhatsApp acceptance plus provider ID (%j)', sent => {
    expect(classifyWhatsAppAcceptance(true, { sent, id: 123 })).toBe('accepted');
  });
  it('awaits WhatsApp and avoids logging recipients, payloads or provider responses', () => {
    const source = readFileSync('supabase/functions/notify-admin-order/index.ts', 'utf8');
    expect(source).toContain('const whatsapp = await sendWhatsAppNotification(payload)');
    expect(source).toContain("return 'not_configured'");
    expect(source).not.toMatch(/console\.(?:info|error)\([^;]*(?:targetPhone|message\)|emailResponse|, result\)|, error\))/);
    expect(source).not.toContain('https://uno.ae/');
    expect(source).toContain('channels: { email, whatsapp }');
  });
});
