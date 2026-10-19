import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION, checkForUpdates, forceCleanAllCaches, getAvailableDeployment, reloadForDeployment } from '../appVersion';

const local = { version: APP_VERSION, commit: 'a'.repeat(40), buildTime: '2026-10-19T00:00:00.000Z' };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('deployment identity', () => {
  it('detects the same version at a different commit', () => {
    expect(getAvailableDeployment({ ...local, commit: 'b'.repeat(40) }, local)?.commit).toBe('b'.repeat(40));
  });
  it('detects a new build even at the same commit and gives it its own dismissal key', () => {
    const next = { ...local, buildTime: '2026-10-19T01:00:00.000Z' };
    const later = { ...local, buildTime: '2026-10-19T02:00:00.000Z' };
    expect(getAvailableDeployment(next, local)).not.toBeNull();
    expect(getAvailableDeployment(next, local)?.key).not.toBe(getAvailableDeployment(later, local)?.key);
  });
  it('uses build time when host commit metadata is absent', () => {
    expect(getAvailableDeployment({ version: APP_VERSION, buildTime: '2026-10-19T01:00:00.000Z' }, local)).not.toBeNull();
  });
  it('supports a version-only release and a commit-based rollback', () => {
    expect(getAvailableDeployment({ version: '3.55.6' }, local)?.version).toBe('3.55.6');
    expect(getAvailableDeployment({ ...local, commit: 'c'.repeat(40), buildTime: '2026-10-18T00:00:00.000Z' }, local)).not.toBeNull();
  });
  it.each([null, [], '3.55.6', {}, { version: 4 }, { version: 'bad' }, { version: '3.55.6/path' }, local,
    { version: APP_VERSION }, { ...local, commit: 'invalid' },
    { ...local, buildTime: '2026-10-18T00:00:00.000Z' },
    { ...local, buildTime: 'tomorrow' }, { ...local, buildTime: '2026-10-19' },
  ])('does not manufacture an update from %j', remote => {
    expect(getAvailableDeployment(remote, local)).toBeNull();
  });
  it('cannot compare missing local build provenance to same-version remote metadata', () => {
    expect(getAvailableDeployment(local, { version: APP_VERSION })).toBeNull();
  });
  it('uses a deployment-specific cache-buster while preserving the route, query and fragment', () => {
    const replace = vi.fn();
    const key = `${APP_VERSION}:${'b'.repeat(40)}:123`;
    reloadForDeployment(key, { href: 'https://example.test/pms/bookings?space=synthetic#draft', replace });
    const url = new URL(replace.mock.calls[0][0]);
    expect(url.pathname).toBe('/pms/bookings');
    expect(url.searchParams.get('space')).toBe('synthetic');
    expect(url.hash).toBe('#draft');
    expect(url.searchParams.get('_v')).toBe(key);
  });
  it.each(['http', 'network', 'invalid-json'])('does not turn %s failure into availability', async failure => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (failure === 'network') throw new Error('synthetic offline');
      return { ok: failure !== 'http', json: async () => {
        if (failure === 'invalid-json') throw new Error('synthetic malformed response');
        return { version: '3.55.6' };
      } };
    }));
    expect(await checkForUpdates()).toBe(false);
  });
});

describe('app-shell cleanup boundary', () => {
  it('only unregisters the same-origin root myUNO worker, never unrelated registrations or storage', async () => {
    const make = (scriptURL: string, scope = `${location.origin}/`) => ({ scope, active: { scriptURL }, unregister: vi.fn(async () => true) });
    const ours = make(`${location.origin}/sw.js`);
    const other = make(`${location.origin}/other-worker.js`);
    const otherScope = make(`${location.origin}/sw.js`, `${location.origin}/other/`);
    const foreign = make('https://other.example/sw.js');
    vi.stubGlobal('navigator', { onLine: true, serviceWorker: { getRegistrations: async () => [ours, other, otherScope, foreign] } });
    const precache = `workbox-precache-v2-${location.origin}/`;
    const keys = [precache, 'myuno-assets', 'myuno-images', 'google-fonts', 'business-outbox', `workbox-precache-v2-${location.origin}/other/`];
    const deleteCache = vi.fn(async () => true);
    vi.stubGlobal('caches', { keys: async () => keys, delete: deleteCache });
    sessionStorage.setItem('booking_draft:synthetic', 'keep draft');
    sessionStorage.setItem('auth_flow', 'keep session context');
    localStorage.setItem('synthetic_auth_session', 'keep authentication');
    await forceCleanAllCaches();
    expect(ours.unregister).toHaveBeenCalledOnce();
    for (const registration of [other, otherScope, foreign]) expect(registration.unregister).not.toHaveBeenCalled();
    expect(deleteCache.mock.calls.map(([key]) => key)).toEqual([precache, 'myuno-assets']);
    expect(sessionStorage.getItem('booking_draft:synthetic')).toBe('keep draft');
    expect(sessionStorage.getItem('auth_flow')).toBe('keep session context');
    expect(localStorage.getItem('synthetic_auth_session')).toBe('keep authentication');
  });
});
