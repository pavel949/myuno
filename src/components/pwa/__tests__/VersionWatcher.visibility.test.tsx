import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/appVersion', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/appVersion')>();
  return {
    ...actual,
    getAvailableDeployment: (remote: unknown) => actual.getAvailableDeployment(remote, {
      version: actual.APP_VERSION, commit: 'a'.repeat(40), buildTime: '2026-10-17T10:00:01.000Z',
    }),
  };
});
import { APP_VERSION } from '@/lib/appVersion';
import { VersionWatcher } from '../VersionWatcher';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T10:00:00.000Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each(['local', 'non-ok', 'malformed', 'offline', 'available'] as const)(
  'visibility fallback requires currently available metadata: %s', async state => {
    const replace = vi.fn();
    const realWindow = window;
    const location = {
      hostname: realWindow.location.hostname,
      href: realWindow.location.href,
      replace,
    };
    // Keep actual DOM events and timers; isolate only the navigation boundary.
    vi.stubGlobal('window', new Proxy(realWindow, {
      get(target, key) {
        if (key === 'location') return location;
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    }));
    let visibility: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    let remote: unknown = { version: APP_VERSION, commit: 'b'.repeat(40) };
    let ok = true;
    let malformed = false;
    let online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok, json: async () => { if (malformed) throw Error('bad metadata'); return remote; },
    })));
    render(<VersionWatcher />);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    vi.setSystemTime(Date.now() + 11 * 60_000);
    if (state === 'local') remote = { version: APP_VERSION, commit: 'a'.repeat(40) };
    if (state === 'non-ok') ok = false;
    if (state === 'malformed') malformed = true;
    if (state === 'offline') online = false;
    await act(async () => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    expect(replace).toHaveBeenCalledTimes(state === 'available' ? 1 : 0);
  },
);

