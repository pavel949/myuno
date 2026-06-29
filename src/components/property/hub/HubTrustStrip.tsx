/**
 * HubTrustStrip — page-level trust band for the Real Estate Hub.
 *
 * Distinct from the card-level TrustStrip (which renders per-listing risk chips).
 * Four civic-grade reassurances, semantic tokens only, sharp corners.
 */
import React from 'react';
import { BadgeCheck, Scale, ShieldCheck, MapPin } from 'lucide-react';

type TFn = (key: string) => string;

const ITEMS: { icon: React.ElementType; labelKey: string }[] = [
  { icon: BadgeCheck, labelKey: 'propertyHub.landing.trust.verified' },
  { icon: Scale, labelKey: 'propertyHub.landing.trust.escrow' },
  { icon: ShieldCheck, labelKey: 'propertyHub.landing.trust.clearview' },
  { icon: MapPin, labelKey: 'propertyHub.landing.trust.localTeam' },
];

export function HubTrustStrip({ t }: { t: TFn }) {
  return (
    <section aria-label={t('propertyHub.landing.trust.clearview')}>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-none border border-border bg-border sm:grid-cols-4">
        {ITEMS.map(({ icon: Icon, labelKey }) => (
          <div
            key={labelKey}
            className="flex items-center gap-2.5 bg-card px-4 py-3.5"
          >
            <Icon className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-xs font-medium leading-snug text-foreground">
              {t(labelKey)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
