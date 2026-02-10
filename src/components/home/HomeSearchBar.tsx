/**
 * HomeSearchBar — Airbnb-style search bar
 * Clean, inviting, centered. Opens Super Search.
 */
import React, { memo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const HomeSearchBar = memo(function HomeSearchBar() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button
      onClick={() => navigate('/search')}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-full border border-border shadow-sm bg-card hover:shadow-md transition-shadow active:scale-[0.99]"
    >
      <Search className="w-4.5 h-4.5 text-primary shrink-0" />
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-foreground">
          {isRu ? 'Куда вы хотите?' : 'Where to?'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Жильё · Услуги · Впечатления' : 'Stay · Services · Experiences'}
        </p>
      </div>
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-background">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          {isRu ? 'Пхукет' : 'Phuket'}
        </span>
      </div>
    </button>
  );
});
