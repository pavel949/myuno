/**
 * Motion Presets
 * 
 * Standardized animation configurations for consistent motion design.
 * Uses both CSS classes and Framer Motion variants.
 */

import type { Variants, Transition } from 'framer-motion';

// ============ CSS Class-based Animations ============

export const CARD_ANIMATIONS = {
  /** Image hover zoom - subtle 3% scale for elegance */
  imageHover: {
    className: 'transition-transform duration-300 group-hover:scale-[1.03]',
  },
  
  /** Card lift on hover - shadow + subtle translate */
  cardHover: {
    className: 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
  },
  
  /** Button press feedback */
  buttonPress: {
    className: 'active:scale-[0.98] transition-transform duration-100',
  },
  
  /** Icon bounce on parent hover */
  iconHover: {
    className: 'group-hover:scale-110 transition-transform duration-200',
  },
  
  /** Fade in with subtle upward motion */
  fadeInUp: {
    className: 'animate-fade-in',
  },
  
  /** Scale in from slightly smaller */
  scaleIn: {
    className: 'animate-scale-in',
  },
} as const;

// ============ Framer Motion Variants ============

/** Default transition preset - smooth and natural */
const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/** Card appearance animation */
export const cardAppearVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 8 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    }
  },
  exit: { 
    opacity: 0, 
    y: 8,
    transition: {
      duration: 0.15,
    }
  },
};

/** Staggered children animation */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 10 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    }
  },
};

/** Fade in variants */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

/** Scale in variants */
export const scaleInVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: defaultTransition,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 }
  },
};

/** Slide in from right */
export const slideInRightVariants: Variants = {
  initial: { 
    x: '100%', 
    opacity: 0 
  },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

/** Slide in from bottom */
export const slideInUpVariants: Variants = {
  initial: { 
    y: '100%', 
    opacity: 0 
  },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

/** Hover scale effect for cards */
export const hoverScaleVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    }
  },
  tap: { scale: 0.98 },
};

/** Image hover zoom (for use with whileHover) */
export const imageHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.03,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
};

// ============ Motion Config ============

/** Global motion configuration respecting user preferences */
export const motionConfig = {
  reducedMotion: 'user' as const,
};

/** Quick transition for micro-interactions */
export const quickTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/** Standard transition for most animations */
export const standardTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

/** Smooth transition for larger movements */
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

/** Spring transition for bouncy effects */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};
