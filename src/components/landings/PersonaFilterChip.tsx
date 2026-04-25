/**
 * @component PersonaFilterChip
 * @description Dismissable chip surfaced at the top of catalog pages when
 * the URL carries `?persona=<slug>` so users always know what the catalog
 * is filtered for and can clear it in one tap.
 *
 * Renders nothing if no persona is active.
 */

import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { getPersonaTheme } from '@/lib/landings/personaTheme';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function PersonaFilterChip({ className }: Props) {
  const { language } = useLanguage();
  const { personaSlug, clearPersona } = usePersonaFilter();
  if (!personaSlug) return null;

  const theme = getPersonaTheme(personaSlug);
  const Icon = theme.icon;
  const isRu = language === 'ru';
  const tagline = isRu ? theme.tagline.ru : theme.tagline.en;
  const label = isRu ? `Подобрано для: ${tagline}` : `Filtered for: ${tagline}`;
  const clearLabel = isRu ? 'Сбросить' : 'Clear';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border border-border bg-card px-3 py-2',
        className,
      )}
      style={{ borderColor: tokenColor(theme.color, 0.4) }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className="h-4 w-4 shrink-0"
          style={{ color: tokenColor(theme.color) }}
          aria-hidden
        />
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <Link
          to={`/for/${personaSlug}`}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {isRu ? 'почему?' : 'why?'}
        </Link>
      </div>
      <button
        type="button"
        onClick={clearPersona}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={clearLabel}
      >
        <X className="h-3 w-3" />
        <span>{clearLabel}</span>
      </button>
    </div>
  );
}
