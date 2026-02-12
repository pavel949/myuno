/**
 * AchievementShowcase — displays earned badges and progress toward next achievements.
 * Used on account page and wallet/loyalty page.
 */
import React from 'react';
import { Trophy, Lock, Star, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoyalty } from '@/hooks/useLoyalty';
import { Progress } from '@/components/ui/progress';

export function AchievementShowcase() {
  const { language } = useLanguage();
  const { currentTier, nextTier, progressToNextTier, amountToNextTier, achievements, allAchievements, isLoading } = useLoyalty();
  const isRu = language === 'ru';

  if (isLoading || !currentTier) return null;

  const earnedCodes = new Set(achievements.map(a => a.achievement_code));

  return (
    <div className="space-y-5">
      {/* Loyalty Tier Progress */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
              {currentTier.icon || '⭐'}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{currentTier.tier_name}</h3>
              <p className="text-xs text-muted-foreground">
                {currentTier.cashback_percent}% cashback
              </p>
            </div>
          </div>
          {nextTier && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{isRu ? 'Следующий' : 'Next'}</p>
              <p className="text-sm font-medium text-foreground">{nextTier.tier_name}</p>
            </div>
          )}
        </div>

        {nextTier && (
          <div className="space-y-2">
            <Progress value={progressToNextTier} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {isRu 
                ? `Ещё ฿${amountToNextTier.toLocaleString()} до ${nextTier.tier_name}` 
                : `฿${amountToNextTier.toLocaleString()} more to ${nextTier.tier_name}`}
            </p>
          </div>
        )}
      </div>

      {/* Achievement Badges */}
      {allAchievements.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {isRu ? 'Достижения' : 'Achievements'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {allAchievements.slice(0, 8).map(def => {
              const earned = earnedCodes.has(def.code);
              const description = isRu ? def.description_ru : def.description_en;
              return (
                <div
                  key={def.id}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    earned 
                      ? 'bg-primary/5 border border-primary/20' 
                      : 'bg-muted/30 border border-transparent'
                  }`}
                  title={!earned && description ? description : undefined}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    earned ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {earned ? (def.icon || '🏆') : (def.icon || <Lock className="w-4 h-4 text-muted-foreground" />)}
                  </div>
                  <p className={`text-[10px] text-center font-medium leading-tight ${
                    earned ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {isRu ? def.name_ru : def.name_en}
                  </p>
                  {earned && def.bonus_amount > 0 && (
                    <span className="text-[9px] text-primary font-semibold">+฿{def.bonus_amount}</span>
                  )}
                  {!earned && description && (
                    <p className="text-[9px] text-muted-foreground text-center line-clamp-2 leading-tight">
                      {description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {allAchievements.length > 8 && (
            <p className="text-xs text-center text-muted-foreground">
              {isRu 
                ? `+${allAchievements.length - 8} ещё` 
                : `+${allAchievements.length - 8} more`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
