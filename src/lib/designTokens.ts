/**
 * myUNO DS2.0 — Design Tokens (Navy Premium)
 * 
 * Structured, semantic, scalable.
 * Aligned with tokens.json and index.css variables.
 */

// ═══ Elevation Scale ═══
export const ELEVATION = {
  0: 'shadow-none',
  1: '[box-shadow:var(--shadow-elevation-1)]',
  2: '[box-shadow:var(--shadow-elevation-2)]',
  3: '[box-shadow:var(--shadow-elevation-3)]',
  4: '[box-shadow:var(--shadow-elevation-4)]',
  5: '[box-shadow:var(--shadow-elevation-5)]',
} as const;

// ═══ Radius Scale ═══
export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',         // 4px — tags, chips
  md: 'rounded-md',         // 8px — badges, inputs
  lg: 'rounded-lg',         // 12px — buttons, compact cards
  xl: 'rounded-xl',         // 16px — cards
  '2xl': 'rounded-2xl',     // 20px — hero cards
  full: 'rounded-full',     // pills, avatars
} as const;

// ═══ Spacing (4px base grid) ═══
export const SPACING = {
  0: '0',
  1: '1',    // 4px
  2: '2',    // 8px
  3: '3',    // 12px
  4: '4',    // 16px
  5: '5',    // 20px
  6: '6',    // 24px
  8: '8',    // 32px
  10: '10',  // 40px
  12: '12',  // 48px
  16: '16',  // 64px
} as const;

// ═══ Typography Scale ═══
export const TYPOGRAPHY = {
  'display-lg': 'font-display text-[2.5rem] font-bold tracking-[-0.025em] leading-[1.15]',
  'display-md': 'font-display text-[2rem] font-bold tracking-[-0.025em] leading-[1.15]',
  'heading-lg': 'font-display text-2xl font-semibold tracking-[-0.02em] leading-[1.2]',
  'heading-md': 'font-display text-xl font-semibold tracking-[-0.015em] leading-[1.25]',
  'heading-sm': 'font-display text-lg font-semibold tracking-[-0.01em] leading-[1.3]',
  'body-lg': 'font-sans text-base leading-[1.65] tracking-[0.005em]',
  'body-md': 'font-sans text-sm leading-[1.6] tracking-[0.005em]',
  'body-sm': 'font-sans text-[0.8125rem] leading-[1.5] tracking-[0.01em]',
  'caption': 'font-sans text-xs font-medium leading-[1.4] tracking-[0.01em]',
  'overline': 'font-sans text-[0.625rem] font-semibold leading-[1.2] tracking-[0.08em] uppercase',
} as const;

// ═══ Motion ═══
export const MOTION = {
  instant: 'duration-50',
  fast: 'duration-100',
  normal: 'duration-150',
  slow: 'duration-250',
  entrance: 'duration-300',
  easeDefault: '[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]',
  easeEnter: '[transition-timing-function:cubic-bezier(0,0,0.2,1)]',
  easeExit: '[transition-timing-function:cubic-bezier(0.4,0,1,1)]',
  easeSpring: '[transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)]',
} as const;

// ═══ Composite Card Styles ═══
export const CARD = {
  surface: 'bg-muted/30 rounded-2xl',
  base: `bg-card border border-border/60 rounded-xl ${ELEVATION[2]}`,
  interactive: `bg-card border border-border/60 rounded-xl ${ELEVATION[2]} hover:${ELEVATION[3]} hover:-translate-y-0.5 transition-all duration-150 cursor-pointer`,
  elevated: `bg-card border border-border/60 rounded-xl ${ELEVATION[4]}`,
  featured: `bg-card border border-border/60 rounded-xl ${ELEVATION[4]}`,
} as const;

