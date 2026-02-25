/**
 * AftercareBanner — P2.4 Post-Action Guidance
 * 
 * After an action (booking, order, request):
 * 1. Reassurance: "You're all set"
 * 2. Clear next steps: timeline, contacts, preparation tips
 * 3. Tie back to Life Situation: "Anything else you might need?"
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';

interface AftercareStep {
  text: string;
  time?: string;
}

interface AftercareBannerProps {
  /** What just happened */
  actionType: 'booking' | 'order' | 'request' | 'inquiry';
  /** Next steps for the user */
  steps?: AftercareStep[];
  /** Preparation tips (if relevant) */
  preparationTips?: string[];
  /** Show cross-sell back to life situation */
  showCrossSell?: boolean;
  className?: string;
}

const DEFAULT_STEPS: Record<string, { en: AftercareStep[]; ru: AftercareStep[] }> = {
  booking: {
    en: [
      { text: 'Confirmation sent to your email', time: 'Now' },
      { text: 'Provider will confirm details', time: '15 min' },
      { text: 'Reminder notification before your booking', time: '1 day before' },
    ],
    ru: [
      { text: 'Подтверждение отправлено на email', time: 'Сейчас' },
      { text: 'Провайдер подтвердит детали', time: '15 мин' },
      { text: 'Напоминание перед бронированием', time: 'За 1 день' },
    ],
  },
  order: {
    en: [
      { text: 'Order confirmed', time: 'Now' },
      { text: 'Preparation in progress', time: '30 min' },
      { text: 'Delivery notification', time: 'Before arrival' },
    ],
    ru: [
      { text: 'Заказ подтверждён', time: 'Сейчас' },
      { text: 'Подготовка заказа', time: '30 мин' },
      { text: 'Уведомление о доставке', time: 'Перед прибытием' },
    ],
  },
  request: {
    en: [
      { text: 'Request received', time: 'Now' },
      { text: 'Our team will review', time: '1–2 hours' },
      { text: 'You\'ll receive options to choose from', time: 'Today' },
    ],
    ru: [
      { text: 'Запрос получен', time: 'Сейчас' },
      { text: 'Наша команда рассмотрит', time: '1–2 часа' },
      { text: 'Вы получите варианты на выбор', time: 'Сегодня' },
    ],
  },
  inquiry: {
    en: [
      { text: 'Inquiry received', time: 'Now' },
      { text: 'A specialist will respond', time: '15 min – 2 hours' },
    ],
    ru: [
      { text: 'Запрос получен', time: 'Сейчас' },
      { text: 'Специалист ответит', time: '15 мин – 2 часа' },
    ],
  },
};

export function AftercareBanner({
  actionType,
  steps,
  preparationTips,
  showCrossSell = true,
  className,
}: AftercareBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { activeCode, activeTitle } = useLifeSituationContext();
  const isRu = language === 'ru';

  const resolvedSteps = steps
    || (isRu ? DEFAULT_STEPS[actionType].ru : DEFAULT_STEPS[actionType].en);

  const whatsappUrl = `https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(
    isRu ? 'Здравствуйте, у меня вопрос по бронированию' : 'Hi, I have a question about my booking'
  )}`;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Timeline */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <h4 className="text-sm font-semibold">
            {isRu ? 'Что будет дальше' : 'What happens next'}
          </h4>
        </div>
        <div className="space-y-2.5 pl-1">
          {resolvedSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5',
                  i === 0 ? 'bg-success' : 'bg-border'
                )} />
                {i < resolvedSteps.length - 1 && (
                  <div className="w-px h-6 bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{step.text}</p>
                {step.time && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {step.time}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preparation tips */}
      {preparationTips && preparationTips.length > 0 && (
        <div className="rounded-xl border bg-primary/5 p-4 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {isRu ? 'Полезные советы' : 'Preparation tips'}
          </h4>
          <ul className="space-y-1">
            {preparationTips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Support contact */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Есть вопросы?' : 'Have questions?'}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {isRu ? 'Напишите нам' : 'Message us'}
        </a>
      </div>

      {/* Cross-sell back to life situation */}
      {showCrossSell && activeCode && activeTitle && (
        <Button
          variant="outline"
          className="w-full text-sm"
          onClick={() => navigate(`/life/${activeCode}`)}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          {isRu
            ? `Что ещё может понадобиться: ${activeTitle}`
            : `Anything else you might need: ${activeTitle}`}
        </Button>
      )}
    </div>
  );
}
