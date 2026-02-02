import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DrawerFooter() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex flex-col gap-2">
        {/* Language Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-background rounded-lg p-1 border border-border">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-3 text-xs font-medium rounded-md transition-colors",
                language === 'ru' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setLanguage('ru')}
            >
              🇷🇺 RU
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-3 text-xs font-medium rounded-md transition-colors",
                language === 'en' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setLanguage('en')}
            >
              🇬🇧 EN
            </Button>
          </div>
          
          {/* Version + Edition */}
          <span className="text-[10px] text-muted-foreground">
            Phuket Edition v1.0
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
