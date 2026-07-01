/**
 * PersonaClusterHero — civic hero shared by persona (`/for/:persona`) and
 * cluster landing templates, which previously hand-rolled a near-identical
 * gradient hero each.
 *
 * Matches the Landing.tsx reference (DS 2.1 "civic infrastructure"):
 * font-display token type scale, flat light surface, sharp corners, no
 * gradient wash and no glow. Each page's per-identity accent survives only as
 * a restrained hairline + eyebrow tint — a single accent, not a background.
 */
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { LandingContainer } from './LandingPrimitives';

export interface PersonaClusterHeroCta {
  label: string;
  href: string;
  subtitle?: string;
}

export interface PersonaClusterHeroProps {
  icon: LucideIcon;
  /** Per-identity accent — a token name or hsl base consumed by tokenColor(). */
  accentColor: string;
  /** Resolved eyebrow label (already localised). */
  eyebrow: string;
  /** Resolved h1 (already localised). */
  title: string;
  /** Resolved subtitle (already localised). */
  subtitle: string;
  primary: PersonaClusterHeroCta;
  secondary?: PersonaClusterHeroCta;
}

export function PersonaClusterHero({
  icon: Icon,
  accentColor,
  eyebrow,
  title,
  subtitle,
  primary,
  secondary,
}: PersonaClusterHeroProps) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-background">
      {/* Per-identity accent hairline (restrained single accent, no glow) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ background: tokenColor(accentColor) }}
      />
      <LandingContainer className="relative max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-none border bg-background px-3 py-1.5"
          style={{ borderColor: tokenColor(accentColor, 0.4) }}
        >
          <Icon className="h-4 w-4" style={{ color: tokenColor(accentColor) }} strokeWidth={1.75} />
          <span className="font-sans text-caption font-medium uppercase tracking-[0.12em] text-foreground">
            {eyebrow}
          </span>
        </div>
        <h1 className="font-display text-h1 font-normal leading-[1.05] tracking-tight text-foreground sm:text-display">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl font-sans text-body-lg leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={primary.href}>
              {primary.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          {secondary ? (
            <Button asChild size="lg" variant="outline">
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : null}
        </div>
        {primary.subtitle ? (
          <p className="mt-3 font-sans text-caption text-muted-foreground">{primary.subtitle}</p>
        ) : null}
      </LandingContainer>
    </header>
  );
}
