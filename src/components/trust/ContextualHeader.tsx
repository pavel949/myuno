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
  health: {
    default: {
      en: 'Trusted providers for medical situations',
      ru: 'Проверенные специалисты для медицинских ситуаций',
    },
  },
  leisure: {
    default: {
      en: 'Tested by active residents — reliable for leisure',
      ru: 'Проверено активными жителями — надёжно для отдыха',
    },
  },
  digital_nomad: {
    default: {
      en: 'Popular among remote workers on the island',
      ru: 'Популярно среди удалёнщиков на острове',
    },
  },
  education: {
    default: {
      en: 'Reviewed by families with school-age children',
      ru: 'Проверено семьями со школьниками',
    },
  },
  retirement: {
    default: {
      en: 'Comfortable options for long-term residents',
      ru: 'Комфортные варианты для постоянных жителей',
    },
  },
  property: {
    property: {
      en: 'Reviewed for investment potential — data-backed',
      ru: 'Оценено с точки зрения инвестиций — подкреплено данными',
    },
    default: {
      en: 'Selected for predictable outcomes',
      ru: 'Выбрано для предсказуемых результатов',
    },
  },
  family: {
    default: {
      en: 'Family-friendly and tested by parents',
      ru: 'Подходит для семей — проверено родителями',
    },
  },
  business: {
    default: {
      en: 'Convenient for remote workers and entrepreneurs',
      ru: 'Удобно для удалёнщиков и предпринимателей',
    },
  },
  relocation: {
    default: {
      en: 'Helpful for those settling in long-term',
      ru: 'Полезно для тех, кто обустраивается надолго',
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
      'flex items-start gap-2.5 p-3 rounded-none',
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
