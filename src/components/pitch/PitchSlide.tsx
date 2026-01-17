import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PitchSlideProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const transition = {
  x: { type: "spring" as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.4 }
};

export function PitchSlide({ children, className, dark = true }: PitchSlideProps) {
  return (
    <div
      className={cn(
        "w-full h-full min-h-[600px] flex flex-col items-center justify-center p-8 md:p-12",
        dark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" : "bg-background text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

interface AnimatedSlideProps {
  children: React.ReactNode;
  direction: number;
  className?: string;
  dark?: boolean;
}

export const AnimatedSlide = forwardRef<HTMLDivElement, AnimatedSlideProps>(
  function AnimatedSlide({ children, direction, className, dark = true }, ref) {
    return (
      <motion.div
        ref={ref}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="absolute inset-0"
      >
        <PitchSlide className={className} dark={dark}>
          {children}
        </PitchSlide>
      </motion.div>
    );
  }
);

export function SlideTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn("text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-4", className)}
    >
      {children}
    </motion.h1>
  );
}

export function SlideSubtitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("text-lg md:text-xl lg:text-2xl text-slate-300 text-center max-w-3xl", className)}
    >
      {children}
    </motion.p>
  );
}

export function SlideContent({ children, className, delay = 0.4 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("w-full max-w-5xl mt-8", className)}
    >
      {children}
    </motion.div>
  );
}
