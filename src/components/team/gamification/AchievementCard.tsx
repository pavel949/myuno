import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllAchievements, useMyGamification, type TeamAchievement } from '@/hooks/useTeamGamification';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, Star, Zap, Crown, Medal, Award, Target, Flame,
  UserPlus, Users, FileText, Sunrise, Lock, Check
} from 'lucide-react';

const ICON_MAP: Record<string, typeof Trophy> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  crown: Crown,
  medal: Medal,
  award: Award,
  target: Target,
  flame: Flame,
  'user-plus': UserPlus,
  users: Users,
  'file-text': FileText,
  sunrise: Sunrise,
};

interface AchievementCardProps {
  achievement: TeamAchievement;
  isUnlocked?: boolean;
  unlockedAt?: string;
  className?: string;
}

/**
 * Single achievement card
 */
export function AchievementCard({ 
  achievement, 
  isUnlocked = false,
  unlockedAt,
  className 
}: AchievementCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const Icon = ICON_MAP[achievement.icon] || Trophy;
  const isSecret = achievement.is_secret && !isUnlocked;

  return (
    <div className={cn(
      "relative p-4 rounded-xl border transition-all",
      isUnlocked 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800" 
        : "bg-muted/30 border-muted opacity-60",
      className
    )}>
      {/* Unlocked badge */}
      {isUnlocked && (
        <Badge 
          className="absolute -top-2 -right-2 bg-amber-500 text-white shadow-lg"
        >
          <Check className="h-3 w-3 mr-0.5" />
          {isRu ? 'Получено' : 'Unlocked'}
        </Badge>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "p-3 rounded-xl",
          isUnlocked 
            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg" 
            : "bg-muted text-muted-foreground"
        )}>
          {isSecret ? (
            <Lock className="h-6 w-6" />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">
            {isSecret 
              ? (isRu ? 'Секретное достижение' : 'Secret Achievement')
              : (isRu ? achievement.name_ru : achievement.name_en)
            }
          </h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSecret 
              ? (isRu ? 'Продолжайте работу, чтобы открыть' : 'Keep working to unlock')
              : (isRu ? achievement.description_ru : achievement.description_en)
            }
          </p>
          
          {/* Points requirement */}
          {!isSecret && achievement.points_required > 0 && !isUnlocked && (
            <Badge variant="outline" className="mt-2 text-xs">
              {achievement.points_required} {isRu ? 'очков' : 'pts'} {isRu ? 'для открытия' : 'to unlock'}
            </Badge>
          )}

          {/* Unlock date */}
          {isUnlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              {isRu ? 'Получено' : 'Unlocked'}: {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface AchievementsGridProps {
  className?: string;
  showAll?: boolean;
}

/**
 * Grid of all achievements with unlock status
 */
export function AchievementsGrid({ className, showAll = false }: AchievementsGridProps) {
  const { language } = useLanguage();
  const { achievements: allAchievements, isLoading: achievementsLoading } = useAllAchievements();
  const { achievements: userAchievements, isLoading: userLoading } = useMyGamification();
  const isRu = language === 'ru';

  const isLoading = achievementsLoading || userLoading;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {isRu ? 'Достижения' : 'Achievements'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const unlockedIds = new Set(userAchievements?.map(a => a.achievement_id) || []);
  
  // Sort: unlocked first, then by sort_order
  const sortedAchievements = [...(allAchievements || [])].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return a.sort_order - b.sort_order;
  });

  const displayAchievements = showAll ? sortedAchievements : sortedAchievements.slice(0, 6);
  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements?.length || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {isRu ? 'Достижения' : 'Achievements'}
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount} / {totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={showAll ? "h-[500px]" : undefined}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayAchievements.map(achievement => {
              const userAchievement = userAchievements?.find(
                a => a.achievement_id === achievement.id
              );
              
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={!!userAchievement}
                  unlockedAt={userAchievement?.unlocked_at}
                />
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
