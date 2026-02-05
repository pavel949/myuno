/**
 * LifeSituationBadge - Floating context indicator
 * Per UX Contract §3.2: Display active context with dismiss (✕)
 * 
 * Example display: "Context: First Day in Phuket ✕"
 */
import React, { memo } from 'react';
import { X } from 'lucide-react';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LifeSituationBadgeProps {
  className?: string;
}

export const LifeSituationBadge = memo(function LifeSituationBadge({
  className,
}: LifeSituationBadgeProps) {
  const { activeCode, activeTitle, activeColor, clearLifeSituation } = useLifeSituationContext();

  if (!activeCode || !activeTitle) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-card border shadow-sm text-sm",
          className
        )}
        style={{
          borderColor: activeColor ? `${activeColor}40` : undefined,
        }}
      >
        <span className="text-muted-foreground text-xs">Context:</span>
        <span 
          className="font-medium"
          style={{ color: activeColor || undefined }}
        >
          {activeTitle}
        </span>
        <button
          onClick={clearLifeSituation}
          className={cn(
            "ml-1 p-0.5 rounded-full transition-colors",
            "hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
          )}
          aria-label="Clear life situation context"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
});
