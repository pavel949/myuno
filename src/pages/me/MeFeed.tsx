/**
 * /me — MeFeed
 * Universal "Лента действий" — primary screen of the /me hub.
 * Aggregates compliance, notifications, pending orders and concierge
 * journey via useMeFeed and renders prioritized cards (high → low).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, CreditCard, Sparkles, ChevronRight, FileText, Plane, FilePlus } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingState, PageSection } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMeFeed, type MeFeedItem } from '@/hooks/useMeFeed';
import { prefetchRoute } from '@/lib/prefetchRoute';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES = {
  high:   { ring: 'ring-2 ring-destructive/40', icon: 'text-destructive', bg: 'bg-destructive/5' },
  medium: { ring: 'ring-1 ring-warning/40',     icon: 'text-warning',     bg: 'bg-warning/5' },
  low:    { ring: 'ring-1 ring-border',          icon: 'text-muted-foreground', bg: 'bg-muted/40' },
} as const;

const SOURCE_ICON = {
  compliance:   AlertTriangle,
  notification: Bell,
  order:        CreditCard,
  booking:      CreditCard,
  journey:      Sparkles,
} as const;

function FeedCard({ item }: { item: MeFeedItem }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const style = PRIORITY_STYLES[item.priority];
  const Icon = SOURCE_ICON[item.source] ?? Bell;
  const title = isRu ? item.titleRu : item.titleEn;
  const desc = isRu ? item.descriptionRu : item.descriptionEn;
  const ctaLabel = isRu ? item.ctaLabelRu : item.ctaLabelEn;

  return (
    <Card variant="content" className={cn('transition-all', style.ring)}>
      <CardContent className="p-4 flex gap-3 items-start">
        <div className={cn('h-10 w-10 rounded-none flex items-center justify-center shrink-0', style.bg)}>
          <Icon className={cn('h-5 w-5', style.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{title}</p>
          {desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc}</p>}
          {item.ctaPath && (
            <Button asChild size="sm" variant="ghost" className="mt-2 -ml-2 h-8 px-2 text-primary">
              <Link
                to={item.ctaPath}
                onPointerDown={() => prefetchRoute(item.ctaPath)}
                onMouseEnter={() => prefetchRoute(item.ctaPath)}
              >
                {ctaLabel ?? (isRu ? 'Открыть' : 'Open')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const QUICK_ACTIONS = [
  { to: '/me/documents', icon: FilePlus, en: 'Submit TM30',     ru: 'Подать TM30' },
  { to: '/visa',         icon: Plane,    en: 'Extend visa',     ru: 'Продлить визу' },
  { to: '/me/payments',  icon: CreditCard, en: 'Pay a bill',    ru: 'Оплатить счёт' },
  { to: '/me/documents', icon: FileText, en: 'Upload document', ru: 'Загрузить документ' },
];

export default function MeFeed() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: items, isLoading } = useMeFeed();

  const high = (items ?? []).filter((i) => i.priority === 'high');
  const rest = (items ?? []).filter((i) => i.priority !== 'high');

  return (
    <MeShellLayout>
      <div className="space-y-6">
        {/* Hero — what to do now */}
        <section>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isRu ? 'Что нужно сделать' : 'What to do now'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu
              ? 'Ваши обязательства, уведомления и платежи в одном месте.'
              : 'Your obligations, notifications and payments in one place.'}
          </p>
        </section>

        {/* Quick actions */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to + a.en}
              to={a.to}
              onPointerDown={() => prefetchRoute(a.to)}
              onMouseEnter={() => prefetchRoute(a.to)}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <a.icon className="h-4 w-4 text-primary" />
              <span>{isRu ? a.ru : a.en}</span>
            </Link>
          ))}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={isRu ? 'Всё под контролем' : 'All caught up'}
            description={isRu
              ? 'Нет срочных задач. Загляните в Услуги или Документы.'
              : 'No urgent tasks. Browse Services or Documents.'}
          />
        ) : (
          <>
            {high.length > 0 && (
              <PageSection title={isRu ? 'Срочно' : 'Urgent'}>
                <div className="space-y-3">
                  {high.map((i) => <FeedCard key={i.id} item={i} />)}
                </div>
              </PageSection>
            )}
            {rest.length > 0 && (
              <PageSection title={isRu ? 'Лента' : 'Feed'}>
                <div className="space-y-3">
                  {rest.map((i) => <FeedCard key={i.id} item={i} />)}
                </div>
              </PageSection>
            )}
          </>
        )}
      </div>
    </MeShellLayout>
  );
}
