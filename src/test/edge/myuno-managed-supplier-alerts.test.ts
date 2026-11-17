import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { supplierDispatchSuppressed } from '../../../supabase/functions/notify-vendor-order/policy';

describe('myUNO managed intake contains legacy supplier alerts', () => {
  it.each(['POST', 'GET', 'PUT'])('does not read a customer payload or send anything for %s', async method => {
    const json = vi.fn(() => { throw new Error('must not read customer payload'); });
    const response = supplierDispatchSuppressed({ method, json } as unknown as Request);
    expect(json).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: false, sent: false, skipped: 'myuno_managed_intake', admin_delivery: 'not_checked' });
  });
  it('keeps preflight harmless', async () => {
    const response = supplierDispatchSuppressed({ method: 'OPTIONS' } as Request);
    expect(await response.text()).toBe('');
  });
  it('cannot query private records, notify providers or send email/WhatsApp', () => {
    const entry = readFileSync('supabase/functions/notify-vendor-order/index.ts', 'utf8');
    const policy = readFileSync('supabase/functions/notify-vendor-order/policy.ts', 'utf8');
    expect(entry).toContain('Deno.serve(supplierDispatchSuppressed)');
    expect(entry + policy).not.toMatch(/createServiceClient|createNotifyHandler|sendEmail|sendWhatsApp|fetch\(|\.from\(|\.insert\(/);
  });
  it('manual payment notifications retain admins but never look up or append managers', () => {
    const source = readFileSync('supabase/functions/notify-manual-payment-request/index.ts', 'utf8');
    expect(source).toContain('sendWhatsApp(waMsg, adminWhatsApp)');
    expect(source).toContain('const recipients = [...adminEmails]');
    expect(source).toContain("sb.from('notifications').insert(rows)");
    expect(source).not.toMatch(/managerEmail|managerPhone|ownerProfile|from\('profiles'\)|recipients.push/);
    expect(source).not.toContain('console.info(message)');
  });
});
