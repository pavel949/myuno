/**
 * Single contract for z-index and vertical offsets of floating UI above the
 * mobile bottom bar. Import these instead of ad-hoc `z-40` / `bottom-20`.
 *
 * After the 2026-06 contact-surface cleanup there is **one** global FAB
 * (`UnifiedChatFAB`). PWA install, WhatsApp/Telegram/Line CTAs all live inside
 * its drawer — no parallel floaters on the right edge.
 *
 * Stacking (bottom → top): main content < compare strip < chat FAB < context FAB.
 */
export const FLOATING = {
  /** Primary compare CTA (property & newbuilds). */
  compare: 'z-[50]',
  /** Global unified chat (AI + human contacts + install). The only persistent FAB. */
  chatFab: 'z-[55]',
  /** Contextual workspace FAB (+) on wizard/list pages. */
  contextualFab: 'z-[70]',
  contextualOverlay: 'z-[60]',
} as const;

/** All floaters that sit in the thumb zone use this vertical anchor. */
export const FLOATING_OFFSET = {
  /** Default strip above the mobile bottom bar (compare strip, contextual FAB). */
  aboveBottomNav: 'bottom-[calc(var(--bottom-nav-h)+1rem)]',
  /**
   * Chat FAB sits a bit higher than the default row so it does not collide
   * with the compare strip on property pages.
   */
  chatAboveStack: 'bottom-[calc(var(--bottom-nav-h)+1rem)]',
} as const;
