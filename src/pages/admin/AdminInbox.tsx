/**
 * Admin Inbox — единая очередь всех входящих заявок и сигналов.
 *
 * Источники:
 *   • partner_applications     — заявки от потенциальных партнёров
 *   • listing_applications     — заявки на размещение листингов
 *   • consultation_requests    — заявки на консультации (legal, visa, real estate, ...)
 *   • nb_leads                 — лиды по новостройкам
 *   • property_inquiries       — запросы по property
 *
 * Каждый источник нормализуется в `InboxItem`. Без realtime пока — простой
 * refetch через React Query (staleTime 60s). Realtime-канал добавим, когда
 * объёмы заявок превысят ~200/день.
 */
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Inbox, Search, Filter, ExternalLink, AlertCircle, MessageSquare, Building2, Briefcase, Sparkles, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale, enUS as enLocale } from 'date-fns/locale';
import { fetchInbox, type InboxSource, type InboxStatus } from '@/lib/adminInbox';

const SOURCE_META: Record<InboxSource, { labelRu: string; labelEn: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  partner_applications:  { labelRu: 'Партнёры',     labelEn: 'Partners',     icon: Briefcase,     color: 'hsl(var(--cluster-build))' },
  listing_applications:  { labelRu: 'Листинги',     labelEn: 'Listings',     icon: Building2,     color: 'hsl(var(--cluster-manage))' },
  consultation_requests: { labelRu: 'Консультации', labelEn: 'Consults',     icon: MessageSquare, color: 'hsl(var(--cluster-legal))' },
  nb_leads:              { labelRu: 'Новостройки',  labelEn: 'Newbuilds',    icon: Sparkles,      color: 'hsl(var(--cluster-invest))' },
  property_inquiries:    { labelRu: 'Property',     labelEn: 'Property',     icon: Home,          color: 'hsl(var(--cluster-live))' },
};

const TABS: { id: InboxStatus | 'all'; labelRu: string; labelEn: string }[] = [
  { id: 'all',         labelRu: 'Все',         labelEn: 'All' },
  { id: 'new',         labelRu: 'Новые',       labelEn: 'New' },
  { id: 'in_progress', labelRu: 'В работе',    labelEn: 'In progress' },
  { id: 'escalated',   labelRu: 'Эскалация',   labelEn: 'Escalated' },
  { id: 'closed',      labelRu: 'Закрытые',    labelEn: 'Closed' },
];
const SEARCH_HINTS: Record<InboxSource, [string, string]> = {
  partner_applications: ['Business, name, email, category', 'Компания, имя, email, категория'],
  listing_applications: ['Name, email, exact type, category', 'Имя, email, точный тип, категория'],
  consultation_requests: ['Name, email, request type, vertical', 'Имя, email, тип запроса, направление'],
  nb_leads: ['Name, email, phone', 'Имя, email, телефон'],
  property_inquiries: ['Name, email, phone, message', 'Имя, email, телефон, сообщение'],
};

