import React, { forwardRef, ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHints } from '@/hooks/useHints';
import { cn } from '@/lib/utils';

interface CoachmarkProps {
  id: string;
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  color?: 'primary' | 'destructive' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  showOnce?: boolean;
  onClick?: () => void;
  className?: string;
  label?: string;
}

const positionClasses = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const colorClasses = {
  primary: 'bg-primary',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
};

export const Coachmark = forwardRef<HTMLDivElement, CoachmarkProps>(
  function Coachmark(
    {
      id,
      children,
      position = 'top-right',
      color = 'primary',
      size = 'md',
      showOnce = true,
      onClick,
      className,
      label,
    },
    ref
  ) {
    const { showHint, dismissHint, isHintDismissed } = useHints();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (showOnce && isHintDismissed(id)) {
        return;
      }
      setIsVisible(true);
    }, [id, showOnce, isHintDismissed]);

    const handleClick = () => {
      if (showOnce) {
        dismissHint(id);
        setIsVisible(false);
      }
      onClick?.();
    };

    return (
      <div 
        ref={ref} 
        className={cn('relative inline-flex', className)}
        onClick={handleClick}
      >
        {children}
        
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                'absolute z-10 pointer-events-none',
                positionClasses[position]
              )}
            >
              {/* Main dot */}
              <div
                className={cn(
                  'rounded-full shadow-sm',
                  sizeClasses[size],
                  colorClasses[color]
                )}
              />
              
              {/* Pulse animation */}
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-full',
                  colorClasses[color]
                )}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Label (optional) */}
              {label && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded bg-popover border border-border shadow-sm',
                    position.includes('right') ? 'right-full mr-2' : 'left-full ml-2'
                  )}
                >
                  {label}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Coachmark.displayName = 'Coachmark';
