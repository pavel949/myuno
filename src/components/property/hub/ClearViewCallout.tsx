/**
 * ClearViewCallout — editorial callout surfacing ClearView™ as a trust
 * differentiator. Content-driven so it can be reused across the property hub
 * and the investor hub (callers pass their own copy + routes).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Gauge, ArrowRight } from 'lucide-react';

interface ClearViewCalloutProps {
  title: string;
  desc: string;
  ctaLabel: string;
  ctaTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function ClearViewCallout({
  title,
  desc,
  ctaLabel,
  ctaTo,
  secondaryLabel,
  secondaryTo,
}: ClearViewCalloutProps) {
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
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link
              to={ctaTo}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {secondaryLabel && secondaryTo && (
              <Link
                to={secondaryTo}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
