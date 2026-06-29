/**
 * ClearViewCallout — a single editorial callout surfacing the ClearView™ rating
 * as the hub's trust differentiator. One accent border; links to the ClearView
 * product page and the "why myUNO" explainer.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Gauge, ArrowRight } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

type TFn = (key: string) => string;

export function ClearViewCallout({ t }: { t: TFn }) {
  return (
    <section
      aria-labelledby="hub-clearview-heading"
      className="rounded-none border border-accent/40 bg-card p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-accent/15 text-accent">
          <Gauge className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="hub-clearview-heading"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            {t('propertyHub.landing.clearview.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {t('propertyHub.landing.clearview.desc')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link
              to={APP_ROUTES.CLEARVIEW}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              {t('propertyHub.landing.clearview.cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={APP_ROUTES.WHY_MYUNO}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t('propertyHub.landing.clearview.why')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
