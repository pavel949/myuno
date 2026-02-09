/**
 * ActiveSituationBanner — P0.2 Visibility
 * Shows the active life situation context across all pages.
 * Allows changing or dismissing the context.
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ActiveSituationBanner = memo(function ActiveSituationBanner() {
  const { activeCode, activeTitle, activeColor, clearLifeSituation } = useLifeSituationContext();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!activeCode || activeCode === 'browsing') return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs font-medium border-b"
      style={{
        backgroundColor: activeColor ? `${activeColor}08` : undefined,
        borderBottomColor: activeColor ? `${activeColor}20` : undefined,
      }}
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: activeColor || 'hsl(var(--primary))' }}
      />
      <button
        onClick={() => navigate(`/life-flow/${activeCode}`)}
        className="flex-1 text-left truncate hover:underline"
        style={{ color: activeColor || undefined }}
      >
        {activeTitle}
      </button>
      <button
        onClick={() => navigate('/')}
        className="text-muted-foreground hover:text-foreground text-[10px] shrink-0"
      >
        {isRu ? 'Сменить' : 'Change'}
        <ChevronRight className="w-3 h-3 inline" />
      </button>
      <button
        onClick={clearLifeSituation}
        className="p-0.5 rounded hover:bg-muted shrink-0"
        aria-label="Clear context"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
});

export default ActiveSituationBanner;
