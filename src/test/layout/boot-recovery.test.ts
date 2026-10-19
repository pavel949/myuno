import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assetCacheWillUpdate } from '../../../scripts/asset-cache-response-guard';
const html = readFileSync('index.html', 'utf8');
const code = html.match(/<script id="myuno-boot-recovery">([\s\S]*?)<\/script>/)![1];
function install(href = 'https://www.myuno.app/property/search?guests=4#results', unavailableStorage = false, navigatorMock: object = {}) {
  let onError: (event: { target: HTMLScriptElement }) => void = () => {};
  const replace = vi.fn();
  const reload = vi.fn();
  const timeout = vi.fn();
  const url = new URL(href);
  const fakeWindow = { location: { href, origin: url.origin, replace, reload }, addEventListener: (_: string, callback: typeof onError) => { onError = callback; } };
  const storage = unavailableStorage ? { getItem() { throw new Error('disabled'); } } : sessionStorage;
  new Function('window', 'document', 'navigator', 'sessionStorage', 'setTimeout', 'URL', code)(fakeWindow, document, navigatorMock, storage, timeout, URL);
  const fail = () => { const target = document.createElement('script'); target.type = 'module'; target.src = 'https://www.myuno.app/assets/index-old.js'; onError({ target }); };
  return { replace, reload, timeout, fail };
}
beforeEach(() => { document.body.innerHTML = '<div id="root"><div class="uno-splash" role="status"></div></div>'; document.documentElement.lang = 'en'; sessionStorage.clear(); });
describe('bundle-independent bootstrap recovery', () => {
  it('retries a failing entry once and preserves route, search and hash', () => {
    const first = install(); first.fail();
    const url = new URL(first.replace.mock.calls[0][0]);
    expect(url.pathname).toBe('/property/search'); expect(url.searchParams.get('guests')).toBe('4'); expect(url.hash).toBe('#results'); expect(url.searchParams.has('_bootRetry')).toBe(true);
    const second = install(url.href); second.fail();
    expect(second.replace).not.toHaveBeenCalled(); expect(document.querySelector('button')?.textContent).toBe('Try again');
  });
  it('shows recovery without an automatic reload when storage is unavailable', () => {
    const app = install(undefined, true); app.fail();
    expect(app.replace).not.toHaveBeenCalled(); expect(document.querySelector('[role="alert"]')).not.toBeNull();
  });
  it('does not intervene after the app has mounted', () => {
    const app = install(); document.querySelector('#root')!.innerHTML = '<main>App</main>'; app.fail(); app.timeout.mock.calls[0][0]();
    expect(app.replace).not.toHaveBeenCalled(); expect(document.querySelector('button')).toBeNull();
  });
  it.each([['en', 'Try again'], ['ru', 'Повторить'], ['th', 'ลองอีกครั้ง']])('offers accessible manual recovery after a slow start in %s', (language, label) => {
    document.documentElement.lang = language;
    const app = install(); expect(app.timeout.mock.calls[0][1]).toBe(20000); app.timeout.mock.calls[0][0]();
    const button = document.querySelector('button')!; expect(button.textContent).toBe(label); button.click(); expect(app.reload).toHaveBeenCalledOnce();
  });
  it.each(['success', 'registration rejection', 'update rejection', 'missing registration'])('reloads once after manual service-worker recovery: %s', async outcome => {
    const update = vi.fn(() => outcome === 'update rejection' ? Promise.reject(new Error('update failed')) : Promise.resolve());
    const getRegistration = vi.fn(() => outcome === 'registration rejection' ? Promise.reject(new Error('registration failed')) : Promise.resolve(outcome === 'missing registration' ? undefined : { update }));
    const app = install(undefined, false, { serviceWorker: { getRegistration } });
    app.timeout.mock.calls[0][0]();
    const button = document.querySelector('button')!;
    button.click(); button.click();
    expect(getRegistration).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
    await vi.waitFor(() => expect(app.reload).toHaveBeenCalledOnce());
    const fallback = app.timeout.mock.calls.find(call => call[1] === 2500)!;
    fallback[0]();
    expect(app.reload).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledTimes(outcome === 'success' || outcome === 'update rejection' ? 1 : 0);
  });
  it.each(['registration', 'update'])('bounds a hanging %s and ignores its late completion', async hanging => {
    let finish!: (value?: { update: () => Promise<void> }) => void;
    const pending = new Promise<{ update: () => Promise<void> } | undefined>(resolve => { finish = resolve; });
    const update = vi.fn(() => hanging === 'update' ? pending : Promise.resolve());
    const getRegistration = vi.fn(() => hanging === 'registration' ? pending : Promise.resolve({ update }));
    const app = install(undefined, false, { serviceWorker: { getRegistration } });
    app.timeout.mock.calls[0][0]();
    document.querySelector('button')!.click();
    await Promise.resolve();
    expect(app.reload).not.toHaveBeenCalled();
    app.timeout.mock.calls.find(call => call[1] === 2500)![0]();
    expect(app.reload).toHaveBeenCalledOnce();
    finish();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(app.reload).toHaveBeenCalledOnce();
  });
  it('does not contain cache or credential deletion in bootstrap recovery', () => {
    expect(code).not.toMatch(/\.clear\(|\.removeItem\(|caches\.delete|unregister\(/);
  });
});
describe('asset response cache admission', () => {
  it.each(['text/html', 'text/html; charset=utf-8', 'application/xhtml+xml'])('rejects successful SPA HTML response %s', async contentType => {
    const response = { status: 200, headers: new Headers({ 'content-type': contentType }) } as Response;
    expect(await assetCacheWillUpdate({ response })).toBeNull();
  });
  it.each(['text/javascript', 'application/javascript', 'text/css'])('retains valid %s assets', async contentType => {
    const response = { status: 200, headers: new Headers({ 'content-type': contentType }) } as Response;
    expect(await assetCacheWillUpdate({ response })).toBe(response);
  });
});
