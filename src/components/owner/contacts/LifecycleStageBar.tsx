import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const LIFECYCLE_STAGES = [
  { key: 'subscriber', en: 'Subscriber', ru: 'Подписчик', color: 'bg-muted-foreground' },
  { key: 'lead', en: 'Lead', ru: 'Лид', color: 'bg-info' },
  { key: 'mql', en: 'MQL', ru: 'MQL', color: 'bg-primary' },
  { key: 'sql', en: 'SQL', ru: 'SQL', color: 'bg-primary' },
  { key: 'opportunity', en: 'Opportunity', ru: 'Возможность', color: 'bg-warning' },
  { key: 'customer', en: 'Customer', ru: 'Клиент', color: 'bg-success' },
  { key: 'evangelist', en: 'Evangelist', ru: 'Евангелист', color: 'bg-success' },
] as const;

interface Props {
  currentStage: string;
  onChange?: (stage: string) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function LifecycleStageBar({ currentStage, onChange, readonly = false, compact = false }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const currentIdx = LIFECYCLE_STAGES.findIndex(s => s.key === currentStage);

  if (compact) {
    const stage = LIFECYCLE_STAGES.find(s => s.key === currentStage) || LIFECYCLE_STAGES[0];
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', stage.color + '/15')}>
        <span className={cn('w-1.5 h-1.5 rounded-full', stage.color)} />
        {isRu ? stage.ru : stage.en}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {LIFECYCLE_STAGES.map((stage, idx) => {
        const isActive = idx <= currentIdx;
        const isCurrent = stage.key === currentStage;
        return (
          <button
            key={stage.key}
            disabled={readonly}
            onClick={() => !readonly && onChange?.(stage.key)}
            className={cn(
              'relative flex-1 min-h-11 px-2 flex items-center justify-center text-[10px] font-medium transition-all rounded-sm',
              isActive ? cn(stage.color, 'text-white') : 'bg-muted text-muted-foreground',
              isCurrent && 'ring-2 ring-offset-1 ring-primary',
              !readonly && 'cursor-pointer hover:opacity-80',
              readonly && 'cursor-default',
            )}
            title={isRu ? stage.ru : stage.en}
          >
            <span className="truncate px-0.5">
              {isRu ? stage.ru : stage.en}
            </span>
          </button>
        );
      })}
    </div>
  );
}
