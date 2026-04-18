/**
 * Shared layout alignment between ecosystem Property Hub (AppLayout) and newbuilds/developer.
 * Content max width: prefer ECOSYSTEM_PAGE_CONTAINER on light shell; newbuilds uses max-w-7xl — keep both readable on desktop.
 */
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

export const PROPERTY_VERTICAL_PAGE_GUTTER = ECOSYSTEM_PAGE_CONTAINER;

/** Secondary nav / back links — same intent as ecosystem muted links */
export const PROPERTY_VERTICAL_MUTED_LINK =
  'text-sm text-muted-foreground hover:text-foreground transition-colors';
