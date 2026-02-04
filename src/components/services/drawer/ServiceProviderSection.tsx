import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, Briefcase, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceProviderSectionProps {
  onNavigate: () => void;
}

export function ProviderSection({ onNavigate }: ServiceProviderSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleNav = (path: string) => {
    onNavigate();
    navigate(path);
  };

  return (
    <div className="py-1 border-t border-border/50">
      <div className="px-4 py-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {language === 'ru' ? 'Для специалистов' : 'For Professionals'}
        </span>
      </div>
      
      {/* Become a provider */}
      <button
        onClick={() => handleNav('/become-partner')}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3",
          "hover:bg-muted/50 active:bg-muted transition-colors"
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <span className="block text-sm font-medium">
            {language === 'ru' ? 'Стать мастером' : 'Become a Provider'}
          </span>
          <span className="block text-xs text-muted-foreground">
            {language === 'ru' ? 'Получайте заказы на myUNO' : 'Get orders on myUNO'}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      
      {/* Provider dashboard */}
      <button
        onClick={() => handleNav('/vendor')}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3",
          "hover:bg-muted/50 active:bg-muted transition-colors"
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5 text-muted-foreground" />
        </div>
        <span className="flex-1 text-sm font-medium text-left">
          {language === 'ru' ? 'Кабинет специалиста' : 'Provider Dashboard'}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
}
