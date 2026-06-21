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
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Inbox, Search, Filter, ExternalLink, AlertCircle, MessageSquare, Building2, Briefcase, Sparkles, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale, enUS as enLocale } from 'date-fns/locale';

type InboxSource = 'partner_applications' | 'listing_applications' | 'consultation_requests' | 'nb_leads' | 'property_inquiries';

type InboxStatus = 'new' | 'in_progress' | 'escalated' | 'closed';

interface InboxItem {
  id: string;
  source: InboxSource;
  status: InboxStatus;
  rawStatus: string;
  createdAt: string;
  title: string;
  subtitle: string | null;
  contact: string | null;
  href: string;
  vertical?: string | null;
}

const SOURCE_META: Record<InboxSource, { labelRu: string; labelEn: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  partner_applications:  { labelRu: 'Партнёры',     labelEn: 'Partners',     icon: Briefcase,     color: 'hsl(var(--cluster-build))' },
  listing_applications:  { labelRu: 'Листинги',     labelEn: 'Listings',     icon: Building2,     color: 'hsl(var(--cluster-manage))' },
  consultation_requests: { labelRu: 'Консультации', labelEn: 'Consults',     icon: MessageSquare, color: 'hsl(var(--cluster-legal))' },
  nb_leads:              { labelRu: 'Новостройки',  labelEn: 'Newbuilds',    icon: Sparkles,      color: 'hsl(var(--cluster-invest))' },
  property_inquiries:    { labelRu: 'Property',     labelEn: 'Property',     icon: Home,          color: 'hsl(var(--cluster-live))' },
};

function normalizeStatus(source: InboxSource, raw: string | null): InboxStatus {
  const s = (raw || '').toLowerCase();
  if (['closed', 'rejected', 'completed', 'converted', 'archived', 'cancelled'].includes(s)) return 'closed';
  if (['escalated', 'urgent', 'sla_breach'].includes(s)) return 'escalated';
  if (['in_progress', 'contacted', 'reviewing', 'qualified', 'follow_up'].includes(s)) return 'in_progress';
  return 'new';
}

async function fetchInbox(): Promise<InboxItem[]> {
  const [partners, listings, consults, nbLeads, propertyInq] = await Promise.all([
    supabase.from('partner_applications').select('id, status, created_at, business_name, contact_name, contact_email, business_category').order('created_at', { ascending: false }).limit(200),
    supabase.from('listing_applications').select('id, status, created_at, applicant_name, applicant_email, listing_type, service_category, product_category, property_type, city').order('created_at', { ascending: false }).limit(200),
    supabase.from('consultation_requests').select('id, status, created_at, name, email, request_type, vertical_id').order('created_at', { ascending: false }).limit(200),
    supabase.from('nb_leads').select('id, status, created_at, full_name, email, phone, project_id').order('created_at', { ascending: false }).limit(200),
    supabase.from('property_inquiries').select('id, status, created_at, name, email, phone, property_id, message').order('created_at', { ascending: false }).limit(200),
  ]);

  const items: InboxItem[] = [];

  for (const r of partners.data ?? []) {
    items.push({
      id: r.id, source: 'partner_applications',
      rawStatus: r.status ?? 'new', status: normalizeStatus('partner_applications', r.status),
      createdAt: r.created_at!, title: r.business_name || r.contact_name || 'Partner',
      subtitle: r.business_category || null,
      contact: r.contact_email || null,
      href: '/admin/partner-applications',
      vertical: r.business_category,
    });
  }
  for (const r of listings.data ?? []) {
    items.push({
      id: r.id, source: 'listing_applications',
      rawStatus: r.status ?? 'pending', status: normalizeStatus('listing_applications', r.status),
      createdAt: r.created_at!, title: r.applicant_name || `Listing ${r.listing_type}`,
      subtitle: r.service_category || r.product_category || r.property_type || r.listing_type,
      contact: r.applicant_email || null,
      href: '/admin/catalog',
      vertical: r.listing_type,
    });
  }
  for (const r of consults.data ?? []) {
    items.push({
      id: r.id, source: 'consultation_requests',
      rawStatus: r.status ?? 'new', status: normalizeStatus('consultation_requests', r.status),
      createdAt: r.created_at!, title: r.name || 'Consultation',
      subtitle: r.request_type || r.vertical_id,
      contact: r.email || null,
      href: '/admin/consultations',
      vertical: r.vertical_id,
    });
  }
  for (const r of nbLeads.data ?? []) {
    items.push({
      id: r.id, source: 'nb_leads',
      rawStatus: r.status ?? 'new', status: normalizeStatus('nb_leads', r.status),
      createdAt: r.created_at!, title: r.full_name || 'Newbuild lead',
      subtitle: r.project_id ? `Project ${r.project_id.slice(0, 8)}` : null,
      contact: r.email || r.phone || null,
      href: '/admin/nb-leads',
    });
  }
  for (const r of propertyInq.data ?? []) {
    items.push({
      id: r.id, source: 'property_inquiries',
      rawStatus: r.status ?? 'new', status: normalizeStatus('property_inquiries', r.status),
      createdAt: r.created_at!, title: r.name || 'Property inquiry',
      subtitle: r.message ? r.message.slice(0, 80) : null,
      contact: r.email || r.phone || null,
      href: '/admin/properties',
    });
  }

  return items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

const TABS: { id: InboxStatus | 'all'; labelRu: string; labelEn: string }[] = [
  { id: 'all',         labelRu: 'Все',         labelEn: 'All' },
  { id: 'new',         labelRu: 'Новые',       labelEn: 'New' },
  { id: 'in_progress', labelRu: 'В работе',    labelEn: 'In progress' },
  { id: 'escalated',   labelRu: 'Эскалация',   labelEn: 'Escalated' },
  { id: 'closed',      labelRu: 'Закрытые',    labelEn: 'Closed' },
];

export default function AdminInbox() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<InboxStatus | 'all'>('new');
  const [sourceFilter, setSourceFilter] = useState<InboxSource | 'all'>('all');
  const [query, setQuery] = useState('');

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-inbox'],
    queryFn: fetchInbox,
    staleTime: 60_000,
    refetchInterval: 90_000,
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== 'all' && i.status !== tab) return false;
      if (sourceFilter !== 'all' && i.source !== sourceFilter) return false;
      if (q) {
        const hay = [i.title, i.subtitle, i.contact, i.vertical].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, tab, sourceFilter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items?.length ?? 0, new: 0, in_progress: 0, escalated: 0, closed: 0 };
    for (const i of items ?? []) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [items]);

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
                : 'Partners, listings, consultations, newbuild leads and property inquiries — in one list.'}
            </p>
          </div>
        </header>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border mb-4" role="tablist">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const count = counts[t.id] ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'shrink-0 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {isRu ? t.labelRu : t.labelEn}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Source filter + search */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <div className="flex gap-1.5 items-center flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium border',
                sourceFilter === 'all'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {isRu ? 'Все источники' : 'All sources'}
            </button>
            {(Object.keys(SOURCE_META) as InboxSource[]).map((src) => {
              const m = SOURCE_META[src];
              const isActive = sourceFilter === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRu ? 'Имя, email, категория…' : 'Name, email, category…'}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-border bg-card focus:border-primary outline-none"
            />
          </div>
        </div>

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
                        {item.rawStatus}
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
