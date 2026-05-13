import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

export interface LandingChromeProps {
  isRu: boolean;
  /** Extra actions after global prefs (e.g. Sign in / Get started) */
  endSlot?: React.ReactNode;
  showCurrency?: boolean;
  themeVariant?: 'buttons' | 'dropdown';
}

/**
 * Sticky marketing header: wordmark + global prefs + optional auth CTAs (Welcome pattern).
 */
export function LandingChrome({
  isRu,
  endSlot,
  showCurrency = true,
  themeVariant = 'buttons',
}: LandingChromeProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <BrandWordmark />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <GlobalPreferencesControls
            size="sm"
            showCurrency={showCurrency}
            themeVariant={themeVariant}
          />
          {endSlot ?? (
            <>
              <Link
                to={APP_ROUTES.AUTH}
                className="hidden sm:inline-flex h-8 items-center rounded-none px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isRu ? 'Войти' : 'Sign in'}
              </Link>
              <Link
                to={`${APP_ROUTES.AUTH}?mode=signup`}
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-none px-3 text-[13px] font-semibold',
                  'bg-foreground text-background hover:bg-foreground/90 transition-colors',
                )}
              >
                {isRu ? 'Создать' : 'Get started'}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
