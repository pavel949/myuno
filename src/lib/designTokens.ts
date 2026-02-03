/**
 * Centralized Design Tokens
 * 
 * Single source of truth for all visual design decisions.
 * Import and use these tokens instead of raw Tailwind classes.
 */

export const DESIGN_TOKENS = {
  // ============ Border Radius ============
  radius: {
    card: 'rounded-2xl',          // 16px - all content cards
    cardCompact: 'rounded-xl',    // 12px - compact cards
    button: 'rounded-lg',          // 8px - buttons
    badge: 'rounded-md',           // 6px - badges
    pill: 'rounded-full',          // circular elements
    input: 'rounded-xl',           // 12px - inputs
    image: 'rounded-xl',           // 12px - images inside cards
  },
  
  // ============ Shadows ============
  shadow: {
    none: 'shadow-none',           // flat
    card: 'shadow-sm',             // default cards
    cardHover: 'shadow-md',        // hover state
    elevated: 'shadow-lg',         // modals, dropdowns
    float: 'shadow-xl',            // FAB, hero elements
  },
  
  // ============ Spacing (8px grid) ============
  spacing: {
    cardPadding: 'p-4',            // 16px
    cardPaddingCompact: 'p-3',     // 12px
    cardPaddingTight: 'p-2',       // 8px
    sectionGap: 'gap-4',           // 16px between sections
    itemGap: 'gap-3',              // 12px between items
    itemGapTight: 'gap-2',         // 8px tight spacing
  },
  
  // ============ Typography ============
  text: {
    caption: 'text-[10px]',        // badges, meta info
    small: 'text-xs',              // 12px - secondary info
    body: 'text-sm',               // 14px - default body
    title: 'text-base',            // 16px - card titles
    heading: 'text-lg',            // 18px - section headings
    display: 'text-xl',            // 20px - page titles
  },
  
  // ============ Image Behavior ============
  imageHover: 'group-hover:scale-[1.03]',
  imageTransition: 'transition-transform duration-300',
  
  // ============ Transitions ============
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
    image: 'transition-transform duration-300',
  },
  
  // ============ Card Variants ============
  card: {
    base: 'bg-card border border-border',
    interactive: 'bg-card border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    elevated: 'bg-card border border-border shadow-sm',
    featured: 'bg-card border border-border shadow-lg',
  },
  
  // ============ Button Behavior ============
  buttonPress: 'active:scale-[0.98]',
  
  // ============ Icon Animation ============
  iconHover: 'group-hover:scale-110 transition-transform duration-200',
  
} as const;

// ============ Composite Styles ============
// Pre-composed class strings for common patterns

export const CARD_STYLES = {
  /** Standard content card with hover effect */
  content: `${DESIGN_TOKENS.card.base} ${DESIGN_TOKENS.radius.card} ${DESIGN_TOKENS.shadow.card} overflow-hidden group`,
  
  /** Interactive card that lifts on hover */
  interactive: `${DESIGN_TOKENS.card.interactive} ${DESIGN_TOKENS.radius.card} overflow-hidden group`,
  
  /** Compact variant for dense layouts */
  compact: `${DESIGN_TOKENS.card.base} ${DESIGN_TOKENS.radius.cardCompact} overflow-hidden group`,
  
  /** Featured/hero card with prominent shadow */
  featured: `${DESIGN_TOKENS.card.featured} ${DESIGN_TOKENS.radius.card} overflow-hidden group`,
} as const;

export const IMAGE_STYLES = {
  /** Standard image with hover zoom */
  hover: `w-full h-full object-cover ${DESIGN_TOKENS.imageTransition} ${DESIGN_TOKENS.imageHover}`,
  
  /** Static image without hover effect */
  static: 'w-full h-full object-cover',
  
  /** Image container with rounded corners */
  container: `relative overflow-hidden ${DESIGN_TOKENS.radius.image}`,
} as const;

export const BADGE_STYLES = {
  /** Primary badge (NEW, Featured) */
  primary: 'bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 shadow-sm',
  
  /** Hot/Popular badge */
  hot: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm',
  
  /** New badge */
  new: 'bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm',
  
  /** Discount badge */
  discount: 'bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm',
  
  /** Subtle/muted badge */
  muted: 'bg-background/80 backdrop-blur-sm text-foreground text-[10px] px-2 py-0.5',
} as const;

// ============ Badge System ============
export const BADGE_SYSTEM = {
  new: 'bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm',
  hot: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm',
  sale: 'bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm',
  featured: 'bg-gradient-to-r from-primary to-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm',
  type: 'bg-muted text-foreground text-[10px] font-medium px-2 py-0.5',
  urgent: 'bg-destructive text-destructive-foreground text-[10px] font-semibold px-2 py-0.5 animate-pulse',
  tour: 'bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5',
  activity: 'bg-cyan-500 text-white text-[10px] font-medium px-2 py-0.5',
} as const;

// ============ Card Heights (Aspect Ratios) ============
export const CARD_HEIGHTS = {
  experience: 'aspect-[4/3]',     // Tours, activities
  product: 'aspect-square',        // Products, marketplace
  hero: 'aspect-[16/9]',           // Hero/featured cards
  compact: 'aspect-[3/2]',         // Compact horizontal
} as const;

// ============ Carousel Card Widths ============
export const CAROUSEL_CARD_WIDTHS = {
  hero: 'w-80',           // 320px - featured first card
  standard: 'w-64',       // 256px - regular cards
  compact: 'w-56',        // 224px - tight layouts
} as const;

// Type exports for TypeScript support
export type DesignTokens = typeof DESIGN_TOKENS;
export type CardStyles = typeof CARD_STYLES;
export type ImageStyles = typeof IMAGE_STYLES;
export type BadgeStyles = typeof BADGE_STYLES;
export type BadgeSystem = typeof BADGE_SYSTEM;
export type CardHeights = typeof CARD_HEIGHTS;
export type CarouselCardWidths = typeof CAROUSEL_CARD_WIDTHS;
