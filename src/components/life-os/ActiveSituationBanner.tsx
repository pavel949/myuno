/**
 * ActiveSituationBanner — P0.2 Visibility
 * Shows the active life situation context across all pages.
 * Redesigned for better visibility with color background and icon.
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ActiveSituationBanner = memo(function ActiveSituationBanner() {
  const { activeCode, activeTitle, activeColor, clearLifeSituation } = useLifeSituationContext();
  const { data: situations } = useLifeSituations();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!activeCode || activeCode === 'browsing') return null;

  // Find icon for the active situation
  const activeSituation = situations?.find(s => s.code === activeCode);
  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.Compass;
  };
  const Icon = activeSituation ? getIcon(activeSituation.icon) : LucideIcons.Compass;

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium border-b relative"
      style={{
        backgroundColor: activeColor ? `${activeColor}10` : undefined,
        borderBottomColor: activeColor ? `${activeColor}25` : undefined,
      }}
    >
      {/* Left color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
        style={{ backgroundColor: activeColor || 'hsl(var(--primary))' }}
      />

      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${activeColor}15` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: activeColor || undefined }} />
      </div>

      {/* Title */}
      <button
        onClick={() => navigate(`/life-flow/${activeCode}`)}
        className="flex-1 text-left truncate text-[13px] font-semibold hover:underline"
        style={{ color: activeColor || undefined }}
      >
        {activeTitle}
      </button>

      {/* Change button */}
      <button
        onClick={() => navigate('/')}
        className="text-muted-foreground hover:text-foreground text-xs shrink-0 flex items-center gap-0.5 active:scale-95"
      >
        {isRu ? 'Сменить' : 'Change'}
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Dismiss */}
      <button
        onClick={clearLifeSituation}
        className="p-1.5 -mr-1 rounded-lg hover:bg-muted active:bg-muted/80 shrink-0"
        aria-label="Clear context"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
});

export default ActiveSituationBanner;
