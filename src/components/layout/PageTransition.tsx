import React, { forwardRef } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { getNavigationDirection, NavigationDirection } from '@/hooks/useNavigationDirection';

interface PageTransitionProps {
  children: React.ReactNode;
}

const getVariants = (direction: NavigationDirection): Variants => {
  switch (direction) {
    case 'right':
      // No scale — keeps route-level spinners from visually "resizing" at enter
      return {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
      };
    case 'left':
      return {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
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

const reducedMotionTransition = {
  type: 'tween' as const,
  ease: 'linear' as const,
  duration: 0,
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
        transition={reduceMotion ? reducedMotionTransition : pageTransition}
        className="min-h-full w-full min-w-0 will-change-transform"
      >
        {children}
      </motion.div>
    );
  }
);
