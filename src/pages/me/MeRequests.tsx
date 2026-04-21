/**
 * /me/requests — MeRequests
 * Unified request tracker (Kanban-style 4 buckets).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyRequests, type MyRequest, type RequestStatus } from '@/hooks/useMyRequests';

const COLUMNS: { key: RequestStatus; en: string; ru: string }[] = [
  { key: 'new',         en: 'New',         ru: 'Новые' },
  { key: 'in_progress', en: 'In progress', ru: 'В работе' },
  { key: 'waiting',     en: 'Waiting',     ru: 'Ожидание' },
  { key: 'done',        en: 'Done',        ru: 'Завершено' },
];

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
        </header>

        {isLoading ? (
          <LoadingState />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={isRu ? 'Заявок нет' : 'No requests'}
            description={isRu
              ? 'Здесь будут отображаться ваши обращения.'
              : 'Your requests will appear here.'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const items = data.filter((r) => r.status === col.key);
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
