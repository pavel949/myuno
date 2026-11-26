/**
 * Admin Inbox — единая очередь всех входящих заявок и сигналов.
 *
 * Источники:
 *   • help_requests           — обращения в помощь myUNO
 *   • partner_applications     — заявки от потенциальных партнёров
 *   • listing_applications     — заявки на размещение листингов
 *   • consultation_requests    — заявки на консультации (legal, visa, real estate, ...)
 *   • nb_leads                 — лиды по новостройкам
 *   • property_inquiries       — запросы по property
 *   • service_orders           — заявки маркетплейса услуг
 *
 * Каждый источник нормализуется в `InboxItem`. Без realtime пока — простой
 * refetch через React Query (staleTime 60s). Realtime-канал добавим, когда
 * объёмы заявок превысят ~200/день.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Inbox, Search, Filter, ExternalLink, AlertCircle, MessageSquare, Building2, Briefcase, Sparkles, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale, enUS as enLocale } from 'date-fns/locale';
import { fetchInbox, isInboxSource, type InboxSource, type InboxStatus } from '@/lib/adminInbox';
import { InboxRequestDetail } from '@/components/admin/InboxRequestDetail';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { pickLang } from '@/lib/i18n/pickLang';

const SOURCE_META: Record<InboxSource, { labelRu: string; labelEn: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  help_requests:         { labelRu: 'Помощь myUNO', labelEn: 'myUNO Help', icon: MessageSquare, color: 'hsl(var(--cluster-legal))' },
  partner_applications:  { labelRu: 'Партнёры',     labelEn: 'Partners',     icon: Briefcase,     color: 'hsl(var(--cluster-build))' },
  listing_applications:  { labelRu: 'Листинги',     labelEn: 'Listings',     icon: Building2,     color: 'hsl(var(--cluster-manage))' },
  consultation_requests: { labelRu: 'Консультации', labelEn: 'Consults',     icon: MessageSquare, color: 'hsl(var(--cluster-legal))' },
  nb_leads:              { labelRu: 'Новостройки',  labelEn: 'Newbuilds',    icon: Sparkles,      color: 'hsl(var(--cluster-invest))' },
  service_orders:        { labelRu: 'Услуги',       labelEn: 'Services',     icon: Briefcase,    color: 'hsl(var(--cluster-build))' },
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
  help_requests: ['Reference, subject, email or phone', 'Номер, тема, email или телефон'],
  partner_applications: ['Business, name, email, category', 'Компания, имя, email, категория'],
  listing_applications: ['Name, email, exact type, category', 'Имя, email, точный тип, категория'],
  consultation_requests: ['Name, email, request type, vertical', 'Имя, email, тип запроса, направление'],
  nb_leads: ['Name, email, phone', 'Имя, email, телефон'],
  service_orders: ['Reference or service name', 'Номер или название услуги'],
  property_inquiries: ['Name, email, phone, message', 'Имя, email, телефон, сообщение'],
};

export default function AdminInbox() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess, error: accessError } = useIsAdmin();
  const admitted = !!user?.id && isAdmin && !checkingAccess && !accessError;
  const isRu = language === 'ru';
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('status');
  const tab = TABS.find(candidate => candidate.id === rawTab)?.id ?? 'new';
  const selectedSource = params.get('source');
  const sourceFilter: InboxSource = isInboxSource(selectedSource) ? selectedSource : 'help_requests';
  const searchScope = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const actorId = admitted ? user?.id ?? null : null;
  const [searchDraft, setSearchDraft] = useState({ actorId, text: '', revision: 0 });
  const debouncedSearch = useDebouncedValue(searchDraft, 300);
  const searchValue = searchDraft.actorId === actorId ? searchDraft.text : '';
  const searchTerm = actorId && debouncedSearch.actorId === actorId ? debouncedSearch.text.trim() : '';
  const searchPending = !!actorId && searchValue.trim() !== searchTerm;
  const searchLabel = pickLang(language, { en: 'Search applications', ru: 'Поиск заявок', th: 'ค้นหาคำขอ' });
  const statusLabel = pickLang(language, { en: 'Request status', ru: 'Статус заявки', th: 'สถานะคำขอ' });

  useEffect(() => {
    setSearchDraft(previous => previous.actorId === actorId ? previous : { actorId, text: '', revision: previous.revision + 1 });
  }, [actorId]);

  // Ignore and remove old contact-search bookmarks without replaying the query.
  useEffect(() => {
    if (!params.has('q')) return;
    const clean = new URLSearchParams(params);
    clean.delete('q');
    const search = clean.toString();
    navigate({ pathname: location.pathname, search: search && `?${search}`, hash: location.hash }, { replace: true, state: location.state });
  }, [params, location.pathname, location.hash, location.state, navigate]);
  const rawPage = Number(params.get('page') ?? 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const updateQueue = (changes: Record<string, string>) => setParams(previous => {
    const next = new URLSearchParams(previous);
    next.delete('q');
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return next;
  });
  const setPage = (value: number | ((previous: number) => number)) => updateQueue({ page: String(typeof value === 'function' ? value(page) : value) });

  function changeSearch(text: string) {
    if (!actorId) return;
    setSearchDraft(previous => ({ actorId, text, revision: previous.revision + 1 }));
    if (page !== 0) setParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete('q');
      next.delete('page');
      return next;
    }, { replace: true });
  }

  function selectTab(index: number) {
    updateQueue({ status: TABS[index].id, page: '0' });
    tabRefs.current[index]?.focus();
  }

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    // A mounted-search ID and revision are cache keys, never the contact value.
    queryKey: ['admin-inbox', actorId, sourceFilter, page, tab, searchTerm ? [searchScope, debouncedSearch.revision] : null],
    enabled: admitted && !searchPending,
    queryFn: () => fetchInbox(sourceFilter, page, tab, searchTerm),
    staleTime: 60_000,
    gcTime: searchTerm ? 0 : undefined,
    refetchInterval: admitted && !searchPending ? 90_000 : false,
  });

  const items = admitted && !searchPending && !isError ? data?.items : undefined;
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
              {isRu ? 'Входящие обращения' : 'Incoming requests'}
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-2xl">
              {isRu
                ? 'Начните с новых обращений клиентов. Другие источники можно открыть отдельно.'
                : 'Start with new customer requests. Other sources have separate queues.'}
            </p>
          </div>
        </header>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border mb-4" role="tablist" aria-label={statusLabel}>
          {TABS.map((t, index) => {
            const isActive = tab === t.id;
            const count = admitted && t.id === tab && !searchPending && !isError ? data?.total : null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(index)}
                ref={node => { tabRefs.current[index] = node; }}
                id={`${searchScope}-status-${t.id}`}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-controls={`${searchScope}-queue`}
                aria-selected={isActive}
                onKeyDown={event => {
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1
                    : event.key === 'ArrowRight' ? (index + 1) % TABS.length
                    : event.key === 'ArrowLeft' ? (index - 1 + TABS.length) % TABS.length : null;
                  if (next === null) return;
                  event.preventDefault();
                  selectTab(next);
                }}
                className={cn(
                  'min-h-11 shrink-0 px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring text-body-sm font-medium border-b-2 -mb-px transition-colors',
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
          <div className="flex gap-1.5 items-center flex-wrap" role="group" aria-label={pickLang(language, { en: 'Request source', ru: 'Источник заявок', th: 'แหล่งที่มาของคำขอ' })}>
            <Filter aria-hidden className="w-3.5 h-3.5 text-muted-foreground" />
            {(Object.keys(SOURCE_META) as InboxSource[]).map((src) => {
              const m = SOURCE_META[src];
              const isActive = sourceFilter === src;
              return (
                <button
                  key={src}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => updateQueue({ source: src, request: '', page: '0' })}
                  className={cn(
                    'min-h-11 px-2.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring text-caption font-medium border whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  style={!isActive ? { borderLeftWidth: 2, borderLeftColor: m.color } : undefined}
                >
                  {src === 'service_orders' && language === 'th' ? 'บริการ' : isRu ? m.labelRu : m.labelEn}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              type="search"
              aria-label={searchLabel}
              aria-describedby={`${searchScope}-search-help`}
              autoComplete="off"
              spellCheck={false}
              maxLength={160}
              disabled={!admitted}
              value={searchValue}
              onChange={event => changeSearch(event.target.value)}
              placeholder={SEARCH_HINTS[sourceFilter][isRu ? 1 : 0]}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-border bg-card focus:border-primary outline-none"
            />
          </div>
        </div>

        <nav aria-label={pickLang(language, { en: 'Application source pages', ru: 'Страницы заявок', th: 'หน้าคำขอ' })} className="mb-4 flex items-center gap-3 text-sm">
          <button className="min-h-11 underline disabled:opacity-40" disabled={!admitted || page === 0 || isFetching || searchPending} onClick={() => setPage(value => value - 1)}>{isRu ? 'Назад' : 'Previous'}</button>
          <span role="status">{page + 1} · {!admitted || isError || searchPending ? '—' : data?.total ?? '—'}</span>
          <button className="min-h-11 underline disabled:opacity-40" disabled={!admitted || isFetching || searchPending || isError || !data || (page + 1) * 50 >= data.total} onClick={() => setPage(value => value + 1)}>{isRu ? 'Далее' : 'Next'}</button>
          <span id={`${searchScope}-search-help`}>{pickLang(language, { en: 'Searches all pages of the selected source and status. Search text is not saved to the URL.', ru: 'Поиск по всем страницам выбранного источника и статуса. Поисковый текст не сохраняется в ссылке.', th: 'ค้นหาทุกหน้าตามแหล่งที่มาและสถานะที่เลือก โดยไม่บันทึกข้อความค้นหาไว้ใน URL' })}</span>
        </nav>
        <p className="mb-4 text-xs text-muted-foreground">{isRu ? 'Фильтры используют точные сохранённые статусы. Остальные статусы доступны во вкладке «Все» с исходным названием.' : 'Filters match stored statuses exactly. Other statuses remain under All with their original label.'}</p>
        {/* List */}
        <div id={`${searchScope}-queue`} role="tabpanel" aria-labelledby={`${searchScope}-status-${tab}`} aria-busy={checkingAccess || (admitted && (searchPending || isFetching))}>
        {(checkingAccess || (admitted && (isLoading || searchPending))) && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-none" />)}
          </div>
        )}

        {!checkingAccess && !admitted && <p role="alert">{isRu ? 'Доступ к очереди не подтверждён.' : 'Inbox access is not authorized.'}</p>}
        {admitted && !searchPending && isError && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {isRu ? 'Не удалось загрузить инбокс. ' : 'Failed to load inbox. '}
            <button onClick={() => refetch()} className="underline">{isRu ? 'Повторить' : 'Retry'}</button>
          </div>
        )}

        {admitted && !searchPending && !isLoading && !isError && filtered.length === 0 && (
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
                  to={(() => { const target = new URL(item.href, window.location.origin); const next = new URLSearchParams(params); target.searchParams.forEach((value, key) => next.set(key, value)); next.delete('q'); return `${target.pathname}?${next}`; })()}
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
                        {item.source === 'service_orders' && language === 'th' ? 'บริการ' : isRu ? meta.labelRu : meta.labelEn}
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
        </div>
      </PageShell>
      {params.has('request') && <InboxRequestDetail key={`${selectedSource}-${params.get('request')}`} source={selectedSource} requestId={params.get('request') ?? ''} onClose={() => setParams(previous => { const next = new URLSearchParams(previous); next.delete('q'); next.delete('request'); return next; })} />}
    </AppLayout>
  );
}
