import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leadAttempt } from './leadAttempt';

beforeEach(() => { sessionStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());
describe('per-tab lead retry identity', () => {
  it('reuses an ID after an uncertain request and module reload without storing contact details', async () => {
    const payload = { phone: '+66000000000', project_id: 'synthetic', message: 'Synthetic inquiry' };
    const first = await leadAttempt(payload);
    const { leadAttempt: reloaded } = await import('./leadAttempt');
    expect(await reloaded(payload)).toBe(first);
    expect(await leadAttempt({ ...payload, project_id: 'different' })).not.toBe(first);
    expect(JSON.stringify(sessionStorage)).not.toContain(payload.phone);
    expect(JSON.stringify(sessionStorage)).not.toContain(payload.message);
  });
  it('fails before a write when persistence is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('unavailable'); });
    await expect(leadAttempt({ project_id: 'synthetic' })).rejects.toThrow('unavailable');
  });
});
