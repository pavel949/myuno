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
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-b relative"
      style={{
        backgroundColor: activeColor ? `${activeColor}15` : undefined,
        borderBottomColor: activeColor ? `${activeColor}30` : undefined,
      }}
    >
      {/* Left color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
        style={{ backgroundColor: activeColor || 'hsl(var(--primary))' }}
      />

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${activeColor}20` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: activeColor || undefined }} />
      </div>

      {/* Title */}
      <button
        onClick={() => navigate(`/life-flow/${activeCode}`)}
        className="flex-1 text-left truncate font-semibold hover:underline"
        style={{ color: activeColor || undefined }}
      >
        {activeTitle}
      </button>

      {/* Change button */}
      <button
        onClick={() => navigate('/')}
        className="text-muted-foreground hover:text-foreground text-xs shrink-0 flex items-center gap-0.5"
      >
        {isRu ? 'Сменить' : 'Change'}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Dismiss */}
      <button
        onClick={clearLifeSituation}
        className="p-1 rounded-md hover:bg-muted shrink-0"
        aria-label="Clear context"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
});

export default ActiveSituationBanner;
