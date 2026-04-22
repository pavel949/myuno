/**
 * Single contract for z-index and vertical offsets of floating UI above the
 * mobile bottom bar. Import these instead of ad-hoc `z-40` / `bottom-20`.
 *
 * Stacking (bottom → top): main content < compare strip < chat FAB < context FAB < PWA install < bottom nav.
 */
export const FLOATING = {
  /** Primary compare CTA (property & newbuilds) */
  compare: 'z-[50]',
  /** Global help / AI chat */
  chatFab: 'z-[40]',
  /** Contextual workspace FAB (+) */
  contextualFab: 'z-[70]',
  contextualOverlay: 'z-[60]',
  /** PWA “Install” pill */
  pwaInstall: 'z-[80]',
} as const;

/** All floaters that sit in the thumb zone use this vertical anchor. */
export const FLOATING_OFFSET = {
  /** Default strip above the mobile bottom bar (install, compare, marketing CTAs). */
  aboveBottomNav: 'bottom-[calc(var(--bottom-nav-h)+1rem)]',
  /**
   * Chat sits above the default floater row so it does not cover install/compare.
   * Tune if product adds another persistent right-edge control.
   */
  chatAboveStack: 'bottom-[calc(var(--bottom-nav-h)+4.5rem)]',
} as const;
