import * as React from "react";

import { cn } from "@/lib/utils";

// DS2.0 Card hierarchy variants (aligned with elevation scale)
type CardVariant = 'surface' | 'content' | 'interactive' | 'elevated';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const cardVariants: Record<CardVariant, string> = {
  surface: "bg-muted/30 dark:bg-muted/10 rounded-none",
  content: "bg-card border border-border/60 rounded-none [box-shadow:var(--shadow-elevation-2)]",
  interactive: "bg-card border border-border/60 rounded-none [box-shadow:var(--shadow-elevation-2)] hover:[box-shadow:var(--shadow-elevation-3)] transition-all duration-150 cursor-pointer",
  elevated: "bg-card border border-border/60 rounded-none [box-shadow:var(--shadow-elevation-4)]",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'content', ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        cardVariants[variant],
        "text-card-foreground",
        className
      )} 
      {...props} 
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-display text-base font-semibold leading-snug tracking-[-0.01em]", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
