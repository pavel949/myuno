import React, { forwardRef, ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHints } from '@/hooks/useHints';
import { cn } from '@/lib/utils';

interface SpotlightHintProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  showOnce?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  onDismiss?: () => void;
  delay?: number;
  pulseColor?: string;
}

export const SpotlightHint = forwardRef<HTMLDivElement, SpotlightHintProps>(
  function SpotlightHint(
    {
      id,
      title,
      description,
      children,
      showOnce = true,
      side = 'bottom',
      className,
      onDismiss,
      delay = 500,
      pulseColor = 'primary',
    },
    ref
  ) {
    const { showHint, dismissHint, isHintDismissed } = useHints();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (showOnce && isHintDismissed(id)) {
        return;
      }

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }, [id, showOnce, isHintDismissed, delay]);

    const handleDismiss = () => {
      setIsVisible(false);
      if (showOnce) {
        dismissHint(id);
      }
      onDismiss?.();
    };

    const tooltipPositionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
      top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-popover',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-popover',
      left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-popover',
      right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-popover',
    };

    return (
      <div ref={ref} className={cn('relative inline-flex', className)}>
        {/* Pulse animation ring */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 -m-1 rounded-lg pointer-events-none"
            >
              <div className={cn(
                "absolute inset-0 rounded-lg animate-pulse",
                `ring-2 ring-${pulseColor}/50`
              )} />
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-lg",
                  `ring-2 ring-${pulseColor}`
                )}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0, 0.5] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: side === 'top' ? 10 : side === 'bottom' ? -10 : 0, x: side === 'left' ? 10 : side === 'right' ? -10 : 0 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: side === 'top' ? 10 : side === 'bottom' ? -10 : 0, x: side === 'left' ? 10 : side === 'right' ? -10 : 0 }}
              className={cn(
                'absolute z-50 w-64',
                tooltipPositionClasses[side]
              )}
            >
              <div className="relative bg-popover border border-border rounded-lg shadow-lg p-3">
                {/* Arrow */}
                <div 
                  className={cn(
                    'absolute w-0 h-0 border-8',
                    arrowClasses[side]
                  )} 
                />
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={handleDismiss}
                  aria-label="Закрыть подсказку"
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Content */}
                <div className="pr-6">
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Got it button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs w-full"
                  onClick={handleDismiss}
                >
                  Понятно
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SpotlightHint.displayName = 'SpotlightHint';
