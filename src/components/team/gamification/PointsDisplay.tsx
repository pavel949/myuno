import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyGamification, getLevelFromPoints, getLevelProgress, LEVEL_CONFIG } from '@/hooks/useTeamGamification';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles, Zap, Star, Crown, Medal, Award } from 'lucide-react';

const LEVEL_ICONS = [Star, Zap, Medal, Award, Crown];

interface PointsDisplayProps {
  compact?: boolean;
  className?: string;
}

/**
 * Shows current points and level progress
 */
export function PointsDisplay({ compact = false, className }: PointsDisplayProps) {
  const { language } = useLanguage();
  const { stats, level, progress } = useMyGamification();
  const isRu = language === 'ru';
  
  const LevelIcon = LEVEL_ICONS[Math.min((stats?.level || 1) - 1, 4)];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className={cn("gap-1", level.color)}>
          <LevelIcon className="h-3 w-3" />
          Lv.{stats?.level || 1}
        </Badge>
        <span className="text-sm font-medium">{stats?.total_points || 0}</span>
      </div>
    );
  }

  return (
    <div className={cn("p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg bg-background shadow-sm", level.color)}>
            <LevelIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{isRu ? level.name_ru : level.name_en}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Уровень' : 'Level'} {stats?.level || 1}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{stats?.total_points || 0}</p>
          <p className="text-xs text-muted-foreground">{isRu ? 'очков' : 'points'}</p>
        </div>
      </div>

      {/* Progress to next level */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {isRu ? 'До следующего уровня' : 'To next level'}
          </span>
          <span className="font-medium">
            {stats?.total_points || 0} / {progress.next}
          </span>
        </div>
        <Progress value={progress.progress} className="h-2" />
      </div>

      {/* Streak */}
      {(stats?.streak_days || 0) > 0 && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">
              {stats?.streak_days} {isRu ? 'дней подряд' : 'day streak'}
            </span>
          </div>
          <Badge variant="outline" className="text-amber-500 border-amber-500/30">
            🔥 {isRu ? 'В ударе!' : 'On fire!'}
          </Badge>
        </div>
      )}
    </div>
  );
}

interface LevelBadgeProps {
  level: number;
  points?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Standalone level badge
 */
export function LevelBadge({ level, points, size = 'md', className }: LevelBadgeProps) {
  const { language } = useLanguage();
  const levelInfo = LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
  const isRu = language === 'ru';
  const LevelIcon = LEVEL_ICONS[Math.min(level - 1, 4)];

  const sizeClasses = {
    sm: 'h-6 px-2 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge 
      variant="secondary"
      className={cn(
        "rounded-full font-medium",
        sizeClasses[size],
        levelInfo.color,
        className
      )}
    >
      <LevelIcon className={iconSizes[size]} />
      <span>Lv.{level}</span>
      {points !== undefined && (
        <span className="opacity-70">• {points}</span>
      )}
    </Badge>
  );
}

interface StreakCounterProps {
  days: number;
  className?: string;
}

/**
 * Streak counter with animation
 */
export function StreakCounter({ days, className }: StreakCounterProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (days <= 0) return null;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
      "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
      "border border-amber-500/30",
      "text-amber-600 dark:text-amber-400",
      className
    )}>
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span className="font-semibold">{days}</span>
      <span className="text-sm">
        {isRu ? 'дней' : 'days'}
      </span>
    </div>
  );
}
