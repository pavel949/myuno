import React, { forwardRef, ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ContextualHintProps {
  id: string;
  content: ReactNode;
  children?: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  showIcon?: boolean;
  iconSize?: 'sm' | 'md' | 'lg';
  className?: string;
  contentClassName?: string;
  delayDuration?: number;
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const ContextualHint = forwardRef<HTMLDivElement, ContextualHintProps>(
  function ContextualHint(
    {
      id,
      content,
      children,
      side = 'top',
      align = 'center',
      showIcon = true,
      iconSize = 'sm',
      className,
      contentClassName,
      delayDuration = 300,
    },
    ref
  ) {
    const triggerContent = children ? (
      <span className={cn('inline-flex items-center gap-1', className)}>
        {children}
        {showIcon && (
          <HelpCircle 
            className={cn(
              iconSizes[iconSize],
              'text-muted-foreground hover:text-foreground transition-colors cursor-help'
            )} 
          />
        )}
      </span>
    ) : (
      <span className={cn('inline-flex', className)}>
        <HelpCircle 
          className={cn(
            iconSizes[iconSize],
            'text-muted-foreground hover:text-foreground transition-colors cursor-help'
          )} 
        />
      </span>
    );

    return (
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          <span 
            ref={ref as React.Ref<HTMLSpanElement>}
            className="inline-flex items-center"
            aria-describedby={`hint-${id}`}
          >
            {triggerContent}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          id={`hint-${id}`}
          side={side} 
          align={align}
          className={cn(
            'max-w-xs text-sm leading-relaxed',
            contentClassName
          )}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }
);

ContextualHint.displayName = 'ContextualHint';
