/**
 * PageTabs — universal page-level tabs.
 * Thin wrapper over shadcn Tabs with sticky behaviour and overflow scroll on mobile.
 */
import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface PageTab<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageTabsProps<T extends string> {
  tabs: PageTab<T>[];
  value: T;
  onChange: (v: T) => void;
  sticky?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  sticky = false,
  className,
  children,
}: PageTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as T)}
      className={cn('mb-[var(--section-gap)]', className)}
    >
      <div
        className={cn(
          'overflow-x-auto scrollbar-none -mx-[var(--page-padding-x)] px-[var(--page-padding-x)]',
          sticky && 'sticky top-0 z-20 bg-background/85 backdrop-blur-md py-2 border-b border-border/40',
        )}
      >
        <TabsList className="inline-flex w-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{t.label}</span>
                {t.badge !== undefined && t.badge !== 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {t.badge}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
