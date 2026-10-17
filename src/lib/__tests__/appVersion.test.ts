import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION, checkForUpdates, getAvailableDeployment } from '../appVersion';

const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
const local = { version: APP_VERSION, commit: a, buildTime: '2026-10-17T10:00:01.000Z' };
afterEach(() => vi.unstubAllGlobals());

describe('deployment metadata update comparison', () => {
  it('detects a new commit at the same application version', () => {
    expect(getAvailableDeployment({ ...local, commit: b }, local)?.key).toBe(APP_VERSION + ':' + b);
  });
  it('ignores timestamps when both known commits are identical', () => {
    expect(getAvailableDeployment({ ...local, buildTime: '2026-10-17T11:00:00.000Z' }, local)).toBeNull();
  });
  it('uses a strictly newer valid timestamp when commit metadata is unavailable', () => {
    expect(getAvailableDeployment({ version: APP_VERSION, buildTime: '2026-10-17T11:00:00.000Z' }, local)).not.toBeNull();
  });
  it('ignores older prebuild metadata from the same build and equal timestamps', () => {
    for (const buildTime of ['2026-10-17T10:00:00.000Z', local.buildTime]) {
      expect(getAvailableDeployment({ version: APP_VERSION, buildTime }, { ...local, commit: '' })).toBeNull();
    }
  });
  it.each([null, {}, { version: 123 }, { version: 'broken' },
    { version: APP_VERSION, commit: 'not-a-commit', buildTime: 'invalid' },
    { version: APP_VERSION, buildTime: '2026-02-30T00:00:00.000Z' },
  ])('ignores malformed or unknown metadata %j', remote => {
    expect(getAvailableDeployment(remote, local)).toBeNull();
  });
  it('retains version-change detection for valid version metadata', () => {
    expect(getAvailableDeployment({ version: '3.55.6' }, local)?.version).toBe('3.55.6');
  });
  it('does not parse a non-OK endpoint response', async () => {
    const json = vi.fn().mockResolvedValue({ version: '3.55.6' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json }));
    expect(await checkForUpdates()).toBe(false);
    expect(json).not.toHaveBeenCalled();
  });
  it('fails closed on malformed JSON and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => { throw Error('bad JSON'); } }));
    expect(await checkForUpdates()).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Error('offline')));
    expect(await checkForUpdates()).toBe(false);
  });
});

