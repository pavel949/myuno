import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { bindPropertyReservationReader, readPropertyReservationReceipt, type PropertyReservationReceipt as Receipt } from '@/lib/propertyReservationReceipt';
import { toBangkokDateKey } from '@/lib/hotelDates';
import { APP_ROUTES } from '@/lib/config/routes';

/** PR160 receipt reader only. A legacy order ID never proves an inventory hold. */
export function PropertyReservationReceipt({ legacyUnsupported = false }: { legacyUnsupported?: boolean }) {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ru = language === 'ru';
  const context = useMemo(() => ({ actor: user?.id, id }), [user?.id, id]);
  const current = useRef(context);
  current.current = context;
  const generation = useRef(0);
  const mounted = useRef(true);
  const invalidate = useCallback(() => { mounted.current = false; generation.current++; }, []);
  const [state, setState] = useState<{ context: typeof context; receipt?: Receipt; loading?: boolean; error?: boolean }>();
  const visible = state?.context === context ? state : undefined;
  const refresh = useCallback(async () => {
    const turn = ++generation.current;
    const assertCurrent = () => {
      if (!mounted.current || current.current !== context || generation.current !== turn) throw new Error('Account or request changed');
    };
    if (!context.actor || !context.id || legacyUnsupported) return;
    setState({ context, loading: true });
    try {
      const client = await bindPropertyReservationReader(context.actor, assertCurrent);
      const receipt = await readPropertyReservationReceipt(client, context.id);
      assertCurrent();
      setState({ context, receipt });
    } catch {
      if (mounted.current && current.current === context && generation.current === turn) setState({ context, error: true });
    }
  }, [context, legacyUnsupported]);
  useEffect(() => {
    mounted.current = true;
    if (!authLoading) void refresh();
    return invalidate;
  }, [authLoading, refresh, invalidate]);
  const receipt = visible?.receipt;
  const unavailable = legacyUnsupported || visible?.error;
  return <AppLayout><PageContainer><main className="space-y-5">
    <h1 className="text-2xl font-semibold">{ru ? 'Статус бронирования жилья' : 'Property reservation status'}</h1>
    {authLoading || visible?.loading ? <p role="status">{ru ? 'Проверяем сохранённое состояние…' : 'Checking persisted state…'}</p> : null}
    {!authLoading && !user && <p role="alert">{ru ? 'Войдите в аккаунт, с которого был отправлен запрос.' : 'Sign in with the account used for this request.'}</p>}
    {unavailable && <div role="alert"><p>{ru ? 'Сохранённое бронирование не подтверждено. Этот запрос нельзя считать бронью по одному номеру заказа.' : 'The persisted reservation could not be verified. An order number alone does not confirm a booking.'}</p>
      {!legacyUnsupported && <Button variant="outline" onClick={() => void refresh()}>{ru ? 'Повторить проверку' : 'Retry verification'}</Button>}
    </div>}
    {receipt && <section className="space-y-3 border border-border p-5" aria-label={ru ? 'Сохранённое состояние' : 'Persisted state'}>
      <p data-testid="property-reservation-status">{receipt.order.status === 'confirmed' ? (ru ? 'Подтверждено' : 'Confirmed') : receipt.order.status === 'cancelled' ? (ru ? 'Отменено' : 'Cancelled') : (ru ? 'Ожидает подтверждения управляющим' : 'Awaiting manager confirmation')}</p>
      <p>{toBangkokDateKey(receipt.order.start_at)} — {toBangkokDateKey(receipt.order.end_at)}</p>
      <p>{receipt.order_participants[0].name}</p>
      <p className="text-sm text-muted-foreground">{ru ? 'Это сохранённое состояние неоплаченного бронирования. Оплата здесь не выполняется.' : 'This is the persisted unpaid reservation state. This page does not collect payment.'}</p>
      <Button variant="outline" onClick={() => void refresh()}>{ru ? 'Обновить статус' : 'Refresh status'}</Button>
    </section>}
    <Button variant="outline" onClick={() => navigate(APP_ROUTES.PROPERTY)}>{ru ? 'Смотреть объекты' : 'Browse properties'}</Button>
  </main></PageContainer></AppLayout>;
}
