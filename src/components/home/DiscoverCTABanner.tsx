/**
 * DiscoverCTABanner — Focused CTA for property management services
 * Directs users to discover core services.
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

export const DiscoverCTABanner = memo(function DiscoverCTABanner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button
      onClick={() => { triggerHaptic('light'); navigate('/discover'); }}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl",
        "bg-gradient-to-r from-primary/10 to-accent/10",
        "border border-primary/20 hover:border-primary/40",
        "hover:shadow-md active:scale-[0.99] transition-all duration-200",
        "text-left group touch-manipulation"
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Home className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground">
          {isRu ? 'Управление недвижимостью' : 'Property Management'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRu ? 'Клининг • Трансферы • Аренда авто' : 'Cleaning • Transfers • Car Rental'}
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-primary/60 shrink-0 group-hover:translate-x-1 group-hover:text-primary transition-all" />
    </button>
  );
});
