/**
 * SectionHead — canonical section header used across Home blocks.
 *
 * Per design package v5 (`screen.jsx · SectionHead`): one and only one
 * micro-heading style for every section on the Home surface.
 *
 *  - title:  11px / uppercase / tracking 0.12em / muted-foreground/60 / semibold
 *  - meta:   11px / muted-foreground/50 (right-aligned, optional)
 *
 * Use this component instead of inlining `<div className="text-[11px] tracking-…">`
 * in feed / actions / cluster / concierge headings. One source of truth keeps
 * the visual rhythm of the Home page regular.
 */
import React from 'react';

interface SectionHeadProps {
  title: string;
  meta?: string;
  className?: string;
}

export function SectionHead({ title, meta, className }: SectionHeadProps) {
  return (
    <div className={`flex items-baseline justify-between mb-2.5 ${className ?? ''}`}>
      <div className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 font-semibold">
        {title}
      </div>
      {meta && (
        <div className="text-[11px] text-muted-foreground/50">{meta}</div>
      )}
    </div>
  );
}
