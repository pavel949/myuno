/**
 * MagnetLandingRenderer — renders a magnet_landings row into a public page.
 * Used by /l/:slug. Pure presentation; data fetched by parent.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, FileText } from 'lucide-react';
import { MagnetCTA } from '@/components/magnets/MagnetCTA';
import type { LandingBlock, MagnetLanding } from '@/hooks/useMagnetLandings';

function pick<T = string>(props: Record<string, unknown>, base: string, isRu: boolean): T | undefined {
  const v = props[`${base}_${isRu ? 'ru' : 'en'}`] ?? props[`${base}_${isRu ? 'en' : 'ru'}`];
  return v as T | undefined;
}

interface Props {
  landing: MagnetLanding;
}

export function MagnetLandingRenderer({ landing }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu ? landing.title_ru : landing.title_en || landing.title_ru;
  const subtitle = isRu ? landing.subtitle_ru : landing.subtitle_en;

  return (
    <div className="min-h-screen bg-background">
      {/* Default hero from row fields */}
      <header className="border-b border-border/50">
        <div
          className="mx-auto max-w-5xl px-5 py-12 sm:py-20"
          style={
            landing.hero_image_url
              ? {
                  backgroundImage: `linear-gradient(180deg, hsl(var(--background)/0.6), hsl(var(--background))), url(${landing.hero_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            {isRu ? 'Бесплатный материал' : 'Free resource'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold leading-tight tracking-tight text-foreground max-w-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          )}
          {landing.magnet_slug && (
            <div className="mt-6">
              <MagnetCTA
                magnetSlug={landing.magnet_slug}
                context={{ type: 'global', slug: landing.slug }}
                buttonSize="lg"
              />
            </div>
          )}
        </div>
      </header>

      {/* Blocks */}
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14 space-y-12">
        {(landing.blocks ?? []).map((b) => (
          <BlockView key={b.id} block={b} isRu={isRu} landing={landing} />
        ))}
      </main>
    </div>
  );
}

function BlockView({ block, isRu, landing }: { block: LandingBlock; isRu: boolean; landing: MagnetLanding }) {
  const p = block.props ?? {};
  switch (block.type) {
    case 'hero': {
      const eyebrow = pick<string>(p, 'eyebrow', isRu);
      const heading = pick<string>(p, 'heading', isRu);
      const ctaLabel = pick<string>(p, 'cta_label', isRu);
      return (
        <section className="text-center space-y-3">
          {eyebrow && <p className="text-xs uppercase tracking-wider text-primary">{eyebrow}</p>}
          {heading && <h2 className="text-2xl sm:text-3xl font-semibold">{heading}</h2>}
          {landing.magnet_slug && ctaLabel && (
            <div className="pt-2">
              <MagnetCTA magnetSlug={landing.magnet_slug} label={ctaLabel} />
            </div>
          )}
        </section>
      );
    }
    case 'benefits': {
      const items = (p.items as Array<Record<string, string>>) ?? [];
      return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{isRu ? it.title_ru : it.title_en}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{isRu ? it.desc_ru : it.desc_en}</p>
            </div>
          ))}
        </section>
      );
    }
    case 'checklist': {
      const items = (p.items as Array<{ ru: string; en: string }>) ?? [];
      return (
        <section>
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-none" />
                <span>{isRu ? it.ru : it.en}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case 'pdf_preview': {
      if (!landing.pdf_url) return null;
      const caption = pick<string>(p, 'caption', isRu);
      return (
        <section className="border border-border bg-muted/30 p-4 text-center">
          {caption && <p className="text-sm text-muted-foreground mb-3">{caption}</p>}
          <iframe
            src={landing.pdf_url}
            title="PDF preview"
            className="w-full h-[600px] border border-border"
          />
          <a
            href={landing.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary mt-3"
          >
            <FileText className="h-4 w-4" /> {isRu ? 'Открыть в новой вкладке' : 'Open in new tab'}
          </a>
        </section>
      );
    }
    case 'testimonial': {
      const quote = pick<string>(p, 'quote', isRu);
      const role = pick<string>(p, 'role', isRu);
      return (
        <section className="border-l-2 border-primary pl-5 py-2 max-w-2xl mx-auto">
          <p className="text-lg italic text-foreground">«{quote}»</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {(p.author as string) ?? ''}
            {role ? ` — ${role}` : ''}
          </p>
        </section>
      );
    }
    case 'faq': {
      const items = (p.items as Array<Record<string, string>>) ?? [];
      return (
        <section className="space-y-3">
          {items.map((it, i) => (
            <details key={i} className="border border-border bg-card p-4 group">
              <summary className="cursor-pointer font-medium text-foreground">
                {isRu ? it.q_ru : it.q_en}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                {isRu ? it.a_ru : it.a_en}
              </p>
            </details>
          ))}
        </section>
      );
    }
    case 'rich_text': {
      const body = pick<string>(p, 'body', isRu) ?? '';
      return (
        <section className="prose prose-invert max-w-none text-foreground">
          <div className="whitespace-pre-line">{body}</div>
        </section>
      );
    }
    case 'cta': {
      const heading = pick<string>(p, 'heading', isRu);
      const label = pick<string>(p, 'label', isRu);
      return (
        <section className="border border-primary/40 bg-primary/5 p-8 text-center space-y-4">
          {heading && <h2 className="text-2xl font-semibold">{heading}</h2>}
          {landing.magnet_slug && (
            <MagnetCTA magnetSlug={landing.magnet_slug} label={label} buttonSize="lg" />
          )}
        </section>
      );
    }
    default:
      return null;
  }
}
