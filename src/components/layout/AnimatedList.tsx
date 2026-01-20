import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const containerVariants = {
  hidden: { opacity: 1 }, // Keep visible to prevent flash
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 12,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export const AnimatedList: React.FC<AnimatedListProps> = ({ 
  children, 
  className = '',
  staggerDelay = 0.08,
}) => {
  const customVariants = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ 
  children, 
  className = '',
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Grid variant for card grids
export const AnimatedGrid: React.FC<AnimatedListProps> = ({ 
  children, 
  className = '',
  staggerDelay = 0.06,
}) => {
  const gridVariants = {
    hidden: { opacity: 1 }, // Changed from 0 to 1 to prevent flash
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Card variant with scale effect
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 8,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export const AnimatedCard: React.FC<AnimatedItemProps> = ({ 
  children, 
  className = '',
}) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="visible" // Start visible to prevent flash
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Fade in from different directions
export const FadeInUp: React.FC<AnimatedItemProps & { delay?: number; 'data-tour'?: string }> = ({ 
  children, 
  className = '',
  delay = 0,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FadeInScale: React.FC<AnimatedItemProps & { delay?: number }> = ({ 
  children, 
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
