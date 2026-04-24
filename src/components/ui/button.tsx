import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import { playSound } from "@/hooks/useSoundEffects";
import { getFeedbackSettings } from "@/hooks/useFeedbackSettings";

/**
 * Button — myUNO canonical Button component.
 *
 * Source of truth: docs/canonical/05-visual-design-system.md §8.1
 *
 * Strict rules from canon:
 *  - Four variants only: default (navy), outline (secondary), ghost, destructive.
 *  - radius: 0  (canon §5 — no rounded-{sm,md,lg,xl} on buttons).
 *  - No box-shadow, no -translate-y, no scale, no ripple, no glow.
 *  - Font weight 500 (medium), body 15px.
 *  - Min touch target 44px (canon §7.4).
 *
 * `link` variant kept for inline anchors (it's a text link, not a button surface).
 * Haptic + sound feedback retained — that's behaviour, not visual styling.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-[15px] font-medium leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary CTA — canon §8.1 Primary (navy): bg navy, white text, no border, no shadow.
        default:
          "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]",
        // Secondary — canon §8.1 Secondary (outline): transparent, navy text, 1.5px navy border.
        outline:
          "bg-transparent text-primary border-[1.5px] border-primary hover:bg-[hsl(var(--brand-navy-50))]",
        // Secondary surface — alternative for stacked secondary actions on light blocks.
        secondary:
          "bg-[hsl(var(--surface-raised))] text-foreground border border-border hover:bg-[hsl(var(--border-subtle))]",
        // Ghost — canon §8.1 Ghost: transparent, body text, used for nav/table actions.
        ghost:
          "bg-transparent text-[hsl(var(--text-body))] hover:bg-[hsl(var(--surface-raised))] hover:text-foreground",
        // Destructive — canon §8.1: transparent, red text, 1px red border.
        destructive:
          "bg-transparent text-destructive border border-destructive hover:bg-[hsl(var(--danger-bg))]",
        // Inline text link (not a button surface, kept for legacy callers).
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        // Default — canon: 44px touch target, padding 12×24.
        default: "h-11 px-6 py-3",
        // Small — for table actions / dense toolbars.
        sm: "h-9 px-4 text-sm",
        // Large — for sticky bottom CTAs on conversion forms.
        lg: "h-12 px-8",
        // Icon-only — square 44×44.
        icon: "h-11 w-11 p-0",
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
