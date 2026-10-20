/**
 * /me/requests — MeRequests
 * Unified request tracker (Kanban-style 4 buckets).
 *
 * Optional URL filter: `?source=visa|order|concierge` narrows the board to
 * a single source. Used by the PersonaHalo activity-badge deep-link so a
 * tap on the Legal cluster's "2 open" badge lands on visa-only requests.
 */
import { useAuth } from '@/contexts/AuthContext';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import { pickLang } from '@/lib/i18n/pickLang';
import React, { useMemo, useCallback, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight, X } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyRequests, type MyRequest, type RequestStatus, type RequestSource } from '@/hooks/useMyRequests';

const COLUMNS: { key: RequestStatus; en: string; ru: string; th: string }[] = [
  { key: 'new',         en: 'New',         ru: 'Новые', th: 'ใหม่' },
  { key: 'in_progress', en: 'In progress', ru: 'В работе', th: 'กำลังดำเนินการ' },
  { key: 'waiting',     en: 'Waiting',     ru: 'Ожидание', th: 'รอข้อมูล' },
  { key: 'done',        en: 'Done',        ru: 'Завершено', th: 'เสร็จสิ้น' },
];

const SOURCE_LABEL: Record<RequestSource, { en: string; ru: string; th: string }> = {
  concierge: { en: 'Concierge', ru: 'Консьерж', th: 'ผู้ช่วยส่วนตัว' },
  visa: { en: 'Visa', ru: 'Виза', th: 'วีซ่า' },
  order: { en: 'Orders', ru: 'Заказы', th: 'คำสั่งซื้อ' },
  help: { en: 'myUNO Help', ru: 'Помощь myUNO', th: 'ความช่วยเหลือ myUNO' },
};

const VALID_SOURCES: RequestSource[] = ['concierge', 'visa', 'order', 'help'];

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
          {pickLang(language, SOURCE_LABEL[r.source])}
        </Badge>
      </CardContent>
    </Card>
  );
  return r.detailPath ? <Link to={r.detailPath}>{inner}</Link> : inner;
}

export default function MeRequests() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data, isLoading, failedSources = [], refetch, isFetching, isError } = useMyRequests();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      redirectToAuth(navigate, { replace: true, from: location.pathname + location.search + location.hash });
    }
  }, [authLoading, user, navigate, location.pathname, location.search, location.hash]);

  const sourceParam = searchParams.get('source') ?? '';
  const activeSource = (VALID_SOURCES as string[]).includes(sourceParam)
    ? (sourceParam as RequestSource)
    : null;

  const filteredData = useMemo(() => {
    if (!data) return data;
    if (!activeSource) return data;
    return data.filter((r) => r.source === activeSource);
  }, [data, activeSource]);

  const relevantFailedSources = activeSource ? failedSources.filter(source => source === activeSource) : failedSources;
  const hasReadFailure = isError || relevantFailedSources.length > 0;

  const clearSource = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('source');
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace: true });
  }, [searchParams, navigate, location.pathname, location.hash]);

  if (authLoading) return <MeShellLayout><LoadingState /></MeShellLayout>;
  if (!user) return null;

  return (
    <MeShellLayout title={isRu ? 'Заявки' : 'Requests'}>
      <div className="space-y-6">
        <Link to="/bookings" className="inline-flex min-h-11 items-center text-sm underline">{pickLang(language, { ru: 'Все бронирования и заказы', en: 'All bookings and orders', th: 'การจองและคำสั่งทั้งหมด' })}</Link>
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isRu ? 'Мои заявки' : 'My requests'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu
              ? 'Статусы всех ваших обращений в одном месте.'
              : 'Track your requests in one place.'}
          </p>

          {/* Active source filter pill — surfaces PersonaHalo deep-link context. */}
          {activeSource && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                {isRu ? 'Фильтр' : 'Filter'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {pickLang(language, SOURCE_LABEL[activeSource])}
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

        {hasReadFailure && !isLoading && <div role="alert" className="space-y-2 border border-warning/40 bg-warning/5 p-3 text-sm">
          <p>{pickLang(language, { ru: 'Не все заявки удалось загрузить. Показаны только доступные записи.', en: 'Some requests could not be loaded. Only available records are shown.', th: 'โหลดคำขอบางส่วนไม่สำเร็จ แสดงเฉพาะข้อมูลที่โหลดได้' })}</p>
          <button type="button" disabled={isFetching} onClick={() => void refetch()} className="min-h-11 underline disabled:opacity-50">{pickLang(language, { ru: 'Повторить загрузку', en: 'Retry loading', th: 'ลองโหลดอีกครั้ง' })}</button>
        </div>}
        {isLoading ? (
          <LoadingState />
        ) : (!filteredData || filteredData.length === 0) && hasReadFailure ? null : !filteredData || filteredData.length === 0 ? (
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
                    <h3 className="text-sm font-semibold">{pickLang(language, col)}</h3>
                    <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1 py-2">
                        {hasReadFailure ? pickLang(language, { ru: 'Нет загруженных заявок', en: 'No loaded requests', th: 'ไม่มีคำขอที่โหลดได้' }) : (isRu ? 'Пусто' : 'Empty')}
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
