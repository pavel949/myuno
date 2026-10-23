import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { document.cookie = 'myuno-cookie-consent=; path=/; max-age=0'; localStorage.removeItem('myuno-cookie-consent'); });
it('treats malformed fallback consent cookies as absent instead of breaking bootstrap', async () => {
  vi.resetModules();
  localStorage.removeItem('myuno-cookie-consent');
  document.cookie = 'myuno-cookie-consent=%E0%A4%A; path=/';
  const { hasCookieConsent } = await import('./cookieConsent');
  expect(() => hasCookieConsent('analytics')).not.toThrow();
  expect(hasCookieConsent('analytics')).toBe(false);
});
