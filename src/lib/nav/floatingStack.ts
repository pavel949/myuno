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
  /** Launcher dimensions and clearance share the responsive geometry tokens. */
  chatSize: 'w-[var(--floating-chat-size)] h-[var(--floating-chat-size)]',
  chatAboveStack: 'bottom-[calc(max(var(--bottom-nav-h,0px),var(--service-request-action-height,0px))+var(--floating-chat-gap))]',
  /** Keep final in-flow actions above the mobile navigation and chat launcher. */
  contentClearance: 'pb-[calc(max(var(--bottom-nav-h,0px),var(--service-request-action-height,0px))+var(--floating-chat-size)+var(--floating-chat-gap)+var(--layout-page-space-y))]',
  /** Keep the final form control above both the measured action bar and launcher. */
  requestContentClearance: 'pb-[calc(var(--service-request-action-height,0px)+var(--floating-chat-size)+var(--floating-chat-gap)+1rem)]',
} as const;
