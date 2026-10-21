import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const controls = vi.hoisted(() => {
  vi.stubGlobal('__BUILD_TIMESTAMP__', '2026-10-19T00:00:00.000Z');
  vi.stubGlobal('__BUILD_COMMIT__', 'a'.repeat(40));
  return { language: 'en', reload: vi.fn() };
});
vi.mock('@sentry/react', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ silent: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: controls.language }) }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: {
    children: ReactNode; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown;
  }) => <div {...props}>{children}</div> },
}));
// Only the final browser navigation is intercepted. Identity checks, network
// validation, prompt handlers and the storage/SW/cache cleanup are real code.
vi.mock('@/lib/appVersion', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/appVersion')>(),
  reloadForDeployment: controls.reload,
}));
import { APP_VERSION, getAvailableDeployment, requestUpdateCheck } from '@/lib/appVersion';
import { useFormDraft } from '@/hooks/useFormDraft';
import { flushPendingBookingDrafts, useBookingDraft } from '@/hooks/useBookingDraft';
import { clearRecoveryReloadRequest, installFetchRecoveryPrompt, requestRecoveryReload } from '@/lib/pwaRecovery';
import { ErrorBoundary, useGlobalErrorHandler } from '@/components/ErrorBoundary';
import { VersionWatcher, UPDATE_AVAILABLE_EVENT } from '../VersionWatcher';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';

let remote: unknown;
let responseOK: boolean;
let fetchMock: ReturnType<typeof vi.fn>;
let unregister: ReturnType<typeof vi.fn>;
let otherUnregister: ReturnType<typeof vi.fn>;
let deleteCache: ReturnType<typeof vi.fn>;
let cacheKeys: Set<string>;
let visibility: DocumentVisibilityState;
const deployment = (commit = 'b', buildTime = '2026-10-19T01:00:00.000Z') => ({ version: APP_VERSION, commit: commit.repeat(40), buildTime });

function DraftForm() {
  const [form, setForm] = useState({ guest: '' });
  const { clear } = useBookingDraft('synthetic_transfer', form, draft => setForm(previous => ({ ...previous, ...draft })));
  return <><input aria-label="Synthetic guest" value={form.guest} onChange={event => setForm({ guest: event.target.value })} />
    <button onClick={clear}>Clear synthetic draft</button></>;
}

function VendorForm() {
  const { formData, updateField, clearDraft } = useFormDraft({ key: 'synthetic-vendor', initialData: { name: '' } });
  return <><input aria-label="Synthetic vendor" value={formData.name} onChange={event => updateField('name', event.target.value)} />
    <button onClick={clearDraft}>Discard vendor draft</button></>;
}

beforeEach(() => {
  vi.useFakeTimers();
  clearRecoveryReloadRequest();
  controls.language = 'en';
  controls.reload.mockReset();
  sessionStorage.clear();
  localStorage.clear();
  visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  remote = deployment();
  responseOK = true;
  fetchMock = vi.fn(async () => ({ ok: responseOK, json: async () => remote }));
  vi.stubGlobal('fetch', fetchMock);
  unregister = vi.fn(async () => true);
  otherUnregister = vi.fn(async () => true);
  vi.stubGlobal('navigator', { onLine: true, serviceWorker: { getRegistrations: async () => [
    { scope: `${location.origin}/`, active: { scriptURL: `${location.origin}/sw.js` }, unregister },
    { scope: `${location.origin}/other/`, active: { scriptURL: `${location.origin}/other/sw.js` }, unregister: otherUnregister },
  ] } });
  cacheKeys = new Set([`workbox-precache-v2-${location.origin}/`, 'myuno-assets', 'business-outbox', 'myuno-images']);
  deleteCache = vi.fn(async key => cacheKeys.delete(key));
  vi.stubGlobal('caches', { keys: async () => [...cacheKeys], delete: deleteCache });
  sessionStorage.setItem('booking_draft:synthetic_transfer', JSON.stringify({ ts: Date.now(), data: { guest: 'Synthetic restored guest' } }));
  sessionStorage.setItem('auth_flow', 'synthetic OAuth state');
  localStorage.setItem('synthetic_auth_session', 'synthetic saved session');
});
afterEach(() => { cleanup(); clearRecoveryReloadRequest(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); sessionStorage.clear(); localStorage.clear(); });

