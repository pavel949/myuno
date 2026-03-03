import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniAppHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  /** @deprecated Gradients removed per Calm LifeOS manifest. Prop ignored. */
  gradientFrom?: string;
  /** @deprecated */
  gradientVia?: string;
  /** @deprecated */
  gradientTo?: string;
  className?: string;
}

export function MiniAppHero({
  icon: Icon,
  title,
  subtitle,
  backgroundImage,
  className,
}: MiniAppHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 bg-muted/30 border border-border/60",
        className
      )}
    >
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-6 h-6 text-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
