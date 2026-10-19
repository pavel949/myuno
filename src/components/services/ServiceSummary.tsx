import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { servicePriceLabel } from '@/lib/services/servicePresentation';

/** Shared content only: each vertical retains its own safe action and writer. */
export function ServiceSummary({ name, description, price, currency, durationMinutes, actionLabel }: {
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  durationMinutes?: number | null;
  actionLabel?: string;
}) {
  const { language } = useLanguage();
  const duration = durationMinutes != null && Number.isFinite(durationMinutes) && durationMinutes > 0
    ? `${durationMinutes} ${pickLang(language, { ru: 'мин', en: 'min', th: 'นาที' })}` : null;
  return <span className="flex min-w-0 flex-1 flex-col gap-2">
    <span className="font-display text-base font-medium leading-snug line-clamp-2">{name}</span>
    {description && <span className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{description}</span>}
    <span className="mt-auto flex flex-col gap-1 border-t border-border pt-3 text-sm">
      <span className="font-medium text-primary">{servicePriceLabel(price, currency, language)}</span>
      {duration && <span className="text-muted-foreground">{duration}</span>}
    </span>
    {actionLabel && <span className="inline-flex min-h-11 items-center text-sm font-medium text-primary">{actionLabel}</span>}
  </span>;
}