async function showPrompt() {
  render(<><DraftForm /><PWAUpdatePrompt /><VersionWatcher /></>);
  await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
  expect(screen.getByRole('status')).toHaveTextContent('Update available');
}
async function update() {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Update now' })); });
}
function preserved() {
  expect(JSON.parse(sessionStorage.getItem('booking_draft:synthetic_transfer')!).data.guest).toBe('Synthetic restored guest');
  expect(sessionStorage.getItem('auth_flow')).toBe('synthetic OAuth state');
  expect(localStorage.getItem('synthetic_auth_session')).toBe('synthetic saved session');
  expect(otherUnregister).not.toHaveBeenCalled();
}

describe('real watcher, prompt, draft and cleanup flow with synthetic browser data', () => {
  it('shows a same-version deployment and updates only on click after a fresh successful check', async () => {
    await showPrompt();
    expect(screen.getByLabelText('Synthetic guest')).toHaveValue('Synthetic restored guest');
    expect(screen.getByRole('status')).toHaveTextContent('Save unfinished changes');
    expect(controls.reload).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
    await update();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ cache: 'no-store', credentials: 'omit' });
    expect(unregister).toHaveBeenCalledOnce();
    expect(cacheKeys).toEqual(new Set(['business-outbox', 'myuno-images']));
    expect(controls.reload).toHaveBeenCalledExactlyOnceWith(getAvailableDeployment(remote)!.key);
    preserved();
    cleanup();
    render(<DraftForm />);
    expect(screen.getByLabelText('Synthetic guest')).toHaveValue('Synthetic restored guest');
  });

  it('flushes the last keystroke before immediate Update now and restores it', async () => {
    await showPrompt();
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Synthetic edited guest' } });
    // Deliberately do not wait for the draft hook's 400 ms debounce.
    await update();
    cleanup();
    render(<DraftForm />);
    expect(screen.getByLabelText('Synthetic guest')).toHaveValue('Synthetic edited guest');
    expect(controls.reload).toHaveBeenCalledOnce();
  });


  it('flushes edits made while the fresh availability request and cache cleanup are pending', async () => {
    await showPrompt();
    let resolveRequest!: (response: unknown) => void;
    let resolveCleanup!: (result: boolean) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; }));
    unregister.mockImplementationOnce(() => new Promise(resolve => { resolveCleanup = resolve; }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Update now' })); });
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Edited during fetch' } });
    await act(async () => { resolveRequest({ ok: true, json: async () => remote }); });
    expect(controls.reload).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem('booking_draft:synthetic_transfer')!).data.guest).toBe('Edited during fetch');
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Edited during cleanup' } });
    await act(async () => { resolveCleanup(true); });
    expect(controls.reload).toHaveBeenCalledOnce();
    cleanup();
    render(<DraftForm />);
    expect(screen.getByLabelText('Synthetic guest')).toHaveValue('Edited during cleanup');
  });

  it('blocks update cleanup and navigation when the pending draft cannot be persisted', async () => {
    await showPrompt();
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Unsaved synthetic guest' } });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('synthetic storage full'); });
    await update();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Synthetic guest')).toHaveValue('Unsaved synthetic guest');
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
  });

  it('dismisses just this deployment across remounts and offers a same-commit rebuild later', async () => {
    await showPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    cleanup();
    render(<><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { requestUpdateCheck(); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    remote = deployment('b', '2026-10-19T02:00:00.000Z');
    await act(async () => { requestUpdateCheck(); });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(unregister).not.toHaveBeenCalled();
    expect(deleteCache).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    preserved();
  });

  it.each(['http', 'network', 'malformed', 'unchanged', 'different-deployment'])('does not clean or navigate after a %s recheck', async failure => {
    await showPrompt();
    if (failure === 'http') responseOK = false;
    if (failure === 'network') fetchMock.mockRejectedValueOnce(new Error('synthetic offline'));
    if (failure === 'malformed') remote = { version: APP_VERSION, commit: 'bad', buildTime: 'bad' };
    if (failure === 'unchanged') remote = { version: APP_VERSION, commit: 'a'.repeat(40), buildTime: '2026-10-19T00:00:00.000Z' };
    if (failure === 'different-deployment') remote = deployment('c');
    await update();
    expect(screen.getByRole('alert')).toHaveTextContent('has not reloaded');
    expect(screen.getByRole('button', { name: 'Update now' })).toBeEnabled();
    expect(unregister).not.toHaveBeenCalled();
    expect(deleteCache).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    preserved();
  });

  it.each(['unregister-reject', 'unregister-false', 'cache-reject'])('preserves work and allows retry after %s cleanup failure', async failure => {
    await showPrompt();
    if (failure === 'unregister-reject') unregister.mockRejectedValueOnce(new Error('synthetic SW error'));
    if (failure === 'unregister-false') unregister.mockResolvedValueOnce(false);
    if (failure === 'cache-reject') deleteCache.mockRejectedValueOnce(new Error('synthetic cache error'));
    await update();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(controls.reload).not.toHaveBeenCalled();
    preserved();
    await update();
    expect(controls.reload).toHaveBeenCalledOnce();
    preserved();
  });

  it('never navigates a long-hidden tab, even after a successful fresh check or SW activation', async () => {
    await showPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    visibility = 'hidden';
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(11 * 60_000); });
    expect(fetchMock).toHaveBeenCalledOnce();
    visibility = 'visible';
    responseOK = false;
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    responseOK = true;
    remote = deployment('c');
    await act(async () => { requestUpdateCheck(); });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(controls.reload).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
    preserved();
  });

  it('fails safely offline and successfully retries only after connectivity returns', async () => {
    await showPrompt();
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await update();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await update();
    expect(controls.reload).toHaveBeenCalledOnce();
    preserved();
  });


  it('times out an unavailable recheck without leaving the update action stuck', async () => {
    await showPrompt();
    fetchMock.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('synthetic request timeout')));
    }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Update now' })); });
    expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled();
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update now' })).toBeEnabled();
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    preserved();
  });

  it('does not start a second cleanup while an update is already pending', async () => {
    await showPrompt();
    let resolveRequest!: (response: unknown) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; }));
    const button = screen.getByRole('button', { name: 'Update now' });
    await act(async () => { fireEvent.click(button); fireEvent.click(button); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(unregister).not.toHaveBeenCalled();
    await act(async () => { resolveRequest({ ok: true, json: async () => remote }); });
    expect(unregister).toHaveBeenCalledOnce();
    expect(controls.reload).toHaveBeenCalledOnce();
  });

  it('keeps Later effective when browser storage is unavailable', async () => {
    await showPrompt();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('synthetic blocked storage'); });
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    await act(async () => { requestUpdateCheck(); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
  });

  it('drops an in-flight watcher result after unmount', async () => {
    let resolveRequest!: (response: unknown) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; }));
    const notified = vi.fn();
    window.addEventListener(UPDATE_AVAILABLE_EVENT, notified);
    const mounted = render(<VersionWatcher />);
    await act(async () => { requestUpdateCheck(); });
    mounted.unmount();
    await act(async () => { resolveRequest({ ok: true, json: async () => remote }); });
    expect(notified).not.toHaveBeenCalled();
    window.removeEventListener(UPDATE_AVAILABLE_EVENT, notified);
  });


  it('does not resurrect a deliberately cleared draft on reload or unmount', async () => {
    await showPrompt();
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Cleared synthetic input' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear synthetic draft' }));
    await update();
    cleanup();
    expect(sessionStorage.getItem('booking_draft:synthetic_transfer')).toBeNull();
    expect(flushPendingBookingDrafts()).toBe(true);
    expect(sessionStorage.getItem('booking_draft:synthetic_transfer')).toBeNull();
  });


  it('does not recreate a cleared draft after the actual callers’ fresh-wrapper success rerender', async () => {
    function WrappedDraft() {
      const [guest, setGuest] = useState('');
      const [success, setSuccess] = useState(false);
      const { clear } = useBookingDraft('synthetic_transfer', { guest, step: 1 }, draft => setGuest(draft.guest ?? ''));
      return <><input aria-label="Wrapped guest" value={guest} onChange={event => setGuest(event.target.value)} />
        <button onClick={() => { clear(); setSuccess(true); }}>Complete synthetic form</button>
        <span>{success ? 'Synthetic success' : 'Synthetic editing'}</span></>;
    }
    render(<><WrappedDraft /><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    fireEvent.click(screen.getByRole('button', { name: 'Complete synthetic form' }));
    expect(screen.getByText('Synthetic success')).toBeInTheDocument();
    await update();
    cleanup();
    expect(sessionStorage.getItem('booking_draft:synthetic_transfer')).toBeNull();
    expect(controls.reload).toHaveBeenCalledOnce();
  });


  it('flushes the canonical vendor form’s last keystroke without a debounce delay or submission', async () => {
    render(<><VendorForm /><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    fireEvent.change(screen.getByLabelText('Synthetic vendor'), { target: { value: 'Synthetic vendor input' } });
    await update();
    expect(controls.reload).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem('vendor_draft_synthetic-vendor')!).name).toBe('Synthetic vendor input');
    expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith('/version.json?'))).toBe(true);
    cleanup();
    render(<VendorForm />);
    expect(screen.getByLabelText('Synthetic vendor')).toHaveValue('Synthetic vendor input');
    fireEvent.click(screen.getByRole('button', { name: 'Discard vendor draft' }));
    cleanup();
    expect(localStorage.getItem('vendor_draft_synthetic-vendor')).toBeNull();
  });

  it('blocks reload when a pending vendor draft cannot be saved', async () => {
    render(<><VendorForm /><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    fireEvent.change(screen.getByLabelText('Synthetic vendor'), { target: { value: 'Unsaved synthetic vendor' } });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('synthetic storage full'); });
    await update();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Synthetic vendor')).toHaveValue('Unsaved synthetic vendor');
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
  });


  it('flushes vendor edits made during a delayed availability check', async () => {
    render(<><VendorForm /><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    let resolveRequest!: (response: unknown) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Update now' })); });
    fireEvent.change(screen.getByLabelText('Synthetic vendor'), { target: { value: 'Vendor edit during fetch' } });
    await act(async () => { resolveRequest({ ok: true, json: async () => remote }); });
    expect(controls.reload).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem('vendor_draft_synthetic-vendor')!).name).toBe('Vendor edit during fetch');
  });

  it('does not recreate a cleared vendor draft on Update now or unmount', async () => {
    render(<><VendorForm /><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    fireEvent.change(screen.getByLabelText('Synthetic vendor'), { target: { value: 'Cleared vendor input' } });
    fireEvent.click(screen.getByRole('button', { name: 'Discard vendor draft' }));
    await update();
    cleanup();
    expect(controls.reload).toHaveBeenCalledOnce();
    expect(localStorage.getItem('vendor_draft_synthetic-vendor')).toBeNull();
  });

  it('preserves restored draft state through StrictMode setup and cleanup', () => {
    const view = render(<StrictMode><DraftForm /></StrictMode>);
    expect(screen.getByLabelText('Synthetic guest')).toHaveValue('Synthetic restored guest');
    view.unmount();
    expect(JSON.parse(sessionStorage.getItem('booking_draft:synthetic_transfer')!).data.guest).toBe('Synthetic restored guest');
  });

  it('only offers recovery for a matching 412; explicit reload works with unchanged metadata', async () => {
    render(<><DraftForm /><PWAUpdatePrompt /></>);
    const originalResponse = { status: 412, ok: false };
    fetchMock.mockResolvedValueOnce(originalResponse);
    const restoreFetch = installFetchRecoveryPrompt();
    let response: unknown;
    await act(async () => { response = await window.fetch('/auth/bridge'); });
    expect(response).toBe(originalResponse);
    expect(screen.getByRole('status')).toHaveTextContent('Reload available');
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    remote = { version: APP_VERSION, commit: 'a'.repeat(40), buildTime: '2026-10-19T00:00:00.000Z' };
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Kept through 412 recovery' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reload page' })); });
    expect(controls.reload).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(sessionStorage.getItem('booking_draft:synthetic_transfer')!).data.guest).toBe('Kept through 412 recovery');
    restoreFetch();
  });

  it('leaves ordinary API and metadata 412s untouched without recursive recovery', async () => {
    render(<PWAUpdatePrompt />);
    fetchMock.mockResolvedValue({ status: 412, ok: false });
    const restoreFetch = installFetchRecoveryPrompt();
    await act(async () => { await window.fetch('/api/booking'); await window.fetch('/version.json'); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    restoreFetch();
  });

  it('can dismiss recovery and does not clean or navigate after a failed recovery check', async () => {
    render(<PWAUpdatePrompt />);
    act(() => { requestRecoveryReload(); });
    responseOK = false;
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reload page' })); });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    act(() => { requestRecoveryReload(); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => { requestRecoveryReload(true); });
    expect(screen.getByRole('status')).toHaveTextContent('Reload available');
    expect(controls.reload).not.toHaveBeenCalled();
  });

  it('preserves pending draft on outer error-boundary unmount and only reloads on the inline button', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Crash({ fail }: { fail: boolean }) {
      if (fail) throw new Error('Failed to fetch dynamically imported module');
      return <DraftForm />;
    }
    const view = render(<ErrorBoundary><Crash fail={false} /></ErrorBoundary>);
    fireEvent.change(screen.getByLabelText('Synthetic guest'), { target: { value: 'Kept through boundary' } });
    view.rerender(<ErrorBoundary><Crash fail /></ErrorBoundary>);
    expect(screen.getByText('Connection issue')).toBeInTheDocument();
    expect(screen.getByText('Save unfinished changes before reloading.')).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem('booking_draft:synthetic_transfer')!).data.guest).toBe('Kept through boundary');
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
    responseOK = false;
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reload page' })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Reload could not be prepared');
    expect(controls.reload).not.toHaveBeenCalled();
    responseOK = true;
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reload page' })); });
    expect(controls.reload).toHaveBeenCalledOnce();
    expect(JSON.parse(sessionStorage.getItem('booking_draft:synthetic_transfer')!).data.guest).toBe('Kept through boundary');
  });

  it.each(['Failed to fetch', 'Loading chunk 42 failed', 'dynamically imported module'])('global %s rejection offers recovery without navigation', message => {
    function GlobalHandler() { useGlobalErrorHandler(); return <PWAUpdatePrompt />; }
    render(<GlobalHandler />);
    const event = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(event, 'reason', { value: new Error(message) });
    act(() => { window.dispatchEvent(event); });
    expect(screen.getByRole('status')).toHaveTextContent('Reload available');
    expect(event.defaultPrevented).toBe(true);
    expect(unregister).not.toHaveBeenCalled();
    expect(controls.reload).not.toHaveBeenCalled();
  });

  it('ignores malformed events instead of trusting a forged deployment key', () => {
    render(<PWAUpdatePrompt />);
    act(() => { window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail: { version: APP_VERSION, key: 'invented' } })); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers the save-before-reload warning in Russian', async () => {
    controls.language = 'ru';
    render(<><PWAUpdatePrompt /><VersionWatcher /></>);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(screen.getByRole('status')).toHaveTextContent('Сохраните незавершённые изменения');
    expect(screen.getByRole('button', { name: 'Обновить' })).toBeEnabled();
    expect(controls.reload).not.toHaveBeenCalled();
  });
});
