import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'toggle' | 'dropdown' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LanguageSwitcher({
  variant = 'toggle',
  size = 'md',
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const sizeClasses = {
    sm: 'h-7 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-11 text-base',
  };

  if (variant === 'toggle') {
    return (
      <div
        className={cn(
          "inline-flex rounded-lg bg-secondary p-1",
          className
        )}
      >
        <button
          onClick={() => setLanguage('ru')}
          className={cn(
            "px-3 rounded-md font-medium transition-all duration-200",
            sizeClasses[size],
            language === 'ru'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🇷🇺 RU
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            "px-3 rounded-md font-medium transition-all duration-200",
            sizeClasses[size],
            language === 'en'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🇬🇧 EN
        </button>
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={cn("flex gap-2", className)}>
        <button
          onClick={() => setLanguage('ru')}
          className={cn(
            "px-4 rounded-lg font-medium transition-all duration-200 border",
            sizeClasses[size],
            language === 'ru'
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          )}
        >
          Русский
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            "px-4 rounded-lg font-medium transition-all duration-200 border",
            sizeClasses[size],
            language === 'en'
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          )}
        >
          English
        </button>
      </div>
    );
  }

  // Dropdown variant
  return (
    <button
      onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
      className={cn(
        "inline-flex items-center gap-2 px-3 rounded-lg font-medium",
        "bg-secondary text-foreground hover:bg-secondary/80 transition-colors",
        sizeClasses[size],
        className
      )}
    >
      <span>{language === 'ru' ? '🇷🇺' : '🇬🇧'}</span>
      <span>{language.toUpperCase()}</span>
    </button>
  );
}
