import React, { forwardRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { getNavigationDirection, NavigationDirection } from '@/hooks/useNavigationDirection';

interface PageTransitionProps {
  children: React.ReactNode;
}

const getSlideVariants = (direction: NavigationDirection): Variants => {
  const xOffset = direction === 'right' ? 50 : direction === 'left' ? -50 : 0;
  const exitXOffset = direction === 'right' ? -50 : direction === 'left' ? 50 : 0;
  
  return {
    initial: {
      opacity: 0,
      x: xOffset,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: exitXOffset,
      scale: 0.98,
    },
  };
};

// Fallback for non-tab navigation
const defaultVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.25,
};

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  function PageTransition({ children }, ref) {
    const direction = getNavigationDirection();
    const variants = direction === 'none' ? defaultVariants : getSlideVariants(direction);
    
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={pageTransition}
        className="min-h-full will-change-transform"
      >
        {children}
      </motion.div>
    );
  }
);
