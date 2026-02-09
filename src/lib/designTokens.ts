/**
 * Centralized Design Tokens — Calm LifeOS System
 * 
 * Minimal, trust-first visual language.
 * No gradients, no glass effects, no decorative shadows.
 */

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
    none: 'shadow-none',
    card: 'shadow-sm',
    cardHover: 'shadow-md',
    elevated: 'shadow-lg',
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
  
  card: {
    surface: 'bg-muted/30',
    base: 'bg-card border border-border/60 shadow-sm',
    interactive: 'bg-card border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer',
    elevated: 'bg-card border border-border/60 shadow-lg',
    featured: 'bg-card border border-border/60 shadow-lg',
  },
  
  buttonPress: 'active:scale-[0.97]',
} as const;

// Composite styles
export const CARD_STYLES = {
  content: `${DESIGN_TOKENS.card.base} ${DESIGN_TOKENS.radius.card} overflow-hidden group`,
  interactive: `${DESIGN_TOKENS.card.interactive} ${DESIGN_TOKENS.radius.card} overflow-hidden group`,
  compact: `${DESIGN_TOKENS.card.base} ${DESIGN_TOKENS.radius.cardCompact} overflow-hidden group`,
  featured: `${DESIGN_TOKENS.card.featured} ${DESIGN_TOKENS.radius.card} overflow-hidden group`,
} as const;

export const IMAGE_STYLES = {
  hover: `w-full h-full object-cover ${DESIGN_TOKENS.imageTransition} ${DESIGN_TOKENS.imageHover}`,
  static: 'w-full h-full object-cover',
  container: `relative overflow-hidden ${DESIGN_TOKENS.radius.image}`,
} as const;

export const BADGE_STYLES = {
  primary: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5',
  muted: 'bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5',
  new: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5',
  hot: 'bg-foreground text-background text-[10px] font-medium px-2 py-0.5',
  discount: 'bg-destructive text-destructive-foreground text-[10px] font-medium px-2 py-0.5',
} as const;

export const BADGE_SYSTEM = {
  new: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5',
  hot: 'bg-foreground text-background text-[10px] font-medium px-2 py-0.5',
  sale: 'bg-destructive text-destructive-foreground text-[10px] font-medium px-2 py-0.5',
  featured: 'bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5',
  type: 'bg-muted text-foreground text-[10px] font-medium px-2 py-0.5',
  urgent: 'bg-destructive text-destructive-foreground text-[10px] font-medium px-2 py-0.5',
  tour: 'bg-primary/80 text-primary-foreground text-[10px] font-medium px-2 py-0.5',
  activity: 'bg-muted text-foreground text-[10px] font-medium px-2 py-0.5',
} as const;

export const CARD_HEIGHTS = {
  experience: 'aspect-[4/3]',
  product: 'aspect-square',
  hero: 'aspect-[16/9]',
  compact: 'aspect-[3/2]',
} as const;

export const CAROUSEL_CARD_WIDTHS = {
  hero: 'w-72',
  medium: 'w-64',
  standard: 'w-56',
  compact: 'w-48',
} as const;

export const CAROUSEL_IMAGE_HEIGHTS = {
  hero: 'h-40',
  medium: 'h-36',
  standard: 'h-32',
} as const;

// Type exports
export type DesignTokens = typeof DESIGN_TOKENS;
export type CardStyles = typeof CARD_STYLES;
export type ImageStyles = typeof IMAGE_STYLES;
export type BadgeStyles = typeof BADGE_STYLES;
export type BadgeSystem = typeof BADGE_SYSTEM;
export type CardHeights = typeof CARD_HEIGHTS;
export type CarouselCardWidths = typeof CAROUSEL_CARD_WIDTHS;