// ═══ Badge System ═══
export const BADGE = {
  primary: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  muted: 'bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  success: 'bg-success/20 text-success text-[10px] font-medium px-2 py-0.5 rounded-md',
  warning: 'bg-warning/20 text-warning text-[10px] font-medium px-2 py-0.5 rounded-md',
  danger: 'bg-destructive/20 text-destructive text-[10px] font-medium px-2 py-0.5 rounded-md',
  info: 'bg-info/20 text-info text-[10px] font-medium px-2 py-0.5 rounded-md',
  new: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  hot: 'bg-foreground text-background text-[10px] font-medium px-2 py-0.5 rounded-md',
  sale: 'bg-destructive text-destructive-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  featured: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  discount: 'bg-destructive text-destructive-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  tour: 'bg-primary/80 text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  activity: 'bg-muted text-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  type: 'bg-muted text-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
  urgent: 'bg-destructive text-destructive-foreground text-[10px] font-medium px-2 py-0.5 rounded-md',
} as const;

// ═══ Image Styles ═══
export const IMAGE = {
  hover: 'w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]',
  static: 'w-full h-full object-cover',
  container: 'relative overflow-hidden rounded-lg',
} as const;

// ═══ Aspect Ratios ═══
export const ASPECT = {
  experience: 'aspect-[4/3]',
  product: 'aspect-square',
  hero: 'aspect-[16/9]',
  compact: 'aspect-[3/2]',
  portrait: 'aspect-[3/4]',
} as const;

// ═══ Carousel Card Widths ═══
export const CAROUSEL_WIDTH = {
  hero: 'w-72',
  medium: 'w-64',
  standard: 'w-56',
  compact: 'w-48',
} as const;

// ═══ Backward-compatible exports ═══
// These maintain compat with existing component imports
export const DESIGN_TOKENS = {
  radius: {
    card: 'rounded-xl',
    cardCompact: 'rounded-lg',
    button: 'rounded-lg',
    badge: 'rounded-md',
    pill: 'rounded-full',
    input: 'rounded-lg',
    image: 'rounded-lg',
  },
  shadow: {
    none: ELEVATION[0],
    card: ELEVATION[2],
    cardHover: ELEVATION[3],
    elevated: ELEVATION[4],
  },
  spacing: {
    cardPadding: 'p-4',
    cardPaddingCompact: 'p-3',
    cardPaddingTight: 'p-2',
    sectionGap: 'gap-4',
    itemGap: 'gap-3',
    itemGapTight: 'gap-2',
  },
  text: {
    caption: 'text-[10px]',
    small: 'text-xs',
    body: 'text-sm',
    title: 'text-base',
    heading: 'text-lg',
    display: 'text-xl',
  },
  imageHover: 'group-hover:scale-[1.02]',
  imageTransition: 'transition-transform duration-200',
  transition: {
    fast: 'transition-all duration-100',
    normal: 'transition-all duration-150',
    slow: 'transition-all duration-200',
    image: 'transition-transform duration-200',
  },
  card: CARD,
  buttonPress: 'active:scale-[0.97]',
} as const;

export const CARD_STYLES = {
  content: `${CARD.base} overflow-hidden group`,
  interactive: `${CARD.interactive} overflow-hidden group`,
  compact: `${CARD.base} overflow-hidden group`,
  featured: `${CARD.featured} overflow-hidden group`,
} as const;

export const IMAGE_STYLES = IMAGE;
export const BADGE_STYLES = BADGE;
export const BADGE_SYSTEM = BADGE;
export const CARD_HEIGHTS = ASPECT;
export const CAROUSEL_CARD_WIDTHS = CAROUSEL_WIDTH;
export const CAROUSEL_IMAGE_HEIGHTS = {
  hero: 'h-40',
  medium: 'h-36',
  standard: 'h-32',
} as const;

// Type exports
export type ElevationLevel = keyof typeof ELEVATION;
export type RadiusToken = keyof typeof RADIUS;
export type TypographyToken = keyof typeof TYPOGRAPHY;
export type DesignTokens = typeof DESIGN_TOKENS;
