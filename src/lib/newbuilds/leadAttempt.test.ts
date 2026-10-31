import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leadAttempt, completeLeadAttempt, startNewLeadAttempt } from './leadAttempt';

beforeEach(() => { sessionStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());
describe('per-tab lead retry identity', () => {
  it('persists a pending ID without storing contact details', async () => {
    const payload = { phone: '+66000000000', project_id: 'synthetic', message: 'Synthetic inquiry' };
    const first = await leadAttempt(payload);
    expect(await leadAttempt(payload)).toEqual(first);
    expect((await leadAttempt({ ...payload, project_id: 'different' })).id).not.toBe(first.id);
    expect(JSON.stringify(sessionStorage)).not.toContain(payload.phone);
    expect(JSON.stringify(sessionStorage)).not.toContain(payload.message);
  });
  it('rotates a completed ID only for an explicit new enquiry, never an uncertain retry', async () => {
    const payload = { project_id: 'synthetic' };
    const pending = await leadAttempt(payload);
    await expect(startNewLeadAttempt(payload, pending.id)).rejects.toThrow('not confirmed');
    expect(await leadAttempt(payload)).toEqual(pending);
    await completeLeadAttempt(payload, pending.id);
    expect(await leadAttempt(payload)).toEqual({ id: pending.id, state: 'completed' });
    await startNewLeadAttempt(payload, pending.id);
    const next = await leadAttempt(payload);
    expect(next.state).toBe('pending'); expect(next.id).not.toBe(pending.id);
  });
  it('fails before a write when persistence is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('unavailable'); });
    await expect(leadAttempt({ project_id: 'synthetic' })).rejects.toThrow('unavailable');
  });
});
