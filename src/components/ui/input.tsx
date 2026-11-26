import * as React from "react";

import { cn } from "@/lib/utils";
import { playSound, isTypingKey } from "@/hooks/useSoundEffects";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import { getFeedbackSettings } from "@/hooks/useFeedbackSettings";

export interface InputProps extends React.ComponentProps<"input"> {
  enableTypeSound?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, enableTypeSound = true, onKeyDown, ...props }, ref) => {
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (enableTypeSound && isTypingKey(e)) {
          const settings = getFeedbackSettings();
          if (settings.typingSoundEnabled) {
            playSound('type');
          }
          if (settings.hapticEnabled) {
            triggerHaptic('light');
          }
        }
        onKeyDown?.(e);
      },
      [enableTypeSound, onKeyDown]
    );

    return (
      <input
        type={type}
        className={cn(
          "ds-input flex h-11 min-w-0 w-full rounded-sm border border-input bg-card px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
