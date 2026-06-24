/**
 * @module BundleCard
 * @description Presentational card for a § 10 service bundle. Bilingual,
 * design-token compliant. CTA is caller-supplied so it can drop into the
 * existing lead/concierge flow (persona-param preserved).
 */

import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ServiceBundle } from '@/lib/segmentation/bundles';

interface BundleCardProps {
  bundle: ServiceBundle;
  /** Where the CTA points — typically the persona landing's primary CTA. */
  ctaHref: string;
  /** Optional accent (token-derived rgba) for the icon chip. */
  accent?: string;
}

export function BundleCard({ bundle, ctaHref, accent }: BundleCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(pair: { ru: T; en: T }): T => (isRu ? pair.ru : pair.en);

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 items-center justify-center text-xl"
            style={accent ? { background: accent } : undefined}
          >
            {bundle.icon}
          </span>
          <h3 className="text-lg font-semibold text-foreground">{t(bundle.name)}</h3>
        </div>
        <span className="shrink-0 text-right font-mono text-sm font-semibold text-accent">
          {t(bundle.price)}
        </span>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {bundle.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{t(item)}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-5 w-full sm:w-auto">
        <a href={ctaHref}>
          {isRu ? 'Запросить пакет' : 'Request this bundle'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

export default BundleCard;
