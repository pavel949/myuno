import React, { forwardRef } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { getNavigationDirection, NavigationDirection } from '@/hooks/useNavigationDirection';

interface PageTransitionProps {
  children: React.ReactNode;
}

const getVariants = (direction: NavigationDirection): Variants => {
  switch (direction) {
    case 'right':
      return {
        initial: { opacity: 0, x: 50, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -50, scale: 0.98 },
      };
    case 'left':
      return {
        initial: { opacity: 0, x: -50, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 50, scale: 0.98 },
      };
    case 'forward':
      // Push: new page slides in from right, old slides out left (iOS-style)
      return {
        initial: { opacity: 0, x: 80 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 },
      };
    case 'backward':
      // Pop: page slides in from left, old slides out right (iOS-style)
      return {
        initial: { opacity: 0, x: -80 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 30 },
      };
    default:
      return {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };
  }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.25,
};

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  function PageTransition({ children }, ref) {
    const reduceMotion = useReducedMotion();
    const direction = getNavigationDirection();
    const variants = getVariants(direction);

    // Avoid stuck invisible first paint (opacity: 0) when reduced motion is on or animation glitches
    return (
      <motion.div
        ref={ref}
        initial={reduceMotion ? false : 'initial'}
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
