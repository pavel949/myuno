/**
 * LandingShell — minimal page shell for Wave 1 marketing landings.
 * Provides hero, benefits grid, and a slot for the lead form / extra sections.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEOHead } from '@/components/seo';

export interface LandingBenefit {
  icon: React.ComponentType<{ className?: string }>;
  title: { ru: string; en: string };
  desc: { ru: string; en: string };
}

export interface LandingShellProps {
  eyebrow?: { ru: string; en: string };
  title: { ru: string; en: string };
  subtitle: { ru: string; en: string };
  badges?: { ru: string; en: string }[];
  benefits: LandingBenefit[];
  /** Lead form (or any CTA block) rendered in the right column on desktop. */
  formSlot: React.ReactNode;
  /** Optional extra sections rendered below the hero. */
  children?: React.ReactNode;
  seoTitle: { ru: string; en: string };
  seoDescription: { ru: string; en: string };
}

export function LandingShell({
  eyebrow,
  title,
  subtitle,
  badges,
  benefits,
  formSlot,
  children,
  seoTitle,
  seoDescription,
}: LandingShellProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t(seoTitle)} description={t(seoDescription)} />

      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t({ ru: 'Назад', en: 'Back' })}
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14 items-start">
          <div>
            {eyebrow && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
                {t(eyebrow)}
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl font-semibold leading-tight tracking-tight text-foreground">
              {t(title)}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">{t(subtitle)}</p>

            {badges && badges.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <Badge key={i} variant="secondary">
                    {t(b)}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-none border border-border bg-card p-4"
                >
                  <div className="flex-none p-2 rounded-none bg-primary/10 h-fit">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{t(b.title)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t(b.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-20">{formSlot}</aside>
        </div>
      </section>

      {children && (
        <section className="mx-auto max-w-6xl px-4 pb-16 space-y-10">{children}</section>
      )}
    </div>
  );
}

export function LandingChecklist({
  items,
}: {
  items: { ru: string; en: string }[];
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
          <Check className="h-4 w-4 text-primary mt-0.5 flex-none" />
          <span>{isRu ? it.ru : it.en}</span>
        </li>
      ))}
    </ul>
  );
}

export default LandingShell;
