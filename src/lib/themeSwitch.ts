/**
 * Deterministic theme switcher for snapshot/QA workflows.
 *
 * Why a separate helper?
 * The `ThemeProvider` reacts to React state — by the time `setTheme` returns,
 * the DOM may not yet reflect the new class, and `tokens.css` variables that
 * key off `html.light` / `html.dark` may not have been recomputed. Snapshot
 * tools need a single deterministic call that resolves only after:
 *   1. localStorage is updated (so a reload would pick up the same theme),
 *   2. the `<html>` class is swapped synchronously,
 *   3. the browser has applied styles AND painted (two rAFs),
 *   4. document fonts have settled (so text doesn't reflow mid-screenshot).
 *
 * On completion we set `data-theme-ready="<theme>"` on `<html>` and dispatch
 * a `myuno:theme-ready` CustomEvent. Capture scripts can either await the
 * returned Promise or wait for the attribute / event.
 */

import { logger } from '@/lib/logger';

export type ResolvedTheme = 'light' | 'dark';
const STORAGE_KEY = 'myuno-theme';
const READY_ATTR = 'data-theme-ready';
const READY_EVENT = 'myuno:theme-ready';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function applyTheme(theme: ResolvedTheme): Promise<ResolvedTheme> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return theme;
  }

  const root = document.documentElement;

  // 1. Persist first so any reload during the swap stays consistent.
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode / quota — ignore, the class swap below still applies.
  }

  // 2. Swap class synchronously. Mark not-ready until paint settles.
  root.removeAttribute(READY_ATTR);
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  // NOTE: We intentionally do NOT dispatch a synthetic `storage` event here.
  // Browsers only fire `storage` events in OTHER tabs, never in the tab that
  // wrote the value. The ThemeProvider already drives applyTheme from its own
  // state; dispatching here caused a feedback loop where the storage handler
  // would re-set state and occasionally race auth hydration, producing the
  // "theme flips on its own" bug. Cross-tab sync still works via the real
  // browser-fired `storage` event.

  // 4. Wait for style recalc + paint.
  await nextFrame();
  await nextFrame();

  // 5. Wait for fonts so screenshots don't catch a FOUT mid-swap.
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-fatal.
    }
  }

  root.setAttribute(READY_ATTR, theme);
  window.dispatchEvent(new CustomEvent(READY_EVENT, { detail: { theme } }));
  logger.log(`[myUNO] theme ready: ${theme}`);
  return theme;
}

/**
 * Resolves the next time the theme is fully applied. Useful when another
 * caller (e.g. the in-app theme toggle) initiates the change.
 */
export function whenThemeReady(theme?: ResolvedTheme): Promise<ResolvedTheme> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(theme ?? 'light');
    const current = document.documentElement.getAttribute(READY_ATTR) as ResolvedTheme | null;
    if (current && (!theme || current === theme)) return resolve(current);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ theme: ResolvedTheme }>).detail;
      if (!theme || detail?.theme === theme) {
        window.removeEventListener(READY_EVENT, handler);
        resolve(detail?.theme ?? theme ?? 'light');
      }
    };
    window.addEventListener(READY_EVENT, handler);
  });
}

// Expose on window for snapshot tooling (Playwright/browser tools).
declare global {
  interface Window {
    __myunoSetTheme?: (theme: ResolvedTheme) => Promise<ResolvedTheme>;
    __myunoThemeReady?: (theme?: ResolvedTheme) => Promise<ResolvedTheme>;
  }
}

if (typeof window !== 'undefined') {
  window.__myunoSetTheme = applyTheme;
  window.__myunoThemeReady = whenThemeReady;
}
