import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CanonicalOnboardingResult } from '@/hooks/useCanonicalOnboarding';
import { CLUSTER_META, LIFECYCLE_STAGE_LABELS } from '@/types/canonical';

interface Props {
  result: CanonicalOnboardingResult;
  lang: 'en' | 'ru';
  onReset: () => void;
}

const COPY = {
  resultTitle: { en: 'Your starting map', ru: 'Ваша стартовая карта' },
  proposalLine: {
    en: 'Stage and active clusters:',
    ru: 'Этап и активные кластеры:',
  },
  openPrefix: { en: 'Open', ru: 'Открыть' },
  exploreLater: { en: 'Browse all services', ru: 'Смотреть все сервисы' },
  redo: { en: 'Redo questions', ru: 'Пройти заново' },
  bySource: {
    ai_v1: { en: 'AI-assisted', ru: 'С помощью ИИ' },
    rules_v1: { en: 'Rule-based', ru: 'По правилам' },
  },
};

export function ResultStep({ result, lang, onReset }: Props) {
  const navigate = useNavigate();
  const { proposal, recommendations, source } = result;
  const stageLabel = LIFECYCLE_STAGE_LABELS[proposal.lifecycle_stage][lang];
  const primary = recommendations[0];

  return (
    <>
      <header className="text-center" data-testid="onboarding-result">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{COPY.resultTitle[lang]}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {COPY.proposalLine[lang]} <strong className="text-foreground">{stageLabel}</strong> · <span data-testid="onboarding-result-persona">{proposal.detected_persona}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {proposal.active_clusters.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {CLUSTER_META[c]?.[`label${lang === 'ru' ? 'Ru' : 'En'}`]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            <Sparkles className="h-2.5 w-2.5" />
            {COPY.bySource[source][lang]} · {Math.round(proposal.confidence * 100)}%
          </span>
        </div>
      </header>

      <ul className="space-y-2">
        {recommendations.map((item, idx) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => navigate(item.route)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all min-h-[64px]',
                'hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                idx === 0 && 'border-primary/60 bg-primary/5',
              )}
            >
              <span className="text-2xl shrink-0" aria-hidden>{item.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">{item.title[lang]}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.description[lang]}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        {primary && (
          <Button className="flex-1" onClick={() => navigate(primary.route)}>
            {COPY.openPrefix[lang]} · {primary.title[lang]}
          </Button>
        )}
        <Button variant="outline" className="flex-1" onClick={() => navigate('/discover')}>
          {COPY.exploreLater[lang]}
        </Button>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {COPY.redo[lang]}
      </button>
    </>
  );
}
