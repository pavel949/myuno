import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className }, ref) => {
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
}

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message }, ref) => {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-muted-foreground text-sm">{message}</p>
        )}
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';