export default function AdminInbox() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<InboxStatus | 'all'>('new');
  const [sourceFilter, setSourceFilter] = useState<InboxSource>('partner_applications');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-inbox', user?.id, sourceFilter, page, tab, query], enabled: !!user,
    queryFn: () => fetchInbox(sourceFilter, page, tab, query),
    staleTime: 60_000,
    refetchInterval: 90_000,
  });

  const items = data?.items;
  const filtered = items ?? [];

  return (
    <AppLayout>
      <PageShell width="wide">
        {/* Header */}
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
              {isRu ? 'Админ · Инбокс' : 'Admin · Inbox'}
            </p>
            <h1 className="text-[26px] sm:text-[32px] font-serif font-semibold leading-tight tracking-[-0.02em] text-foreground flex items-center gap-3">
              <Inbox className="w-7 h-7 text-primary" strokeWidth={1.5} />
              {isRu ? 'Единая очередь заявок' : 'Unified application queue'}
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-2xl">
              {isRu
                ? 'Партнёры, листинги, консультации, лиды по новостройкам и Property — в одном списке.'
                : 'Partners, listings, consultations, newbuild leads and property inquiries — in separate source queues.'}
            </p>
          </div>
        </header>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border mb-4" role="tablist">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const count = t.id === tab && !isError ? data?.total : null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setPage(0); }}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'shrink-0 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {isRu ? t.labelRu : t.labelEn}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{count ?? "—"}</span>
              </button>
            );
          })}
        </div>

        {/* Source filter + search */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <div className="flex gap-1.5 items-center flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {(Object.keys(SOURCE_META) as InboxSource[]).map((src) => {
              const m = SOURCE_META[src];
              const isActive = sourceFilter === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => { setSourceFilter(src); setPage(0); }}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium border whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  style={!isActive ? { borderLeftWidth: 2, borderLeftColor: m.color } : undefined}
                >
                  {isRu ? m.labelRu : m.labelEn}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              type="search"
              aria-label={isRu ? 'Поиск заявок' : 'Search applications'}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={SEARCH_HINTS[sourceFilter][isRu ? 1 : 0]}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-border bg-card focus:border-primary outline-hidden"
            />
          </div>
        </div>

        <nav aria-label="Application source pages" className="mb-4 flex items-center gap-3 text-sm">
          <button className="min-h-11 underline disabled:opacity-40" disabled={page === 0 || isFetching} onClick={() => setPage(value => value - 1)}>{isRu ? 'Назад' : 'Previous'}</button>
          <span>{page + 1} · {isError ? '—' : data?.total ?? '—'}</span>
          <button className="min-h-11 underline disabled:opacity-40" disabled={isFetching || isError || !data || (page + 1) * 50 >= data.total} onClick={() => setPage(value => value + 1)}>{isRu ? 'Далее' : 'Next'}</button>
          <span>{isRu ? 'Отдельная страница и количество для выбранного источника. Поиск и фильтры применяются на сервере.' : 'Separate page and count for the selected source. Filters and search apply on the server.'}</span>
        </nav>
        <p className="mb-4 text-xs text-muted-foreground">{isRu ? 'Фильтры используют точные сохранённые статусы. Остальные статусы доступны во вкладке «Все» с исходным названием.' : 'Filters match stored statuses exactly. Other statuses remain under All with their original label.'}</p>
        {/* List */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-none" />)}
          </div>
        )}

        {isError && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {isRu ? 'Не удалось загрузить инбокс. ' : 'Failed to load inbox. '}
            <button onClick={() => refetch()} className="underline">{isRu ? 'Повторить' : 'Retry'}</button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border">
            {isRu ? 'Здесь пусто — нет заявок по выбранным фильтрам.' : 'Nothing here — no items match the filters.'}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border border-border bg-card divide-y divide-border">
            {filtered.map((item) => {
              const meta = SOURCE_META[item.source];
              const Icon = meta.icon;
              const ago = formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
                locale: isRu ? ruLocale : enLocale,
              });
              return (
                <Link
                  key={`${item.source}-${item.id}`}
                  to={item.href}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${meta.color.replace('hsl', 'hsla').replace(')', ' / 0.12)')}` }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {isRu ? meta.labelRu : meta.labelEn}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[10px] uppercase tracking-[0.1em] px-1.5',
                          item.status === 'new' && 'text-accent',
                          item.status === 'escalated' && 'text-destructive',
                          item.status === 'closed' && 'text-muted-foreground/60',
                          item.status === 'in_progress' && 'text-primary',
                        )}
                      >
                        {item.status === 'other' ? `${isRu ? 'Другой статус' : 'Other status'}: ${item.rawStatus}` : item.rawStatus}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/60 ml-auto">{ago}</span>
                    </div>
                    <div className="mt-1 text-[14px] font-semibold text-foreground truncate">{item.title}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {[item.subtitle, item.contact].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-3" />
                </Link>
              );
            })}
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}
