import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Use branded myUNO logo spinner instead of generic */
  variant?: 'default' | 'logo';
  label?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const sizePixels = { sm: 20, md: 32, lg: 48 };

const logoSizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className, variant = 'default', label = 'Loading' }, ref) => {
    if (variant === 'logo') {
      return (
        <div
          ref={ref}
          role="status" aria-label={label}
          className={cn(
            "animate-spin motion-reduce:animate-none rounded-none bg-gradient-to-br from-foreground via-primary to-foreground flex items-center justify-center font-bold text-primary-foreground [box-shadow:var(--shadow-elevation-3)]",
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
      <div ref={ref} role="status" aria-label={label} className={cn("flex items-center justify-center", className)}>
        <Loader2 aria-hidden="true" style={{ width: sizePixels[size], height: sizePixels[size] }} className={cn("animate-spin text-primary motion-reduce:animate-none", sizeClasses[size])} />
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  /** Use branded logo spinner */
  branded?: boolean;
  /** Only bootstrap/standalone gates own the viewport; retained shells use content. */
  scope?: 'viewport' | 'content';
}

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message, branded = false, scope = 'viewport' }, ref) => {
    // Render an exact visual match for the index.html `uno-splash` when no message is provided,
    // ensuring a seamless transition from the hardcoded HTML splash to the React loading state.
    if (!message && !branded) {
      return (
        <div
          ref={ref}
          className="uno-splash"
          data-loading-scope={scope}
          role="status"
          style={{ minHeight: scope === 'content' ? '12rem' : '100dvh', width: '100%', margin: 0, padding: 0 }}
          aria-label="Loading myUNO"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-loading-scope={scope}
        style={{ minHeight: scope === 'content' ? '12rem' : '60vh' }}
        className="flex-1 bg-background flex flex-col items-center justify-center gap-4 p-8"
      >
        <LoadingSpinner size="lg" variant={branded ? 'logo' : 'default'} label={message || 'Loading myUNO'} />
        {message && (
          <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
        )}
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';
