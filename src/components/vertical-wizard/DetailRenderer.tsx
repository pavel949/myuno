import { useLanguage } from '@/contexts/LanguageContext';
import type { VerticalSpec, DetailSection, LocalizedText } from '@/lib/vertical-specs/types';
import { getPath } from '@/lib/vertical-specs/pathUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Star } from 'lucide-react';

const t = (l: LocalizedText, lang: 'en' | 'ru') => l[lang] ?? l.en;

interface Props {
  spec: VerticalSpec;
  row: Record<string, unknown>;
  onContact?: () => void;
}

/**
 * Renders public listing detail page from VerticalSpec.detail[] sections.
 * Each section maps to a renderer key; missing data hides gracefully.
 */
export function DetailRenderer({ spec, row, onContact }: Props) {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const attrs = (row.attributes as Record<string, unknown>) ?? {};

  const sections = spec.detail.filter((s) => {
    if (!s.showIf) return true;
    return getPath(row, s.showIf.key) === s.showIf.equals;
  });

  return (
    <article className="space-y-6">
      {sections.map((s) => (
        <Section key={s.id} section={s} row={row} attrs={attrs} spec={spec} lang={lang} onContact={onContact} />
      ))}
    </article>
  );
}

function Section({
  section, row, attrs, spec, lang, onContact,
}: {
  section: DetailSection;
  row: Record<string, unknown>;
  attrs: Record<string, unknown>;
  spec: VerticalSpec;
  lang: 'en' | 'ru';
  onContact?: () => void;
}) {
  const title = (attrs.title as { en?: string; ru?: string }) ?? {};
  const description = (attrs.description as { en?: string; ru?: string }) ?? {};
  const address = (attrs.address as { line?: string; lat?: number; lng?: number }) ?? {};
  const gallery = (row.gallery as string[]) ?? (row.images as string[]) ?? [];
  const cover = (row.cover_image as string) || gallery[0];

  switch (section.render) {
    case 'hero':
      return (
        <header className="space-y-2">
          {cover && (
            <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
              <img src={cover} alt={title[lang] || ''} className="h-full w-full object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-semibold">
            {title[lang] || (row.name_en as string) || (row.name_ru as string)}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {typeof row.rating === 'number' && (row.rating as number) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current" />
                {(row.rating as number).toFixed(1)}
                {typeof row.review_count === 'number' && ` (${row.review_count})`}
              </span>
            )}
            {address.line && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {address.line}
              </span>
            )}
          </div>
        </header>
      );

    case 'description':
      if (!description[lang]) return null;
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Описание' : 'About'} lang={lang} />
          <p className="text-sm leading-relaxed whitespace-pre-line">{description[lang]}</p>
        </section>
      );

    case 'amenities': {
      const amenities = (attrs.amenities as string[]) ?? (attrs.ambiance as string[]) ?? [];
      if (!amenities.length) return null;
      // resolve labels from spec
      const allOptions = spec.editorTabs
        .flatMap((t) => t.groups)
        .flatMap((g) => g.fields)
        .flatMap((f) => f.options ?? []);
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Удобства' : 'Amenities'} lang={lang} />
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((a) => {
              const o = allOptions.find((x) => x.value === a);
              return <Badge key={a} variant="secondary">{o ? t(o.label, lang) : a}</Badge>;
            })}
          </div>
        </section>
      );
    }

    case 'gallery':
      if (gallery.length === 0) return null;
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Галерея' : 'Gallery'} lang={lang} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {gallery.slice(0, 9).map((src, i) => (
              <div key={i} className="aspect-square bg-muted overflow-hidden">
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      );

    case 'map':
      if (typeof address.lat !== 'number' || typeof address.lng !== 'number') return null;
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'На карте' : 'Map'} lang={lang} />
          <a
            href={`https://www.google.com/maps?q=${address.lat},${address.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-[16/9] bg-muted relative overflow-hidden"
          >
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${address.lat},${address.lng}&zoom=15&size=600x300&markers=color:red%7C${address.lat},${address.lng}`}
              alt="Map"
              className="h-full w-full object-cover"
            />
          </a>
        </section>
      );

    case 'hours': {
      const hours = attrs.hours as Record<string, { open?: string; close?: string; closed?: boolean }> | undefined;
      if (!hours || typeof hours !== 'object') return null;
      const days: { key: string; en: string; ru: string }[] = [
        { key: 'mon', en: 'Mon', ru: 'Пн' }, { key: 'tue', en: 'Tue', ru: 'Вт' },
        { key: 'wed', en: 'Wed', ru: 'Ср' }, { key: 'thu', en: 'Thu', ru: 'Чт' },
        { key: 'fri', en: 'Fri', ru: 'Пт' }, { key: 'sat', en: 'Sat', ru: 'Сб' },
        { key: 'sun', en: 'Sun', ru: 'Вс' },
      ];
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Часы работы' : 'Hours'} lang={lang} />
          <ul className="text-sm grid grid-cols-2 gap-y-1">
            {days.map((d) => {
              const h = hours[d.key];
              return (
                <li key={d.key} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{lang === 'ru' ? d.ru : d.en}</span>
                  <span className="font-mono">{h?.closed ? (lang === 'ru' ? 'закрыто' : 'closed') : `${h?.open ?? '—'}–${h?.close ?? '—'}`}</span>
                </li>
              );
            })}
          </ul>
        </section>
      );
    }

    case 'menu': {
      const menuUrl = attrs.menu_url as string | undefined;
      const menuMedia = (attrs.menu_media as string[]) ?? [];
      if (!menuUrl && menuMedia.length === 0) return null;
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Меню' : 'Menu'} lang={lang} />
          {menuUrl && (
            <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
              {lang === 'ru' ? 'Открыть меню' : 'View menu'}
            </a>
          )}
          {menuMedia.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {menuMedia.map((src, i) => (
                <img key={i} src={src} alt="menu" className="aspect-square object-cover" loading="lazy" />
              ))}
            </div>
          )}
        </section>
      );
    }

    case 'pricing': {
      const items = [
        { k: 'price_daily', en: 'Per night', ru: 'За ночь' },
        { k: 'price_monthly', en: 'Per month', ru: 'За месяц' },
        { k: 'price_sale', en: 'Sale price', ru: 'Цена продажи' },
        { k: 'price_half_day', en: 'Half-day', ru: 'Полдня' },
        { k: 'price_full_day', en: 'Full day', ru: 'Полный день' },
        { k: 'price_overnight', en: 'Per night', ru: 'За ночь' },
      ].filter((p) => typeof (attrs as Record<string, unknown>)[p.k] === 'number');
      if (items.length === 0 && typeof row.price !== 'number') return null;
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Цены' : 'Pricing'} lang={lang} />
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            {items.map((p) => (
              <div key={p.k} className="contents">
                <dt className="text-muted-foreground">{lang === 'ru' ? p.ru : p.en}</dt>
                <dd className="font-mono text-right">฿ {((attrs as Record<string, unknown>)[p.k] as number).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }

    case 'reviews':
      // Placeholder — wires into reviews subsystem in next pass.
      return null;

    case 'policies': {
      const rules: { k: string; en: string; ru: string }[] = [
        { k: 'check_in', en: 'Check-in', ru: 'Заезд' },
        { k: 'check_out', en: 'Check-out', ru: 'Выезд' },
        { k: 'min_stay', en: 'Min stay (nights)', ru: 'Мин. срок (ночей)' },
        { k: 'cancellation_hours', en: 'Free cancellation (h)', ru: 'Бесп. отмена (ч)' },
      ].filter((r) => (attrs as Record<string, unknown>)[r.k] !== undefined && (attrs as Record<string, unknown>)[r.k] !== '');
      if (rules.length === 0) return null;
      return (
        <section className="space-y-2">
          <SectionTitle title={section.title} fallback={lang === 'ru' ? 'Правила' : 'Policies'} lang={lang} />
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            {rules.map((r) => (
              <div key={r.k} className="contents">
                <dt className="text-muted-foreground">{lang === 'ru' ? r.ru : r.en}</dt>
                <dd className="font-mono text-right">{String((attrs as Record<string, unknown>)[r.k])}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }

    case 'cta':
      return (
        <section className="sticky bottom-4 z-10 flex gap-2">
          <Button className="flex-1" onClick={onContact}>
            {lang === 'ru' ? 'Связаться' : 'Contact'}
          </Button>
          {attrs.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${attrs.phone as string}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
        </section>
      );

    case 'staff':
    case 'units':
    default:
      return null;
  }
}

function SectionTitle({ title, fallback, lang }: { title?: LocalizedText; fallback: string; lang: 'en' | 'ru' }) {
  return <h2 className="text-base font-medium">{title ? t(title, lang) : fallback}</h2>;
}
