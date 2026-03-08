/**
 * Loyalty Widget — Points display and progress
 * 
 * Shows user's loyalty points, tier, and progress to next tier.
 * Clean Airbnb-style card design.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { Star, Gift, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tier definitions ──
interface LoyaltyTier {
  id: string;
  nameEn: string;
  nameRu: string;
  minPoints: number;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  benefitsEn: string[];
  benefitsRu: string[];
}

const TIERS: LoyaltyTier[] = [
  {
    id: 'explorer',
    nameEn: 'Explorer',
    nameRu: 'Исследователь',
    minPoints: 0,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: Star,
    benefitsEn: ['Earn points on every order'],
    benefitsRu: ['Баллы за каждый заказ'],
  },
  {
    id: 'traveler',
    nameEn: 'Traveler',
    nameRu: 'Путешественник',
    minPoints: 500,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    icon: TrendingUp,
    benefitsEn: ['2× points on activities', 'Priority support'],
    benefitsRu: ['2× баллы за активности', 'Приоритетная поддержка'],
  },
  {
    id: 'insider',
    nameEn: 'Insider',
    nameRu: 'Инсайдер',
    minPoints: 2000,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    icon: Sparkles,
    benefitsEn: ['3× points', 'Exclusive offers', 'Free upgrades'],
    benefitsRu: ['3× баллы', 'Эксклюзивные офферы', 'Бесплатные апгрейды'],
  },
  {
    id: 'vip',
    nameEn: 'VIP',
    nameRu: 'VIP',
    minPoints: 5000,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    icon: Gift,
    benefitsEn: ['5× points', 'Personal concierge', 'VIP access'],
    benefitsRu: ['5× баллы', 'Персональный консьерж', 'VIP-доступ'],
  },
];

function getCurrentTier(points: number): { current: LoyaltyTier; next: LoyaltyTier | null; progress: number } {
  let currentTier = TIERS[0];
  let nextTier: LoyaltyTier | null = TIERS[1];
  
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) {
      currentTier = TIERS[i];
      nextTier = TIERS[i + 1] || null;
      break;
    }
  }
  
  if (!nextTier) return { current: currentTier, next: null, progress: 100 };
  
  const range = nextTier.minPoints - currentTier.minPoints;
  const earned = points - currentTier.minPoints;
  const progress = Math.min(100, Math.round((earned / range) * 100));
  
  return { current: currentTier, next: nextTier, progress };
}

interface LoyaltyWidgetProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export const LoyaltyWidget: React.FC<LoyaltyWidgetProps> = ({
  variant = 'full',
  className,
}) => {
  const { language } = useLanguage();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  // Use wallet bonus_balance as loyalty points
  const points = wallet?.balance || 0;
  const { current, next, progress } = getCurrentTier(points);
  const TierIcon = current.icon;

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate('/wallet')}
        className={cn(
          'flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all w-full text-left',
          className
        )}
      >
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', current.bgColor)}>
          <TierIcon className={cn('w-4 h-4', current.color)} />
        </div>
        <div className="flex-1">
          <span className={cn('text-xs font-semibold', current.color)}>
            {isRu ? current.nameRu : current.nameEn}
          </span>
          <p className="text-sm font-semibold text-foreground">{points.toLocaleString()} pts</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', current.bgColor)}>
              <TierIcon className={cn('w-5 h-5', current.color)} />
            </div>
            <div>
              <p className={cn('text-xs font-semibold', current.color)}>
                {isRu ? current.nameRu : current.nameEn}
              </p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {points.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">pts</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/wallet')}
            className="text-xs font-medium text-primary hover:underline"
          >
            {isRu ? 'Подробнее' : 'Details'}
          </button>
        </div>

        {/* Progress bar */}
        {next && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{isRu ? current.nameRu : current.nameEn}</span>
              <span>{isRu ? next.nameRu : next.nameEn}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {isRu 
                ? `Ещё ${(next.minPoints - points).toLocaleString()} баллов до ${next.nameRu}`
                : `${(next.minPoints - points).toLocaleString()} points to ${next.nameEn}`
              }
            </p>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {isRu ? 'Как получить баллы' : 'How to earn'}
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { labelEn: 'Book', labelRu: 'Заказы', pts: '+50', icon: '🛒' },
            { labelEn: 'Review', labelRu: 'Отзывы', pts: '+25', icon: '⭐' },
            { labelEn: 'Refer', labelRu: 'Друзья', pts: '+100', icon: '🤝' },
          ].map((item) => (
            <div key={item.labelEn} className="p-2 bg-muted/50 rounded-xl">
              <span className="text-lg">{item.icon}</span>
              <p className="text-xs font-medium text-foreground mt-1">
                {isRu ? item.labelRu : item.labelEn}
              </p>
              <p className="text-[11px] text-primary font-semibold">{item.pts}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
