import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Use branded myUNO logo spinner instead of generic */
  variant?: 'default' | 'logo';
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const logoSizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className, variant = 'default' }, ref) => {
    if (variant === 'logo') {
      return (
        <div
          ref={ref}
          className={cn(
            "animate-spin rounded-xl bg-gradient-to-br from-[hsl(var(--icon-dark))] via-primary to-[hsl(var(--icon-dark))] flex items-center justify-center font-bold text-white shadow-lg",
            logoSizeClasses[size],
            className
          )}
          style={{ animationDuration: '1.2s' }}
        >
          U
        </div>
      );
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "animate-spin border-2 border-primary border-t-transparent rounded-full",
          sizeClasses[size],
          className
        )} 
      />
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  /** Use branded logo spinner */
  branded?: boolean;
}

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message, branded = true }, ref) => {
    return (
      <div 
        ref={ref} 
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
      >
        <LoadingSpinner size="lg" variant={branded ? 'logo' : 'default'} />
        {branded && (
          <h2 className="text-xl font-semibold text-foreground">myUNO</h2>
        )}
        {message && (
          <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
        )}
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';
