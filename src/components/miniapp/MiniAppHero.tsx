import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniAppHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  className?: string;
}

export function MiniAppHero({
  icon: Icon,
  title,
  subtitle,
  backgroundImage,
  gradientFrom = 'from-primary/20',
  gradientVia = 'via-primary/10',
  gradientTo = 'to-background',
  className,
}: MiniAppHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        `bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`,
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
          <Icon className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium text-primary">{title}</span>
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
