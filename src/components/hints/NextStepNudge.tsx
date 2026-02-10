import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ChevronUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHints } from '@/hooks/useHints';

interface NextStepNudgeProps {
  message: string;
  direction?: 'down' | 'right' | 'up';
  visible: boolean;
  hintId?: string;
  className?: string;
}

const directionIcons = {
  down: ChevronDown,
  right: ArrowRight,
  up: ChevronUp,
};

const bounceAnimation = {
  down: { y: [0, 5, 0] },
  right: { x: [0, 5, 0] },
  up: { y: [0, -5, 0] },
};

export function NextStepNudge({
  message,
  direction = 'down',
  visible,
  hintId,
  className,
}: NextStepNudgeProps) {
  const { isHintDismissed, dismissHint } = useHints();

  // If hintId provided and already dismissed, don't show
  if (hintId && isHintDismissed(hintId)) return null;

  const Icon = directionIcons[direction];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: direction === 'up' ? -8 : 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: direction === 'up' ? -8 : 8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-full',
            'bg-primary/10 text-primary border border-primary/20',
            'text-xs font-medium shadow-sm',
            'select-none pointer-events-none',
            className,
          )}
        >
          <span>{message}</span>
          <motion.span
            animate={bounceAnimation[direction]}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="shrink-0"
          >
            <Icon className="w-3.5 h-3.5" />
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
