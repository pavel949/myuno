import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VerticalSpec, LocalizedText, FieldGroup } from '@/lib/vertical-specs/types';
import { FieldRenderer } from './FieldRenderer';
import { QualityPanel } from './QualityPanel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getPath } from '@/lib/vertical-specs/pathUtils';

const t = (l: LocalizedText, lang: 'en' | 'ru') => l[lang] ?? l.en;

interface Props {
  spec: VerticalSpec;
  initial?: Record<string, unknown>;
  onSubmit: (row: Record<string, unknown>) => Promise<void> | void;
  onSaveDraft?: (row: Record<string, unknown>) => void;
  submitting?: boolean;
}

/**
 * Industry-specific onboarding wizard rendered from VerticalSpec.onboarding[].
 * Auto-validates required + i18n fields per step; blocks Next until passed.
 */
export const VerticalWizard = ({ spec, initial, onSubmit, onSaveDraft, submitting }: Props) => {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const [step, setStep] = useState(0);
  const [row, setRow] = useState<Record<string, unknown>>(initial ?? {});

  const steps = spec.onboarding;
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const validateGroup = (g: FieldGroup): string[] => {
    const errors: string[] = [];
    for (const f of g.fields) {
      if (!f.required) continue;
      const v = getPath(row, f.path);
      if (f.type === 'i18n_text' || f.type === 'i18n_textarea') {
        const iv = v as { en?: string; ru?: string } | undefined;
        if (!iv?.en?.trim() || !iv?.ru?.trim()) errors.push(t(f.label, lang));
      } else if (Array.isArray(v)) {
        if (v.length === 0) errors.push(t(f.label, lang));
      } else if (v === null || v === undefined || v === '') {
        errors.push(t(f.label, lang));
      }
    }
    return errors;
  };

  const stepErrors = useMemo(
    () => current.groups.flatMap(validateGroup),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, row, lang],
  );

  const change = (next: Record<string, unknown>) => {
    setRow(next);
    onSaveDraft?.(next);
  };

  const next = () => {
    if (stepErrors.length > 0) return;
    if (step < steps.length - 1) setStep(step + 1);
  };
  const back = () => step > 0 && setStep(step - 1);
  const submit = async () => {
    if (stepErrors.length > 0) return;
    await onSubmit(row);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,320px]">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {lang === 'ru' ? 'Шаг' : 'Step'} {step + 1} / {steps.length}
            </span>
            <span>{t(spec.label, lang)}</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{t(current.title, lang)}</h2>
          {current.description && (
            <p className="text-sm text-muted-foreground">{t(current.description, lang)}</p>
          )}
        </div>

        {current.groups.map((g) => (
          <section key={g.id} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <header className="space-y-1">
              <h3 className="text-base font-medium">{t(g.title, lang)}</h3>
              {g.description && <p className="text-sm text-muted-foreground">{t(g.description, lang)}</p>}
            </header>
            <div className="space-y-4">
              {g.fields.map((f) => (
                <FieldRenderer key={f.key} field={f} row={row} onChange={change} />
              ))}
            </div>
          </section>
        ))}

        {stepErrors.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            {lang === 'ru' ? 'Заполните обязательные поля: ' : 'Please complete: '}
            {stepErrors.join(', ')}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="outline" onClick={back} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {lang === 'ru' ? 'Назад' : 'Back'}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next} disabled={stepErrors.length > 0}>
              {lang === 'ru' ? 'Дальше' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={stepErrors.length > 0 || submitting}>
              <Check className="h-4 w-4 mr-1" />
              {lang === 'ru' ? 'Отправить на модерацию' : 'Submit for review'}
            </Button>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <QualityPanel spec={spec} row={row} />
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            {lang === 'ru' ? 'Эталоны индустрии' : 'Industry references'}
          </p>
          <p>{spec.references?.join(' · ')}</p>
        </div>
      </aside>
    </div>
  );
};
