/**
 * Shared layout primitives for cross-vertical UX consistency.
 * Keep domain-specific visuals, but align spacing, typography, and shell behavior.
 */
export const ECOSYSTEM_SHELL = "min-h-screen bg-background flex flex-col max-w-full min-w-0 overflow-x-clip overflow-y-auto";

/** Single source for horizontal bounds: main column + AppHeader row (same grid = no “double frame”). */
export const ECOSYSTEM_PAGE_CONTAINER = "w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10";

/** Use for sticky app chrome so header content aligns with `<main>` below. */
export const ECOSYSTEM_HEADER_INNER = ECOSYSTEM_PAGE_CONTAINER;

/** Opt-in marketing frame aligned with public chrome; catalog/form bounds stay domain-owned. */
export const PUBLIC_CONTENT_LAYOUT = {
  marketing: ECOSYSTEM_PAGE_CONTAINER,
} as const;

export const ECOSYSTEM_MAIN_SPACING = "space-y-4 md:space-y-6";

export const ECOSYSTEM_HEADER_TITLE = "text-lg md:text-xl font-semibold font-display tracking-tight break-words";
export const ECOSYSTEM_HEADER_SUBTITLE = "text-xs md:text-sm text-muted-foreground break-words";

export const ECOSYSTEM_STICKY_SURFACE = "bg-background/95 border-b border-border/50";

