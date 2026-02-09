import React, { memo } from 'react';
import { MapPin, AlertTriangle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';

/**
 * HeroBlock — Calm LifeOS header
 * Location + Greeting + Search + SOS
 * No branding noise, no marketing copy
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

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-foreground leading-tight">
          {getGreeting()}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isRu ? 'Чем можем помочь сегодня?' : 'How can we help today?'}
        </p>
      </div>

      {/* Search */}
      <div>
        <InlineSearch />
      </div>
    </div>
  );
});
