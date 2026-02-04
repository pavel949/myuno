import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServiceDrawerFooter() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <div className="mt-auto border-t border-border/50 p-4">
      <div className="flex items-center justify-between">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium">
            {language === 'ru' ? 'English' : 'Русский'}
          </span>
        </Button>

        {/* Help */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => window.open('/help', '_blank')}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-xs font-medium">
            {language === 'ru' ? 'Помощь' : 'Help'}
          </span>
        </Button>
      </div>

      {/* Version */}
      <p className="text-[10px] text-muted-foreground text-center mt-3">
        myUNO v2.0 • Services Hub
      </p>
    </div>
  );
}
