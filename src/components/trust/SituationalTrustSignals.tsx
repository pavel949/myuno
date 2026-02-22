/**
 * SituationalTrustSignals — P2.6 Trust Signals (Non-Rating)
 * 
 * Trust indicators beyond star ratings:
 * - Verified provider
 * - Frequently used in this situation
 * - Handled by myUNO partners
 * - Low risk / predictable outcome
 * 
 * Contextual: signals change based on active life situation.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, Users, Handshake, CheckCircle,
  Clock, ThumbsUp, BadgeCheck,
  type LucideIcon,
} from 'lucide-react';

interface TrustSignal {
  icon: LucideIcon;
  labelEn: string;
  labelRu: string;
}

interface SituationalTrustSignalsProps {
  /** Provider is verified */
  isVerified?: boolean;
  /** Handled by myUNO team */
  isManagedByUno?: boolean;
  /** Number of times used in current situation */
  situationUsageCount?: number;
  /** Provider has fast response */
  hasFastResponse?: boolean;
  /** Provider is predictable / low-risk */
  isPredictable?: boolean;
  /** Provider has high repeat rate */
  hasHighRepeatRate?: boolean;
  /** Compact mode (icons only with tooltips) */
  compact?: boolean;
  className?: string;
}

export function SituationalTrustSignals({
  isVerified,
  isManagedByUno,
  situationUsageCount,
  hasFastResponse,
  isPredictable,
  hasHighRepeatRate,
  compact = false,
  className,
}: SituationalTrustSignalsProps) {
  const { language } = useLanguage();
  const { activeCode, activeTitle } = useLifeSituationContext();
  const isRu = language === 'ru';

  const signals: TrustSignal[] = [];

  if (isVerified) {
    signals.push({
      icon: BadgeCheck,
      labelEn: 'Verified provider',
      labelRu: 'Проверенный провайдер',
    });
  }

  if (isManagedByUno) {
    signals.push({
      icon: Handshake,
      labelEn: 'Handled by myUNO',
      labelRu: 'Обслуживается myUNO',
    });
  }

  if (situationUsageCount && situationUsageCount > 5 && activeTitle) {
    signals.push({
      icon: Users,
      labelEn: `Often used: ${activeTitle}`,
      labelRu: `Часто выбирают: ${activeTitle}`,
    });
  }

  if (hasFastResponse) {
    signals.push({
      icon: Clock,
      labelEn: 'Fast response',
      labelRu: 'Быстрый ответ',
    });
  }

  if (isPredictable) {
    signals.push({
      icon: CheckCircle,
      labelEn: 'Predictable outcome',
      labelRu: 'Предсказуемый результат',
    });
  }

  if (hasHighRepeatRate) {
    signals.push({
      icon: ThumbsUp,
      labelEn: 'High repeat rate',
      labelRu: 'Высокий процент повторных обращений',
    });
  }

  if (signals.length === 0) return null;

  return (
    <div className={cn(
      'flex flex-wrap gap-2',
      className
    )}>
      {signals.map((signal, i) => {
        const Icon = signal.icon;
        if (compact) {
          return (
            <div
              key={i}
              title={isRu ? signal.labelRu : signal.labelEn}
              className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center"
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
          );
        }
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10"
          >
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">
              {isRu ? signal.labelRu : signal.labelEn}
            </span>
          </div>
        );
      })}
    </div>
  );
}
