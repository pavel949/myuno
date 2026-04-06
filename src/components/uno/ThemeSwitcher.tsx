import React from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'cards';
  size?: 'sm' | 'default';
  className?: string;
}

export function ThemeSwitcher({ variant = 'dropdown', size = 'default', className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const themes = [
    { 
      value: 'light' as const, 
      icon: Sun, 
      label: language === 'ru' ? 'Светлая' : 'Light',
      shortLabel: language === 'ru' ? 'Свет' : 'Light'
    },
    {
      value: 'dark' as const,
      icon: Moon,
      label: language === 'ru' ? 'Тёмная' : 'Dark',
      shortLabel: language === 'ru' ? 'Тёмный' : 'Dark'
    },
    { 
      value: 'system' as const, 
      icon: Monitor, 
      label: language === 'ru' ? 'Система' : 'System',
      shortLabel: language === 'ru' ? 'Авто' : 'Auto'
    },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  // Default dropdown style (consistent with other switchers)
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1.5 rounded-md",
              "bg-secondary/60 hover:bg-secondary text-foreground",
              "text-xs font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              size === 'sm' && "px-1.5 py-1 text-[11px]",
              className
            )}
          >
            <CurrentIcon className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="min-w-[140px] bg-popover border border-border [box-shadow:var(--shadow-elevation-3)] z-50"
        >
          {themes.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <t.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{t.label}</span>
              </div>
              {theme === t.value && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Inline buttons variant
  if (variant === 'buttons') {
    return (
      <div className={cn("flex bg-secondary/50 rounded-lg p-0.5", className)}>
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              theme === t.value 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.shortLabel}</span>
          </button>
        ))}
      </div>
    );
  }

  // Cards variant for settings pages
  return (
    <div className={cn("flex gap-2", className)}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={cn(
            "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
            theme === t.value 
              ? "bg-primary/10 border-primary text-primary" 
              : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <t.icon className="w-5 h-5" />
          <span className="text-xs font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
