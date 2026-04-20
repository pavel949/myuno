import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'toggle' | 'dropdown' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const languages = [
  { code: 'ru' as const, flag: '🇷🇺', name: 'Русский', shortName: 'RU' },
  { code: 'en' as const, flag: '🇬🇧', name: 'English', shortName: 'EN' },
  { code: 'th' as const, flag: '🇹🇭', name: 'ไทย', shortName: 'TH' },
];

export function LanguageSwitcher({
  variant = 'dropdown',
  size = 'md',
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Default dropdown style (consistent with other switchers)
  if (variant === 'dropdown' || variant === 'toggle') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1.5 rounded-md",
              "bg-secondary/60 hover:bg-secondary text-foreground",
              "text-xs font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              size === 'sm' && "px-1.5 py-1 text-[11px] min-h-[44px]",
              className
            )}
          >
            <span className="text-sm">{currentLang.flag}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="min-w-[140px] bg-popover border border-border [box-shadow:var(--shadow-elevation-3)] z-50"
        >
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onSelect={() => setLanguage(lang.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Buttons variant for settings pages
  return (
    <div className={cn("flex gap-2", className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl",
            "font-medium transition-all duration-200 border text-sm",
            language === lang.code
              ? "bg-primary/10 border-primary text-primary"
              : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <span>{lang.flag}</span>
          <span className="hidden sm:inline">{lang.name}</span>
          <span className="sm:hidden">{lang.shortName}</span>
        </button>
      ))}
    </div>
  );
}
