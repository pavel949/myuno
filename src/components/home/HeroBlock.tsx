import React, { memo } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';

/**
 * HeroBlock — Calm LifeOS header
 * Mobile: Location + Greeting + Search + SOS
 * Desktop: Large greeting only (search is in header)
 */
export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isRu ? 'Доброе утро' : 'Good morning';
    if (hour < 18) return isRu ? 'Добрый день' : 'Good afternoon';
    return isRu ? 'Добрый вечер' : 'Good evening';
  };

  return (
    <div className="space-y-4">
      {/* Top bar: Location + SOS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">{isRu ? 'Пхукет' : 'Phuket'}</span>
        </div>

        <Link 
          to="/sos" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/8 border border-destructive/20 hover:bg-destructive/12 active:scale-[0.97] transition-all"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-[11px] font-semibold text-destructive">SOS</span>
        </Link>
      </div>

      {/* Greeting — scales up on desktop */}
      <div>
        <h1 className="text-xl lg:text-3xl font-semibold text-foreground leading-tight">
          {getGreeting()}
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-0.5 lg:mt-1">
          {isRu ? 'Чем можем помочь сегодня?' : 'How can we help today?'}
        </p>
      </div>

      {/* Search — hidden on desktop (it's in the header) */}
      <div className="lg:hidden">
        <InlineSearch />
      </div>
    </div>
  );
});
