/**
 * ClearViewLanding — product landing for ClearView project rating.
 * Audience: developers (primary), buyers (informational).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { CLEARVIEW_LABELS, GOV_BUTTONS } from '@/lib/copy/govStyle';
import { APP_ROUTES } from '@/lib/config/routes';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
import { CLEARVIEW_CATEGORIES } from '@/lib/clearview/methodology';

export default function ClearViewLanding() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const steps = [
    {
      ru: 'Подача проекта', en: 'Submit the project',
      bodyRu: 'Застройщик подаёт заявку и документы по проекту.',
      bodyEn: 'The developer submits an application and the project documents.',
    },
    {
      ru: 'Оценка по 8 областям', en: 'Assessment in 8 areas',
      bodyRu: 'Каждая область оценивается отдельно с учётом её веса.',
      bodyEn: 'Each area is scored separately and weighted.',
    },
    {
      ru: 'Отчёт', en: 'Report',
      bodyRu: 'Отчёт готов в течение 15 рабочих дней.',
      bodyEn: 'The report is ready within 15 business days.',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 bg-background/95 border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={APP_ROUTES.PROPERTY} aria-label={isRu ? 'Назад' : 'Back'}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-display text-[16px] font-semibold text-foreground truncate">
            {isRu ? CLEARVIEW_LABELS.productName.ru : CLEARVIEW_LABELS.productName.en}
          </h1>
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="rounded-none border border-border bg-card p-4">
          <ShieldCheck className="w-5 h-5 text-foreground mb-2" />
          <h2 className="font-display text-[18px] font-semibold text-foreground tracking-[-0.01em]">
            {isRu ? 'Независимый рейтинг проекта' : 'Independent project rating'}
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">
            {isRu ? CLEARVIEW_LABELS.scopeLine.ru : CLEARVIEW_LABELS.scopeLine.en}
          </p>
          <p className="text-[12.5px] font-mono text-foreground mt-3">
            {isRu ? CLEARVIEW_LABELS.priceLine.ru : CLEARVIEW_LABELS.priceLine.en}
          </p>
          <p className="text-[11.5px] text-muted-foreground mt-1">
            {isRu ? 'Срок отчёта: 15 рабочих дней.' : 'Report turnaround: 15 business days.'}
          </p>
        </div>
      </section>

      <section className="px-4 pb-5" aria-labelledby="cv-steps">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Как это работает' : 'How it works'}
        </p>
        <h2 id="cv-steps" className="sr-only">{isRu ? 'Как это работает' : 'How it works'}</h2>
        <ol className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.en} className="border border-border bg-card p-3">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-1 text-sm font-semibold text-foreground">{isRu ? step.ru : step.en}</p>
              <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{isRu ? step.bodyRu : step.bodyEn}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-4 pb-5" aria-labelledby="cv-method">
        <h3 id="cv-method" className="font-display text-[14px] font-semibold text-foreground mb-1">
          {isRu ? CLEARVIEW_LABELS.methodology.ru : CLEARVIEW_LABELS.methodology.en}
        </h3>
        <p className="mb-3 text-[13px] text-muted-foreground">
          {isRu ? 'Восемь областей с весами; итоговая оценка — взвешенная сумма.' : 'Eight weighted areas; the overall score is the weighted sum.'}
        </p>
        <ul className="space-y-2.5">
          {CLEARVIEW_CATEGORIES.map((category) => {
            const percent = Math.round(category.weight * 100);
            return (
              <li key={category.code}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-foreground">{isRu ? category.nameRu : category.nameEn}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{percent}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-muted" aria-hidden="true">
                  <div className="h-full bg-primary" style={{ width: `${percent * 5}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 pb-5">
        <div className="rounded-none border border-border bg-muted/30 p-3">
          <p className="text-[12px] text-muted-foreground leading-snug">
            {isRu ? CLEARVIEW_LABELS.yearOneNote.ru : CLEARVIEW_LABELS.yearOneNote.en}
          </p>
        </div>
      </section>

      <section className="px-4 pb-6 space-y-2">
        <Link
          to={APP_ROUTES.CLEARVIEW_APPLY}
          className="block w-full text-center rounded-none bg-foreground text-background py-3 text-[14px] font-semibold transition-transform"
        >
          {isRu ? CLEARVIEW_LABELS.applyButton.ru : CLEARVIEW_LABELS.applyButton.en}
        </Link>
        <button
          type="button"
          disabled
          className="block w-full text-center rounded-none border border-border bg-card text-muted-foreground py-3 text-[13.5px] cursor-not-allowed"
          title={isRu ? 'Образец будет опубликован' : 'Sample will be published'}
        >
          <FileText className="inline w-4 h-4 mr-1.5 -mt-0.5" />
          {isRu ? 'Образец отчёта (скоро)' : 'Sample report (coming soon)'}
        </button>
        <Link
          to={APP_ROUTES.PRICING}
          className="block w-full text-center rounded-none border border-border bg-card text-foreground py-3 text-[13.5px]"
        >
          {isRu ? 'Все тарифы' : 'All pricing'}
        </Link>
      </section>
    </div>
  );
}
