import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamLeaderboard, type LeaderboardEntry } from '@/hooks/useTeamGamification';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LevelBadge, StreakCounter } from './PointsDisplay';
import { Trophy, Medal, Award, Sparkles, TrendingUp, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = ['text-accent', 'text-gray-400', 'text-accent'];

interface LeaderboardProps {
  className?: string;
  compact?: boolean;
  maxItems?: number;
}

/**
 * Team leaderboard component
 */
export function Leaderboard({ className, compact = false, maxItems = 10 }: LeaderboardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<'weekly' | 'monthly' | 'all_time'>('all_time');
  const { leaderboard, isLoading } = useTeamLeaderboard(period);
  const isRu = language === 'ru';

  const displayData = leaderboard?.slice(0, maxItems) || [];
  const currentUserRank = leaderboard?.find(e => e.user_id === user?.id)?.rank;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            {isRu ? 'Рейтинг' : 'Leaderboard'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              {isRu ? 'Топ команды' : 'Top Team'}
            </span>
            {currentUserRank && (
              <Badge variant="outline">#{currentUserRank}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {displayData.slice(0, 5).map((entry, index) => (
              <LeaderboardRow 
                key={entry.user_id} 
                entry={entry} 
                isCurrentUser={entry.user_id === user?.id}
                compact
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          {isRu ? 'Рейтинг команды' : 'Team Leaderboard'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="weekly" className="gap-1.5">
              <Clock className="h-3 w-3" />
              {isRu ? 'Неделя' : 'Week'}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1.5">
              <Calendar className="h-3 w-3" />
              {isRu ? 'Месяц' : 'Month'}
            </TabsTrigger>
            <TabsTrigger value="all_time" className="gap-1.5">
              <TrendingUp className="h-3 w-3" />
              {isRu ? 'Все время' : 'All Time'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {displayData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{isRu ? 'Пока нет данных' : 'No data yet'}</p>
                  </div>
                ) : (
                  displayData.map((entry) => (
                    <LeaderboardRow 
                      key={entry.user_id} 
                      entry={entry}
                      isCurrentUser={entry.user_id === user?.id}
                      period={period}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  compact?: boolean;
  period?: 'weekly' | 'monthly' | 'all_time';
}

function LeaderboardRow({ entry, isCurrentUser, compact, period = 'all_time' }: LeaderboardRowProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const rank = entry.rank || 0;
  const isTopThree = rank <= 3;
  const RankIcon = isTopThree ? RANK_ICONS[rank - 1] : null;

  const points = period === 'weekly' 
    ? entry.weekly_points 
    : period === 'monthly' 
      ? entry.monthly_points 
      : entry.total_points;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 py-1",
        isCurrentUser && "font-medium"
      )}>
        <span className={cn(
          "w-5 text-center text-sm",
          isTopThree && RANK_COLORS[rank - 1]
        )}>
          {isTopThree && RankIcon ? <RankIcon className="h-4 w-4" /> : rank}
        </span>
        <Avatar className="h-6 w-6">
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">
            {entry.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 text-sm truncate">{entry.display_name}</span>
        <span className="text-sm font-medium">{points}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-none transition-colors",
      isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
    )}>
      {/* Rank */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold",
        isTopThree 
          ? `${RANK_COLORS[rank - 1]} bg-current/10` 
          : "text-muted-foreground bg-muted"
      )}>
        {isTopThree && RankIcon ? (
          <RankIcon className="h-5 w-5" />
        ) : (
          <span className="text-sm">{rank}</span>
        )}
      </div>

      {/* Avatar & Name */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback>
          {entry.display_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{entry.display_name}</p>
          <LevelBadge level={entry.level} size="sm" />
        </div>
        {entry.streak_days > 0 && (
          <div className="flex items-center gap-1 text-xs text-accent mt-0.5">
            <Sparkles className="h-3 w-3" />
            <span>{entry.streak_days} {isRu ? 'дней' : 'days'}</span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="text-lg font-bold">{points}</p>
        <p className="text-xs text-muted-foreground">{isRu ? 'очков' : 'pts'}</p>
      </div>
    </div>
  );
}
