import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import { playSound } from "@/hooks/useSoundEffects";
import { getFeedbackSettings } from "@/hooks/useFeedbackSettings";
import { triggerRipple } from "@/hooks/useRipple";

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
     variants: {
      variant: {
        default: "bg-primary text-primary-foreground [box-shadow:var(--shadow-btn)] hover:[box-shadow:var(--shadow-btn-hover)] hover:bg-primary/90 hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground [box-shadow:var(--shadow-btn)] hover:[box-shadow:var(--shadow-btn-hover)] hover:bg-destructive/90 hover:-translate-y-0.5",
        outline: "glow-border bg-card text-foreground [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-none px-3",
        lg: "h-11 rounded-none px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, haptic = true, hapticStyle = 'light', onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        triggerRipple(e);
        const settings = getFeedbackSettings();
        if (haptic && settings.hapticEnabled) {
          triggerHaptic(hapticStyle);
        }
        if (settings.soundEnabled) {
          playSound('click');
        }
        onClick?.(e);
      },
      [haptic, hapticStyle, onClick]
    );
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
