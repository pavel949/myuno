import * as React from "react";

import { cn } from "@/lib/utils";
import { playSound, isTypingKey } from "@/hooks/useSoundEffects";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import { getFeedbackSettings } from "@/hooks/useFeedbackSettings";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableTypeSound?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableTypeSound = true, onKeyDown, ...props }, ref) => {
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <textarea
        className={cn(
          "ds-input flex min-h-[80px] min-w-0 w-full rounded-sm border border-input bg-card px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
