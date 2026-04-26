/**
 * /me/requests — MeRequests
 * Unified request tracker (Kanban-style 4 buckets).
 *
 * Optional URL filter: `?source=visa|order|concierge` narrows the board to
 * a single source. Used by the PersonaHalo activity-badge deep-link so a
 * tap on the Legal cluster's "2 open" badge lands on visa-only requests.
 */
import React, { useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, ChevronRight, X } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyRequests, type MyRequest, type RequestStatus, type RequestSource } from '@/hooks/useMyRequests';

const COLUMNS: { key: RequestStatus; en: string; ru: string }[] = [
  { key: 'new',         en: 'New',         ru: 'Новые' },
  { key: 'in_progress', en: 'In progress', ru: 'В работе' },
  { key: 'waiting',     en: 'Waiting',     ru: 'Ожидание' },
  { key: 'done',        en: 'Done',        ru: 'Завершено' },
];

const SOURCE_LABEL: Record<RequestSource, { en: string; ru: string }> = {
  concierge: { en: 'Concierge', ru: 'Консьерж' },
  visa: { en: 'Visa', ru: 'Виза' },
  order: { en: 'Orders', ru: 'Заказы' },
};

const VALID_SOURCES: RequestSource[] = ['concierge', 'visa', 'order'];

function RequestCard({ r }: { r: MyRequest }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const inner = (
    <Card variant={r.detailPath ? 'interactive' : 'content'}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug line-clamp-2">{r.title}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date(r.createdAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-GB')}
              {r.subtitle ? ` · ${r.subtitle}` : ''}
            </p>
          </div>
          {r.detailPath && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
        <Badge variant="outline" className="mt-2 text-[10px] font-normal capitalize">
          {r.source}
        </Badge>
      </CardContent>
    </Card>
  );
  return r.detailPath ? <Link to={r.detailPath}>{inner}</Link> : inner;
}

export default function MeRequests() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useMyRequests();
  const [searchParams, setSearchParams] = useSearchParams();

  const sourceParam = searchParams.get('source') ?? '';
  const activeSource = (VALID_SOURCES as string[]).includes(sourceParam)
    ? (sourceParam as RequestSource)
    : null;

  const filteredData = useMemo(() => {
    if (!data) return data;
    if (!activeSource) return data;
    return data.filter((r) => r.source === activeSource);
  }, [data, activeSource]);

  const clearSource = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('source');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <MeShellLayout title={isRu ? 'Заявки' : 'Requests'}>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isRu ? 'Мои заявки' : 'My requests'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu
              ? 'Статусы всех ваших обращений в одном месте.'
              : 'Status of all your requests in one place.'}
          </p>

          {/* Active source filter pill — surfaces PersonaHalo deep-link context. */}
          {activeSource && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                {isRu ? 'Фильтр' : 'Filter'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {isRu ? SOURCE_LABEL[activeSource].ru : SOURCE_LABEL[activeSource].en}
              </span>
              <button
                type="button"
                onClick={clearSource}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isRu ? 'Сбросить фильтр' : 'Clear filter'}
              >
                <X className="w-3 h-3" />
                {isRu ? 'Сбросить' : 'Clear'}
              </button>
            </div>
          )}
        </header>

        {isLoading ? (
          <LoadingState />
        ) : !filteredData || filteredData.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={activeSource
              ? (isRu ? 'Ничего не найдено' : 'Nothing found')
              : (isRu ? 'Заявок нет' : 'No requests')}
            description={activeSource
              ? (isRu ? 'По выбранному фильтру нет заявок.' : 'No requests match the selected filter.')
              : (isRu ? 'Здесь будут отображаться ваши обращения.' : 'Your requests will appear here.')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const items = filteredData.filter((r) => r.status === col.key);
              return (
                <div key={col.key} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-semibold">{isRu ? col.ru : col.en}</h3>
                    <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1 py-2">
                        {isRu ? 'Пусто' : 'Empty'}
                      </p>
                    ) : (
                      items.map((r) => <RequestCard key={r.id} r={r} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MeShellLayout>
  );
}
