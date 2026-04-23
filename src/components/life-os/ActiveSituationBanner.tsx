/**
 * ActiveSituationBanner — Calm, minimal context indicator
 * Shows active life situation across all pages
 */
import React, { memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronRight } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

export const ActiveSituationBanner = memo(forwardRef<HTMLDivElement>(function ActiveSituationBanner(_props, ref) {
  const { activeCode, activeTitle, activeColor, clearLifeSituation } = useLifeSituationContext();
  const { data: situations } = useLifeSituations();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!activeCode || activeCode === 'browsing') return null;

  const activeSituation = situations?.find(s => s.code === activeCode);
  const iconName = activeSituation?.icon || 'compass';

  return (
    <div ref={ref} className="flex items-center gap-2.5 px-4 py-2 text-sm border-b border-border/50 bg-muted/30">
      {/* Icon */}
      <DynamicIcon name={iconName} className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

      {/* Title */}
      <button
        onClick={() => navigate(`/life/${activeCode}`)}
        className="flex-1 text-left truncate text-[13px] font-medium text-foreground hover:underline"
      >
        {activeTitle}
      </button>

      {/* Change */}
      <button
        onClick={() => navigate('/discover')}
        className="text-muted-foreground hover:text-foreground text-[11px] shrink-0 flex items-center gap-0.5"
      >
        {isRu ? 'Сменить' : 'Change'}
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Dismiss */}
      <button
        onClick={clearLifeSituation}
        className="p-1 -mr-1 rounded-none hover:bg-muted shrink-0"
        aria-label="Clear context"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}));

export default ActiveSituationBanner;
