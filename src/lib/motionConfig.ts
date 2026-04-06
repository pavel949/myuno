import React from 'react';

/**
 * Motion configuration with reduced motion support
 * Respects user's prefers-reduced-motion setting
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Default transition that respects reduced motion
export const getTransition = (duration = 0.3) => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return { duration, ease: 'easeOut' };
};

// Spring transition that respects reduced motion
export const getSpringTransition = (stiffness = 300, damping = 30) => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return { type: 'spring', stiffness, damping };
};

// Fade variants with reduced motion support
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.2 }
  }
};

// Slide up variants with reduced motion support
export const slideUpVariants = {
  hidden: { 
    opacity: 0, 
    y: prefersReducedMotion() ? 0 : 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: prefersReducedMotion() ? 0 : -20,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.2 }
  }
};

// Scale variants with reduced motion support
export const scaleVariants = {
  hidden: { 
    opacity: 0, 
    scale: prefersReducedMotion() ? 1 : 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.2 }
  },
  exit: { 
    opacity: 0, 
    scale: prefersReducedMotion() ? 1 : 0.95,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.15 }
  }
};

// Stagger children configuration
export const getStaggerConfig = (staggerChildren = 0.05) => {
  if (prefersReducedMotion()) {
    return { staggerChildren: 0 };
  }
  return { staggerChildren };
};

// Page transition variants
export const pageTransitionVariants = {
  initial: { 
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 10
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: prefersReducedMotion() 
      ? { duration: 0 } 
      : { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    transition: prefersReducedMotion() ? { duration: 0 } : { duration: 0.2 }
  }
};

// Hook to get reduced motion preference reactively
export const useReducedMotion = (): boolean => {
  const isSSR = typeof window === 'undefined';

  const [reducedMotion, setReducedMotion] = React.useState(isSSR ? false : prefersReducedMotion());

  React.useEffect(() => {
    if (isSSR) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return reducedMotion;
};
