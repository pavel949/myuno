/**
 * ClearViewLanding — product landing for ClearView project rating.
 * Audience: developers (primary), buyers (informational).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { CLEARVIEW_LABELS, GOV_BUTTONS } from '@/lib/copy/govStyle';
import { APP_ROUTES } from '@/lib/config/routes';
import { ArrowLeft, ShieldCheck, FileText, ListChecks } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ClearViewLanding() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false}>
      <div className="min-h-screen bg-background pb-16">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
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
          <div className="rounded-[14px] border border-border bg-card p-4">
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

        <section className="px-4 pb-5">
          <h3 className="font-display text-[14px] font-semibold text-foreground mb-2">
            {isRu ? CLEARVIEW_LABELS.methodology.ru : CLEARVIEW_LABELS.methodology.en}
          </h3>
          <ul className="space-y-1.5 text-[13px] text-foreground/90">
            {[
              { ru: 'Юридический статус — 20%', en: 'Legal status — 20%' },
              { ru: 'Девелопер и репутация — 20%', en: 'Developer and track record — 20%' },
              { ru: 'Строительство — 15%', en: 'Construction — 15%' },
              { ru: 'Локация — 15%', en: 'Location — 15%' },
              { ru: 'Финансы — 10%', en: 'Financial — 10%' },
              { ru: 'ROI и доходность — 10%', en: 'ROI and yield — 10%' },
              { ru: 'Продажи — 5%', en: 'Sales — 5%' },
              { ru: 'Ликвидность — 5%', en: 'Liquidity — 5%' },
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <ListChecks className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
                <span>{isRu ? line.ru : line.en}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="px-4 pb-5">
          <div className="rounded-[12px] border border-border bg-muted/30 p-3">
            <p className="text-[12px] text-muted-foreground leading-snug">
              {isRu ? CLEARVIEW_LABELS.yearOneNote.ru : CLEARVIEW_LABELS.yearOneNote.en}
            </p>
          </div>
        </section>

        <section className="px-4 pb-6 space-y-2">
          <Link
            to={APP_ROUTES.CLEARVIEW_APPLY}
            className="block w-full text-center rounded-[12px] bg-foreground text-background py-3 text-[14px] font-semibold active:scale-[0.99] transition-transform"
          >
            {isRu ? CLEARVIEW_LABELS.applyButton.ru : CLEARVIEW_LABELS.applyButton.en}
          </Link>
          <button
            type="button"
            disabled
            className="block w-full text-center rounded-[12px] border border-border bg-card text-muted-foreground py-3 text-[13.5px] cursor-not-allowed"
            title={isRu ? 'Образец будет опубликован' : 'Sample will be published'}
          >
            <FileText className="inline w-4 h-4 mr-1.5 -mt-0.5" />
            {isRu ? 'Образец отчёта (скоро)' : 'Sample report (coming soon)'}
          </button>
          <Link
            to={APP_ROUTES.PRICING}
            className="block w-full text-center rounded-[12px] border border-border bg-card text-foreground py-3 text-[13.5px]"
          >
            {isRu ? 'Все тарифы' : 'All pricing'}
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
