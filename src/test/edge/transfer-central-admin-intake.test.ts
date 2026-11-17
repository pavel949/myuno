import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transferAdminTargets, transferEmailOutcome, transferWhatsAppOutcome, transferAdminHandoff } from '../../../supabase/functions/notify-transfer-booking/intake-routing';

const source = readFileSync('supabase/functions/notify-transfer-booking/index.ts', 'utf8');

describe('transfer central myUNO intake', () => {
  it('normalizes/deduplicates only configured admins', () => {
    expect(transferAdminTargets(['admin@example.test', 'admin@example.test'], '+66 954 243 332', '66954243332')).toEqual({ emails: ['admin@example.test'], whatsapp: ['66954243332'] });
  });
  it('does not substitute supplier/fallback recipients for missing admins', () => {
    expect(transferAdminTargets([], '', { phone: '66111111111' })).toEqual({ emails: [], whatsapp: [] });
  });
  it('keeps a distinct configured secondary admin and rejects invalid phones', () => {
    expect(transferAdminTargets([], '123', '+66111111111').whatsapp).toEqual(['66111111111']);
  });
  it.each([null, {}, { success: true }, { success: false }, { queued: true }])('does not invent queued email acceptance from %j', data => {
    expect(transferEmailOutcome(data, null)).toBe('failed');
  });
  it('recognizes suppressed email, even with HTTP success', () => {
    expect(transferEmailOutcome({ success: false, reason: 'email_suppressed' }, null)).toBe('suppressed');
  });
  it('requires successful queue admission, not just no thrown error', () => {
    expect(transferEmailOutcome({ success: true, queued: true }, null)).toBe('queued');
    expect(transferEmailOutcome({ success: true, queued: true }, new Error())).toBe('failed');
  });
  it.each([null, {}, { sent: 'false', id: 1 }, { sent: 'true' }, { sent: 'true', id: 0 }, { sent: true, id: 1, error: 'failed' }])('rejects WhatsApp ambiguous/failure body %j', data => {
    expect(transferWhatsAppOutcome(true, data)).toBe('failed');
  });
  it('requires HTTP and provider acceptance', () => {
    expect(transferWhatsAppOutcome(false, { sent: 'true', id: 1 })).toBe('failed');
    expect(transferWhatsAppOutcome(true, { sent: 'true', id: 1 })).toBe('accepted');
  });
  it('reports total and partial admin failures without claiming delivered', () => {
    expect(transferAdminHandoff([], [])).toEqual({ anyAccepted: false, status: 'failed' });
    expect(transferAdminHandoff(['suppressed'], ['not_configured'])).toEqual({ anyAccepted: false, status: 'failed' });
    expect(transferAdminHandoff(['queued'], ['failed'])).toEqual({ anyAccepted: true, status: 'partial' });
    expect(transferAdminHandoff(['failed'], ['accepted'])).toEqual({ anyAccepted: true, status: 'partial' });
    expect(transferAdminHandoff(['queued'], ['accepted'])).toEqual({ anyAccepted: true, status: 'pending' });
  });
  it('retains admin queue keys and customer receipt, removes all known operator sends', () => {
    expect(source).toContain('transferAdminTargets(adminEmails, adminWA, secondaryWA)');
    expect(source).toContain('targets.whatsapp.map(num => sendWhatsApp(num, alertPrefix + opMessage))');
    expect(source).toContain('for (const adminEmail of targets.emails)');
    expect(source).toContain('`transfer-admin-${p.order_id}-${adminEmail}`');
    expect(source).toContain("sendEmail('transfer-customer-received', p.customer_email");
    expect(source).not.toMatch(/sendEmail\([^\n]*op\.email|transfer_operator_emails|extraOperatorEmails|opWa|sskk253722|operator_wa:/);
    expect(source).toContain("c.operatorLine('myUNO')");
    expect(source).not.toContain('~30');
    expect(source).not.toContain("status: operatorMissing ? 'partial' : 'sent'");
  });
  it('preserves the financial/booking block byte-for-byte against reviewed main', () => {
    const block = source.slice(source.indexOf('    // Persist operator_id'), source.indexOf('    const adminEmails')) + '    const adminEmails = await getAdminEmails();\n';
    expect(createHash('sha256').update(block).digest('hex')).toBe('44797b2c885f6b70de2398c13cbd4c07d19e569a0a1bd1afc015b452f256b84a');
  });
  it('the admin email template cannot override configured recipients', () => {
    const template = readFileSync('supabase/functions/_shared/transactional-email-templates/transfer-operator-new.tsx', 'utf8');
    const exported = template.slice(template.indexOf('export const template'));
    expect(exported).not.toMatch(/^\s*to:/m);
  });
});
