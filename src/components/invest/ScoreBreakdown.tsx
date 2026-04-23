import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MapPin, 
  Building2, 
  TrendingUp, 
  Users,
  Briefcase,
  BarChart3,
  Package,
  Target
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ScoreBreakdownProps {
  scoreBreakdown: Record<string, number> | null;
  projectType?: string;
  className?: string;
}

// Score categories for real estate
const REAL_ESTATE_CATEGORIES = [
  { key: 'location', icon: MapPin, en: 'Location', ru: 'Локация', weight: 25 },
  { key: 'developer', icon: Building2, en: 'Developer', ru: 'Девелопер', weight: 25 },
  { key: 'financial', icon: TrendingUp, en: 'Financial Model', ru: 'Финансовая модель', weight: 30 },
  { key: 'market', icon: Users, en: 'Market Demand', ru: 'Рыночный спрос', weight: 20 },
];

// Score categories for business
const BUSINESS_CATEGORIES = [
  { key: 'team', icon: Briefcase, en: 'Team', ru: 'Команда', weight: 30 },
  { key: 'market', icon: BarChart3, en: 'Market', ru: 'Рынок', weight: 25 },
  { key: 'financial', icon: TrendingUp, en: 'Financials', ru: 'Финансы', weight: 25 },
  { key: 'product', icon: Package, en: 'Product', ru: 'Продукт', weight: 20 },
];

export function ScoreBreakdown({
  scoreBreakdown,
  projectType,
  className,
}: ScoreBreakdownProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!scoreBreakdown || Object.keys(scoreBreakdown).length === 0) {
    return null;
  }

  const isRealEstate = projectType?.startsWith('real_estate');
  const categories = isRealEstate ? REAL_ESTATE_CATEGORIES : BUSINESS_CATEGORIES;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-warning';
    if (score >= 50) return 'text-accent-amber';
    return 'text-destructive';
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-success';
    if (score >= 70) return 'bg-accent';
    if (score >= 50) return 'bg-accent';
    return 'bg-red-500';
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Target className="h-4 w-4 text-primary" />
        <span>{isRu ? 'Детализация оценки muUNO' : 'muUNO Score Breakdown'}</span>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const score = scoreBreakdown[category.key] ?? 0;
          const Icon = category.icon;

          return (
            <div key={category.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{isRu ? category.ru : category.en}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({category.weight}%)
                  </span>
                </div>
                <span className={cn('font-semibold', getScoreColor(score))}>
                  {score}%
                </span>
              </div>
              
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
                    getProgressColor(score)
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
