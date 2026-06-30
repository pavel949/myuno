/**
 * HubTrustStrip — page-level trust band (distinct from the card-level
 * TrustStrip). Content-driven so both the property hub and the investor hub can
 * pass their own reassurances. Semantic tokens only, sharp corners.
 */
import React from 'react';

export interface HubTrustItem {
  icon: React.ElementType;
  label: string;
}

interface HubTrustStripProps {
  items: HubTrustItem[];
  ariaLabel?: string;
}

export function HubTrustStrip({ items, ariaLabel }: HubTrustStripProps) {
  return (
    <section aria-label={ariaLabel}>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-none border border-border bg-border sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 bg-card px-4 py-3.5">
            <Icon className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-xs font-medium leading-snug text-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
