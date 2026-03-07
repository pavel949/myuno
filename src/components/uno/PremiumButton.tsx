import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';

const premiumButtonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "gradient-gold text-primary-foreground shadow-gold hover:[box-shadow:var(--shadow-elevation-3)] hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "text-foreground hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        glass: "glass text-foreground hover:bg-card/90 border-border/50",
        "glass-gold": "glass-gold text-primary hover:bg-primary/20",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-xl text-sm",
        sm: "h-9 px-4 rounded-lg text-sm",
        lg: "h-12 px-8 rounded-xl text-base",
        xl: "h-14 px-10 rounded-2xl text-lg",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        triggerRipple(e);
        const settings = getFeedbackSettings();
        if (settings.hapticEnabled) {
          triggerHaptic('light');
        }
        if (settings.soundEnabled) {
          playSound('click');
        }
        onClick?.(e);
      },
      [onClick]
    );
    
    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
