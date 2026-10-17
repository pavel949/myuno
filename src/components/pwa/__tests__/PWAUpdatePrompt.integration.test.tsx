import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: {
    children: ReactNode; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown;
  }) => <div {...props}>{children}</div> },
}));
vi.mock('@/lib/appVersion', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/appVersion')>();
  return {
    ...actual,
    forceCleanAllCaches: vi.fn(),
    getAvailableDeployment: (remote: unknown) => actual.getAvailableDeployment(remote, {
      version: actual.APP_VERSION, commit: 'a'.repeat(40), buildTime: '2026-10-17T10:00:01.000Z',
    }),
  };
});
import { APP_VERSION, forceCleanAllCaches } from '@/lib/appVersion';
import { VersionWatcher, UPDATE_AVAILABLE_EVENT } from '../VersionWatcher';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';

beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); sessionStorage.clear(); });

describe('actual watcher to actual update prompt with synthetic responses', () => {
  it('shows same-version deployment B, dismisses only B, and shows later deployment C without touching drafts', async () => {
    let remote: unknown = { version: APP_VERSION, commit: 'b'.repeat(40) };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => remote })));
    localStorage.setItem('vendor_draft_synthetic', 'important input');
    sessionStorage.setItem('in_progress_form', 'keep');
    render(<><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(screen.getByRole('status')).toHaveTextContent('Update available');
    expect(screen.getByRole('status')).not.toHaveTextContent('b'.repeat(40));
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('pwa_update_dismissed_deployment_' + APP_VERSION + ':' + 'b'.repeat(40))).toBe('true');
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    remote = { version: APP_VERSION, commit: 'c'.repeat(40) };
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(screen.getByRole('status')).toHaveTextContent('Update available');
    expect(localStorage.getItem('vendor_draft_synthetic')).toBe('important input');
    expect(sessionStorage.getItem('in_progress_form')).toBe('keep');
    expect(forceCleanAllCaches).not.toHaveBeenCalled();
    localStorage.removeItem('vendor_draft_synthetic');
  });

  it('ignores invalid deployment keys and legacy same-version events; preserves version-only compatibility', () => {
    render(<PWAUpdatePrompt />);
    const send = (detail: unknown) => act(() => {
      window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail }));
    });
    send({ version: APP_VERSION });
    send({ version: APP_VERSION, deploymentKey: 'foreign:' + 'b'.repeat(40) });
    send({ version: APP_VERSION, deploymentKey: APP_VERSION + ':not-a-deployment' });
    send({ version: APP_VERSION, deploymentKey: APP_VERSION + ':version' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    send({ version: '3.55.6' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(sessionStorage.getItem('pwa_update_dismissed_v3.55.6')).toBe('true');
    send({ version: '3.55.6' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

