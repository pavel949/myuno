import { Link } from 'react-router-dom';
import { Bell, BellOff, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNbSavedSearches, type NbSavedSearch } from '@/hooks/useNbSavedSearches';

const PREVIEW_LIMIT = 3;

function alertChannelLabel(search: NbSavedSearch, isRu: boolean): string {
  if (!search.is_active) return isRu ? 'Оповещения выключены' : 'Alerts off';
  const channels = [
    search.notify_email ? 'Email' : null,
    search.notify_whatsapp ? 'WhatsApp' : null,
  ].filter((channel): channel is string => channel !== null);
  if (channels.length === 0) return isRu ? 'Без оповещений' : 'No alert channel';
  const frequency = {
    instant: isRu ? 'сразу' : 'instant',
    daily: isRu ? 'раз в день' : 'daily',
    weekly: isRu ? 'раз в неделю' : 'weekly',
  }[search.frequency];
  return `${channels.join(' · ')} · ${frequency}`;
}

/**
 * Saved searches block at the top of the Saved page (Design Bible G9):
 * search name + alert channel, with a link to manage them.
 */
export function SavedSearchesSummary() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { list } = useNbSavedSearches();
  const searches = list.data ?? [];

  if (list.isLoading) {
    return <Skeleton className="h-24 w-full" aria-label={isRu ? 'Загрузка сохранённых поисков' : 'Loading saved searches'} />;
  }

  return (
    <section aria-labelledby="saved-searches-title" className="border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id="saved-searches-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Сохранённые поиски' : 'Saved searches'}
          {searches.length > 0 && <span className="ml-1 font-mono tabular-nums">· {searches.length}</span>}
        </h2>
        <Link to="/account/saved-searches" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
          {isRu ? 'Управлять' : 'Manage'}
        </Link>
      </div>

      {list.isError ? (
        <div role="alert" className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <span className="text-foreground">
            {isRu ? 'Не удалось загрузить сохранённые поиски.' : "We couldn't load your saved searches."}
          </span>
          <button type="button" onClick={() => void list.refetch()} className="min-h-11 font-medium text-primary hover:underline">
            {isRu ? 'Повторить' : 'Try again'}
          </button>
        </div>
      ) : searches.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          {isRu
            ? 'Сохраните поиск в каталоге новостроек — новые совпадения будут приходить на email или в WhatsApp.'
            : 'Save a search in the off-plan catalogue to get new matches by email or WhatsApp.'}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {searches.slice(0, PREVIEW_LIMIT).map((search) => {
            const AlertIcon = search.is_active && (search.notify_email || search.notify_whatsapp) ? Bell : BellOff;
            return (
              <li key={search.id}>
                <Link
                  to="/account/saved-searches"
                  className="flex min-h-14 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <AlertIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{search.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{alertChannelLabel(search, isRu)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
