import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Airbnb-style shimmer skeleton with smooth gradient animation
 * Replaces basic pulse with a more polished shimmer effect
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-muted relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      style={{ backgroundSize: '200% 100%' }}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

export { Skeleton };
