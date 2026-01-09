import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  variant?: 'buttons' | 'select';
  className?: string;
}

export function ThemeSwitcher({ variant = 'buttons', className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const themes = [
    { 
      value: 'light' as const, 
      icon: Sun, 
      label: language === 'ru' ? 'Светлая' : 'Light' 
    },
    { 
      value: 'dark' as const, 
      icon: Moon, 
      label: language === 'ru' ? 'Тёмная' : 'Dark' 
    },
    { 
      value: 'system' as const, 
      icon: Monitor, 
      label: language === 'ru' ? 'Система' : 'System' 
    },
  ];

  if (variant === 'buttons') {
    return (
      <div className={cn("flex bg-secondary rounded-xl p-1", className)}>
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              theme === t.value 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
    );
  }

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
              : "bg-secondary border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <t.icon className="w-5 h-5" />
          <span className="text-xs font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
