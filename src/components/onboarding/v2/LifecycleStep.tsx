import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LIFECYCLE_OPTIONS,
} from '@/lib/segmentation/detectPersona';
import { LIFECYCLE_STAGE_LABELS, type LifecycleStage } from '@/types/canonical';

const ICONS: Record<LifecycleStage, string> = {
  scout: '🔭',
  tourist: '🏝️',
  snowbird: '☀️',
  nomad: '💻',
  settler: '🛬',
  resident: '🏡',
  absentee: '🌐',
  returnee: '🔁',
};

const DESCRIPTIONS: Record<LifecycleStage, { en: string; ru: string }> = {
  scout:    { en: 'Researching, not here yet', ru: 'Изучаю, ещё не приехал' },
  tourist:  { en: 'Short visit, holiday',     ru: 'Короткий визит, отпуск' },
  snowbird: { en: '1–6 months a year',        ru: '1–6 месяцев в году' },
  nomad:    { en: 'Working remotely',         ru: 'Работаю удалённо' },
  settler:  { en: 'Just relocated',           ru: 'Только переехал' },
  resident: { en: 'Living here permanently',  ru: 'Живу постоянно' },
  absentee: { en: 'Own here, live elsewhere', ru: 'Владею, живу в другом месте' },
  returnee: { en: 'Coming back again',        ru: 'Возвращаюсь снова' },
};

interface Props {
  value: LifecycleStage | null;
  onChange: (v: LifecycleStage) => void;
  lang: 'en' | 'ru';
}

export function LifecycleStep({ value, onChange, lang }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {LIFECYCLE_OPTIONS.map((stage) => {
        const isActive = value === stage;
        return (
          <motion.button
            key={stage}
            type="button"
            onClick={() => onChange(stage)}
            whileTap={{ scale: 0.98 }}
            data-testid={`onboarding-lifecycle-${stage}`}
            className={cn(
              'relative flex items-start gap-3 rounded-xl border-2 bg-card p-4 text-left transition-all min-h-[88px]',
              'hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border',
            )}
            aria-pressed={isActive}
          >
            <span className="text-2xl shrink-0" aria-hidden>
              {ICONS[stage]}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {LIFECYCLE_STAGE_LABELS[stage][lang]}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {DESCRIPTIONS[stage][lang]}
              </span>
            </span>
            {isActive && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
