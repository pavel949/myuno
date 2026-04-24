/**
 * VendorVerificationBadge — Shows current verification level in vendor dashboard
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BadgeCheck, Shield, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface VendorVerificationBadgeProps {
  isVerified?: boolean;
  rating?: number;
  bookingsCount?: number;
  className?: string;
}

const LEVELS = {
  basic: {
    icon: BadgeCheck,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    border: 'border-muted',
  },
  verified: {
    icon: Shield,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/30',
  },
  premium: {
    icon: Crown,
    color: 'text-accent',
    bg: 'bg-accent/5',
    border: 'border-accent/40',
  },
};

function getLevel(isVerified: boolean, rating: number, bookingsCount: number) {
  if (isVerified && rating >= 4.5 && bookingsCount >= 50) return 'premium';
  if (isVerified) return 'verified';
  return 'basic';
}

export function VendorVerificationBadge({ 
  isVerified = false, 
  rating = 0, 
  bookingsCount = 0,
  className 
}: VendorVerificationBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const level = getLevel(isVerified, rating, bookingsCount);
  const config = LEVELS[level];
  const LevelIcon = config.icon;

  const levelLabels = {
    basic: { en: 'Basic', ru: 'Базовый' },
    verified: { en: 'Verified', ru: 'Проверенный' },
    premium: { en: 'Premium', ru: 'Премиум' },
  };

  // Next level hints
  const nextSteps = level === 'basic' 
    ? (isRu 
        ? ['Загрузите документы компании', 'Добавьте лицензию (если требуется)']
        : ['Upload company documents', 'Add license (if required)'])
    : level === 'verified'
    ? (isRu
        ? [`Рейтинг: ${rating}/4.5`, `Заказов: ${bookingsCount}/50`]
        : [`Rating: ${rating}/4.5`, `Orders: ${bookingsCount}/50`])
    : [];

  const progress = level === 'basic' ? 33 : level === 'verified' ? 66 : 100;

  return (
    <Card className={cn('border', config.border, className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-none', config.bg)}>
              <LevelIcon className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Уровень верификации' : 'Verification Level'}
              </p>
              <p className={cn('font-bold text-sm', config.color)}>
                {levelLabels[level][isRu ? 'ru' : 'en']}
              </p>
            </div>
          </div>
          {level !== 'premium' && (
            <Badge variant="outline" className="text-[10px]">
              {isRu ? 'Повысить →' : 'Upgrade →'}
            </Badge>
          )}
        </div>

        <Progress value={progress} className="h-1.5 mb-2" />

        {nextSteps.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              {isRu ? 'Для следующего уровня:' : 'For next level:'}
            </p>
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className="w-3 h-3 rounded-full border shrink-0" />
                {step}
              </div>
            ))}
          </div>
        )}

        {level === 'premium' && (
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isRu ? 'Максимальный уровень достигнут' : 'Maximum level achieved'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
