import React from 'react';
import { cn } from '@/lib/utils';

const CONTAINER = 'mx-auto w-full max-w-6xl px-5';

export function LandingContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(CONTAINER, className)}>{children}</div>;
}

export function LandingSection({
  border = true,
  className,
  children,
}: {
  border?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(border && 'border-b border-border/40', className)}
    >
      {children}
    </section>
  );
}

export function LandingHero({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto max-w-6xl px-5 pt-12 pb-16 sm:pt-20 sm:pb-24',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LandingTrustRow({
  items,
  isRu,
}: {
  items: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; en: string; ru: string }[];
  isRu: boolean;
}) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-muted-foreground">
      {items.map((t) => {
        const Icon = t.icon;
        return (
          <li key={t.en} className="inline-flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={2} />
            <span>{isRu ? t.ru : t.en}</span>
          </li>
        );
      })}
    </ul>
  );
}
