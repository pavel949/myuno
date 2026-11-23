import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { fetchInboxRequest, INBOX_DETAIL_FIELDS, isInboxRequestId, isInboxSource } from '@/lib/adminInbox';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { BuyerRequestSummary } from '@/components/newbuilds/BuyerRequestSummary';

export function InboxRequestDetail({ source, requestId, onClose }: { source: string | null; requestId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { isAdmin, isLoading: checking, error: accessError } = useIsAdmin();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const valid = isInboxSource(source) && isInboxRequestId(requestId);
  const admitted = !!user?.id && isAdmin && !checking && !accessError;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-inbox-request', user?.id, source, requestId],
    enabled: admitted && valid,
    queryFn: () => {
      if (!isInboxSource(source)) throw new Error('Invalid source');
      return fetchInboxRequest(source, requestId);
    },
    retry: false,
  });
  const metadata = source === 'consultation_requests' ? data?.vertical_metadata : null;
  const buyerContext = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : null;
  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[85dvh]" closeLabel={isRu ? 'Закрыть' : 'Close'}>
        <SheetHeader>
          <SheetTitle>{isRu ? 'Обращение' : 'Request'}</SheetTitle>
          <SheetDescription className="break-all font-mono">{requestId}</SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {!valid ? <p role="alert">{isRu ? 'Некорректная ссылка на обращение.' : 'Invalid request link.'}</p>
            : checking ? <Skeleton className="h-24" />
            : !admitted ? <p role="alert">{isRu ? 'Нет подтверждённого доступа к обращению.' : 'Request access is not authorized.'}</p>
            : isLoading ? <Skeleton className="h-24" />
            : isError ? <div role="alert">{isRu ? 'Не удалось загрузить обращение.' : 'Could not load request.'}<Button variant="outline" onClick={() => void refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div>
            : !data ? <p role="status">{isRu ? 'Обращение не найдено или недоступно.' : 'Request not found or unavailable.'}</p>
            : <>
              <dl className="space-y-3">
                {([['status', 'Status', 'Статус'], ['created_at', 'Created', 'Создано'], ...(isInboxSource(source) ? INBOX_DETAIL_FIELDS[source] : [])] as readonly (readonly string[])[]).map(([field, en, ru]) => {
                  const value = data[field];
                  if (typeof value !== 'string' && typeof value !== 'number') return null;
                  return <div key={field} className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{isRu ? ru : en}</dt><dd className="whitespace-pre-wrap break-words text-sm">{value}</dd></div>;
                })}
              </dl>
              {buyerContext && <div className="mt-4"><BuyerRequestSummary metadata={buyerContext} detailOpen={admitted && valid} /></div>}
              {buyerContext?.request_only === true && isInboxRequestId(buyerContext.project_id) && (
                <Button asChild variant="outline" className="mt-4">
                  <Link to={{ pathname: APP_ROUTES.ADMIN_CONSULTATIONS, search: new URLSearchParams({ request: requestId }).toString() }}>
                    {pickLang(language, { ru: 'Обработать заявку', en: 'Handle this request', th: 'ดำเนินการตามคำขอนี้' })}
                  </Link>
                </Button>
              )}
            </>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
