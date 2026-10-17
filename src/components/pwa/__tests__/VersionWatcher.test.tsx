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
import { UPDATE_AVAILABLE_EVENT, VersionWatcher } from '../VersionWatcher';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('notifies once per deployment while retaining detail.version for same-version commits', async () => {
  let remote: unknown = { version: APP_VERSION, commit: 'b'.repeat(40) };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => remote })));
  const events: string[] = [];
  const listener = (event: Event) => events.push((event as CustomEvent).detail.version);
  window.addEventListener(UPDATE_AVAILABLE_EVENT, listener);
  try {
    render(<VersionWatcher />);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(events).toEqual([APP_VERSION]);
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(events).toEqual([APP_VERSION]);
    remote = { version: APP_VERSION, commit: 'c'.repeat(40) };
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(events).toEqual([APP_VERSION, APP_VERSION]);
    remote = { version: APP_VERSION, commit: 'a'.repeat(40), buildTime: '2026-10-17T12:00:00.000Z' };
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(events).toHaveLength(2);
  } finally {
    window.removeEventListener(UPDATE_AVAILABLE_EVENT, listener);
  }
});

