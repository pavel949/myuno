import { Link } from 'react-router-dom';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';
import { propertyDetailHref } from '@/lib/real-estate/propertyDetailIntent';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { fetchInboxRequest, INBOX_DETAIL_FIELDS, isInboxRequestId, isInboxSource, nextHelpInboxStatus, updateHelpInboxStatus } from '@/lib/adminInbox';
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
  const queryClient = useQueryClient();
  const helpStatus = source === 'help_requests' && admitted && valid && !isError && typeof data?.status === 'string' ? data.status : null;
  const nextHelpStatus = nextHelpInboxStatus(helpStatus);
  const actionLock = useRef(false);
  const [feedback, setFeedback] = useState<{ id: string; kind: 'saved' | 'stale' | 'error' } | null>(null);
  const updateHelp = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateHelpInboxStatus(id, status),
  });
  const handleHelp = async () => {
    if (actionLock.current || !nextHelpStatus || !helpStatus) return;
    actionLock.current = true;
    setFeedback(null);
    try {
      const changed = await updateHelp.mutateAsync({ id: requestId, status: helpStatus });
      await queryClient.invalidateQueries({
        predicate: ({ queryKey: [family, actor, lane, id] }) => actor === user?.id && lane === 'help_requests'
          && (family === 'admin-inbox' || (family === 'admin-inbox-request' && id === requestId)),
      });
      setFeedback({ id: requestId, kind: changed ? 'saved' : 'stale' });
    } catch {
      setFeedback({ id: requestId, kind: 'error' });
    } finally {
      actionLock.current = false;
    }
  };
  const metadata = source === 'consultation_requests' ? data?.vertical_metadata : null;
  const buyerContext = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : null;
  const propertyId = buyerContext?.request_only === true && isInboxRequestId(buyerContext.property_id) ? buyerContext.property_id : null;
  const propertyMode = buyerContext?.intent === 'purchase_enquiry' && buyerContext?.mode === 'buy' ? 'buy'
    : buyerContext?.intent === 'rental_enquiry' && buyerContext?.mode === 'rent' ? 'rent' : null;
  const propertyTenancy = propertyMode === 'rent' && (buyerContext?.tenancy === 'medium' || buyerContext?.tenancy === 'long') ? buyerContext.tenancy : null;
  const propertyHref = propertyId && propertyMode ? propertyDetailHref(propertyId, propertyMode, propertyTenancy ? `tenancy=${propertyTenancy}` : '') : null;
  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto" closeLabel={isRu ? 'Закрыть' : 'Close'}>
        <SheetHeader>
          <SheetTitle>{source === 'help_requests' ? (isRu ? 'Помощь myUNO' : 'myUNO Help request')
            : source === 'service_orders' ? pickLang(language, { en: 'Service request', ru: 'Заявка на услугу', th: 'คำขอบริการ' })
            : (isRu ? 'Обращение' : 'Request')}</SheetTitle>
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
                  let display = value;
                  if (source === 'service_orders' && field === 'scheduled_at' && typeof value === 'string') {
                    const requestedTime = new Date(value);
                    if (!Number.isFinite(requestedTime.getTime())) return null;
                    const phuketTime = new Intl.DateTimeFormat(language, {
                      timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23',
                    }).format(requestedTime);
                    const zone = pickLang(language, { en: 'Phuket time', ru: 'время Пхукета', th: 'เวลาภูเก็ต' });
                    display = `${phuketTime} · ${zone}`;
                  }
                  return <div key={field} className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{isRu ? ru : en}</dt><dd className="whitespace-pre-wrap break-words text-sm">{display}</dd></div>;
                })}
              </dl>
              {nextHelpStatus && <div className="mt-4">
                <Button type="button" variant="outline" onClick={() => void handleHelp()} disabled={updateHelp.isPending}>
                  {nextHelpStatus === 'in_progress' ? (isRu ? 'Взять в работу' : 'Start working') : (isRu ? 'Закрыть обращение' : 'Close request')}
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">{isRu ? 'Меняется только статус. Клиенту ничего не отправляется.' : 'Only the status changes. No message is sent to the customer.'}</p>
              </div>}
              {source === 'help_requests' && feedback?.id === requestId && <p className="mt-2 text-sm" role={feedback.kind === 'saved' ? 'status' : 'alert'}>
                {feedback.kind === 'saved' ? (isRu ? 'Статус сохранён.' : 'Status saved.')
                  : feedback.kind === 'stale' ? (isRu ? 'Статус уже изменился или обращение недоступно.' : 'The status changed or the request is unavailable.')
                  : (isRu ? 'Не удалось подтвердить изменение. Обновите карточку и проверьте статус.' : 'The change could not be confirmed. Reload and check the status.')}
                {feedback.kind === 'error' && <Button type="button" variant="outline" onClick={() => void refetch()}>{isRu ? 'Обновить' : 'Reload'}</Button>}
              </p>}
              {buyerContext && <div className="mt-4"><BuyerRequestSummary metadata={buyerContext} detailOpen={admitted && valid} /></div>}
              {propertyHref && <p className="mt-3 text-sm">
                <Link className="font-medium underline" to={propertyHref}>
                  {propertyMode === 'buy'
                    ? pickLang(language, { ru: 'Открыть объект на продажу', en: 'Open property for sale', th: 'เปิดอสังหาริมทรัพย์สำหรับขาย' })
                    : pickLang(language, { ru: 'Открыть объект в аренду', en: 'Open rental property', th: 'เปิดอสังหาริมทรัพย์ให้เช่า' })}
                </Link>
              </p>}
              {buyerContext?.request_only === true && (isInboxRequestId(buyerContext.project_id) || propertyHref) && (
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
