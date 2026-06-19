import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MaintenanceToggle } from '@/components/maintenance/MaintenanceToggle';
import { cn } from '@/lib/utils';

export function DrawerFooter() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex flex-col gap-2">
        {/* Maintenance Toggle */}
        <MaintenanceToggle className="justify-between" />

        {/* Language Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-background rounded-none p-1 border border-border">
            {([
              { code: 'ru', flag: '🇷🇺', label: 'RU' },
              { code: 'en', flag: '🇬🇧', label: 'EN' },
              { code: 'th', flag: '🇹🇭', label: 'TH' },
            ] as const).map((lang) => (
              <Button
                key={lang.code}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs font-medium rounded-none transition-colors",
                  language === lang.code && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => setLanguage(lang.code)}
              >
                {lang.flag} {lang.label}
              </Button>
            ))}
          </div>
          
          {/* Version + Edition */}
          <span className="text-[10px] text-muted-foreground">
            myUNO · Phuket Edition
          </span>
        </div>

        {/* Slogan */}
        <p className="text-center text-[10px] text-muted-foreground italic">
          "The only app you need abroad"
        </p>
      </div>
    </div>
  );
}
