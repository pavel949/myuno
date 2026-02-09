/**
 * ContextualHeader — P2.1 Contextual Recommendations
 * 
 * Replaces neutral section headers with situational framing.
 * References the active Life Situation and explains WHY options appear.
 * Uses situational language ("works well if…"), never absolute ("best").
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ContextualHeaderProps {
  /** The vertical / section being shown */
  vertical: string;
  /** Override the auto-generated contextual message */
  customMessage?: string;
  /** Total items available (for "showing X of Y" context) */
  totalCount?: number;
  /** Number shown in shortlist */
  shownCount?: number;
  className?: string;
}

// Situational framing messages per life situation × vertical
const CONTEXTUAL_MESSAGES: Record<string, Record<string, { en: string; ru: string }>> = {
  arrival: {
    property: {
      en: 'Often chosen by new arrivals — comfort and easy check-in',
      ru: 'Часто выбирают при переезде — комфорт и лёгкий заезд',
    },
    transport: {
      en: 'Reliable transfers from the airport, no surprises',
      ru: 'Надёжный трансфер из аэропорта, без сюрпризов',
    },
    default: {
      en: 'Recommended for your arrival — tested and reliable',
      ru: 'Рекомендуем для вашего приезда — проверено и надёжно',
    },
  },
  living: {
    beauty: {
      en: 'Popular among residents — consistent quality',
      ru: 'Популярно среди жителей — стабильное качество',
    },
    property: {
      en: 'Works well for long-term living — verified by locals',
      ru: 'Подходит для долгой жизни — проверено местными',
    },
    default: {
      en: 'Frequently used in daily life here',
      ru: 'Часто используется в повседневной жизни',
    },
  },
  medical: {
    default: {
      en: 'Trusted providers for medical situations',
      ru: 'Проверенные специалисты для медицинских ситуаций',
    },
  },
  leisure: {
    default: {
      en: 'Good choices if you value experience and comfort',
      ru: 'Хороший выбор, если цените впечатления и комфорт',
    },
  },
  investment: {
    property: {
      en: 'Reviewed for investment potential — data-backed',
      ru: 'Оценено с точки зрения инвестиций — подкреплено данными',
    },
    default: {
      en: 'Selected for predictable outcomes',
      ru: 'Выбрано для предсказуемых результатов',
    },
  },
};

const DEFAULT_MESSAGES = {
  en: 'Curated for your situation',
  ru: 'Подобрано для вашей ситуации',
};

export function ContextualHeader({
  vertical,
  customMessage,
  totalCount,
  shownCount,
  className,
}: ContextualHeaderProps) {
  const { language } = useLanguage();
  const { activeCode, activeTitle } = useLifeSituationContext();
  const isRu = language === 'ru';

  // No context = no contextual header
  if (!activeCode) return null;

  // Resolve message
  let message = customMessage;
  if (!message) {
    const situationMessages = CONTEXTUAL_MESSAGES[activeCode];
    if (situationMessages) {
      const verticalMsg = situationMessages[vertical] || situationMessages.default;
      message = verticalMsg
        ? (isRu ? verticalMsg.ru : verticalMsg.en)
        : (isRu ? DEFAULT_MESSAGES.ru : DEFAULT_MESSAGES.en);
    } else {
      message = isRu ? DEFAULT_MESSAGES.ru : DEFAULT_MESSAGES.en;
    }
  }

  return (
    <div className={cn(
      'flex items-start gap-2.5 p-3 rounded-xl',
      'bg-primary/5 border border-primary/10',
      className
    )}>
      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">
          {message}
        </p>
        {totalCount && shownCount && totalCount > shownCount && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {isRu
              ? `Показываем ${shownCount} из ${totalCount} — самые подходящие`
              : `Showing ${shownCount} of ${totalCount} — most relevant`}
          </p>
        )}
      </div>
    </div>
  );
}
