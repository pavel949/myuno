/**
 * Shared layout primitives for cross-vertical UX consistency.
 * Keep domain-specific visuals, but align spacing, typography, and shell behavior.
 */
export const ECOSYSTEM_SHELL = "min-h-screen bg-background flex flex-col max-w-full min-w-0 overflow-x-clip overflow-y-auto";

/** Single source for horizontal bounds: main column + AppHeader row (same grid = no “double frame”). */
export const ECOSYSTEM_PAGE_CONTAINER = "ds-frame ds-frame-wide";

/** Use for sticky app chrome so header content aligns with `<main>` below. */
export const ECOSYSTEM_HEADER_INNER = ECOSYSTEM_PAGE_CONTAINER;

/** Opt-in marketing frame aligned with public chrome; catalog/form bounds stay domain-owned. */
export const PUBLIC_CONTENT_LAYOUT = {
  marketing: ECOSYSTEM_PAGE_CONTAINER,
  catalogue: 'ds-frame ds-frame-catalogue',
  business: 'ds-frame ds-frame-workspace',
} as const;

/** Opt-in public page types; article, details, form and wizard frames stay unchanged. */
export function publicContentFrame(pathname: string): 'catalogue' | 'business' | 'default' {
  const path = pathname.replace(/\/$/, '');
  if (path === '/discover/services' || path === '/services' || path === '/property/search') return 'catalogue';
  if (path === '/for-business') return 'business';
  return 'default';
}
export const PUBLIC_CONTENT_WIDTH = {
  default: 'var(--layout-width-wide)',
  catalogue: 'var(--layout-width-catalogue)',
  business: 'var(--layout-width-workspace)',
} as const;
/** Actual cards and skeletons must occupy the same columns. */
export const PUBLIC_CATALOG_GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-6';

/** Marketing CTAs retain complete labels inside narrow cards and wrapped rows. */
export const MARKETING_ACTION_BUTTON = 'h-auto min-h-12 max-w-full whitespace-normal break-words px-4 py-3 leading-snug';
/** Anchor targets below consumer chrome use its observed height plus breathing room. */
export const PUBLIC_CONTENT_ANCHOR = 'scroll-mt-[calc(var(--consumer-header-height,0px)+1rem)]';

export const ECOSYSTEM_MAIN_SPACING = "space-y-4 md:space-y-6";

export const ECOSYSTEM_HEADER_TITLE = "text-lg md:text-xl font-semibold font-display tracking-tight break-words";
export const ECOSYSTEM_HEADER_SUBTITLE = "text-xs md:text-sm text-muted-foreground break-words";

export const ECOSYSTEM_STICKY_SURFACE = "bg-background/95 border-b border-border/50";

