import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { Leaderboard } from '@/components/team/gamification/Leaderboard';
import { AchievementsGrid } from '@/components/team/gamification/AchievementCard';
import { PointsDisplay } from '@/components/team/gamification/PointsDisplay';

export default function TeamLeaderboardPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <TeamLayout title={isRu ? 'Рейтинг' : 'Leaderboard'}>
      <div className="py-6 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isRu ? 'Рейтинг команды' : 'Team Leaderboard'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Соревнуйтесь и зарабатывайте очки за активность' 
              : 'Compete and earn points for your activity'}
          </p>
        </div>

        {/* My Stats */}
        <PointsDisplay />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Leaderboard maxItems={20} />

          {/* Achievements */}
          <AchievementsGrid showAll />
        </div>
      </div>
    </TeamLayout>
  );
}
