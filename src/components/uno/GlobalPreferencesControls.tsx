import React from 'react';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { cn } from '@/lib/utils';

export interface GlobalPreferencesControlsProps {
  className?: string;
  /** Landing / compact headers use sm controls */
  size?: 'sm' | 'default';
  /** Auth screens rarely need currency before prices; default true */
  showCurrency?: boolean;
  /** Match WelcomeLanding: icon buttons for light/dark */
  themeVariant?: 'buttons' | 'dropdown';
}

/**
 * Single composition for theme + language + currency so shells and landings stay consistent.
 */
export function GlobalPreferencesControls({
  className,
  size = 'sm',
  showCurrency = true,
  themeVariant = 'dropdown',
}: GlobalPreferencesControlsProps) {
  return (
    <div
      className={cn('flex items-center gap-0.5 sm:gap-1', className)}
      data-testid="global-preferences-controls"
    >
      <ThemeSwitcher variant={themeVariant === 'buttons' ? 'buttons' : 'dropdown'} size={size} />
      <LanguageSwitcher size={size} />
      {showCurrency ? <CurrencySwitcher size={size} /> : null}
    </div>
  );
}
