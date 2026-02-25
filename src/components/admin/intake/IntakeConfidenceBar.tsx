import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface IntakeConfidenceBarProps {
  value: number; // 0-1
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function IntakeConfidenceBar({ value, showLabel = true, size = 'md' }: IntakeConfidenceBarProps) {
  const percentage = Math.round(value * 100);
  
  const getColor = () => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const getTextColor = () => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex-1 bg-muted rounded-full overflow-hidden",
        size === 'sm' ? "h-1.5" : "h-2"
      )}>
        <div 
          className={cn("h-full transition-all", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          "font-medium tabular-nums",
          size === 'sm' ? "text-xs" : "text-sm",
          getTextColor()
        )}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
