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
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
