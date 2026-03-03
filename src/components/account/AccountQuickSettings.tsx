import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { cn } from '@/lib/utils';

export function AccountQuickSettings() {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isRu = language === 'ru';

  const themeOptions = [
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
    { value: 'system' as const, icon: Monitor },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        {isRu ? 'Настройки' : 'Settings'}
      </p>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">{isRu ? 'Тема' : 'Theme'}</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {themeOptions.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "p-1.5 transition-colors",
                theme === value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">{isRu ? 'Язык' : 'Language'}</span>
        <LanguageSwitcher size="sm" />
      </div>

      {/* Currency */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">{isRu ? 'Валюта' : 'Currency'}</span>
        <CurrencySwitcher size="sm" />
      </div>
    </div>
  );
}
