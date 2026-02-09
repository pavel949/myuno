import React, { forwardRef, ReactNode } from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Step {
  text: string;
  icon?: LucideIcon;
}

interface EmptyStateGuideProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  steps?: Step[];
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'card';
}

export const EmptyStateGuide = forwardRef<HTMLDivElement, EmptyStateGuideProps>(
  function EmptyStateGuide(
    {
      icon: Icon,
      emoji,
      title,
      description,
      steps,
      actionLabel,
      onAction,
      actionHref,
      className,
      variant = 'default',
    },
    ref
  ) {
    const handleAction = () => {
      if (actionHref) {
        window.location.href = actionHref;
      } else if (onAction) {
        onAction();
      }
    };

    const variantClasses = {
      default: 'py-12 px-6',
      compact: 'py-6 px-4',
      card: 'py-8 px-6 bg-muted/30 rounded-xl border border-border',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center text-center',
          variantClasses[variant],
          className
        )}
      >
        {/* Icon/Emoji */}
        {Icon && (
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {description}
          </p>
        )}

        {/* Steps */}
        {steps && steps.length > 0 && (
          <div className="w-full max-w-xs mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Начните с:
            </p>
            <ol className="space-y-2 text-left">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="flex items-center gap-2">
                    {step.icon && <step.icon className="w-4 h-4 text-muted-foreground" />}
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Button */}
        {actionLabel && (onAction || actionHref) && (
          <Button
            onClick={handleAction}
            className="gap-2"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }
);

EmptyStateGuide.displayName = 'EmptyStateGuide';
