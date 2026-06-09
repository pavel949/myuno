import { useLanguage } from '@/contexts/LanguageContext';
import type { VerticalSpec, LocalizedText } from '@/lib/vertical-specs/types';
import { computeQualityScore } from '@/lib/vertical-specs/qualityScore';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle } from 'lucide-react';

const t = (l: LocalizedText, lang: 'en' | 'ru') => l[lang] ?? l.en;

interface Props {
  spec: VerticalSpec;
  row: Record<string, unknown>;
}

/**
 * Live quality scorecard with per-rule checklist.
 * Score < 60 → publish blocked (per Wave 5 plan).
 */
export const QualityPanel = ({ spec, row }: Props) => {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const report = computeQualityScore(spec, row);
  const blocked = report.score < 60;

  const rulesById = new Map(spec.quality.map((r) => [r.id, r]));

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {lang === 'ru' ? 'Качество карточки' : 'Listing quality'}
        </span>
        <span className="font-mono text-lg">{report.score}%</span>
      </div>
      <Progress value={report.score} />
      {blocked && (
        <p className="text-xs text-destructive">
          {lang === 'ru'
            ? 'Нужно ≥60% для публикации.'
            : 'Reach ≥60% to publish.'}
        </p>
      )}

      <div className="space-y-1.5 pt-1">
        {spec.quality.map((rule) => {
          const passed = report.passed.includes(rule.id);
          return (
            <div key={rule.id} className="flex items-start gap-2 text-xs">
              {passed ? (
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={passed ? 'text-muted-foreground line-through' : ''}>
                {t(rule.label, lang)}
              </span>
              <span className="ml-auto text-muted-foreground">+{rule.weight}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
