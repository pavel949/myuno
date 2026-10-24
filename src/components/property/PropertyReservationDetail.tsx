import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { readPropertyReservation } from '@/lib/propertyReservation';
import { executePropertyBookingChange, type ManualBookingReply } from '@/lib/manualPropertyBooking';
import { toBangkokDateKey } from '@/lib/hotelDates';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

/** Thin existing booking-route surface over the same checked guest/PMS record. */
export function PropertyReservationDetail() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = (ru: string, en: string) => language === 'ru' ? ru : en;
  const [reply, setReply] = useState<ManualBookingReply | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedFor, setLoadedFor] = useState('');
  const context = `${user?.id ?? ''}:${id ?? ''}`;
  const visibleReply = loadedFor === context ? reply : null;
  const generation = useRef(0);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    const turn = ++generation.current;
    pending.current = false; setSaving(false);
    setLoading(true); setError(false); setReply(null);
    if (!user?.id || !id) { setLoading(false); return; }
    try {
      const saved = await readPropertyReservation(supabase, id);
      if (turn === generation.current) { setReply(saved); setLoadedFor(`${user.id}:${id}`); }
    } catch { if (turn === generation.current) setError(true); }
    finally { if (turn === generation.current) setLoading(false); }
  }, [user?.id, id]);
  useEffect(() => {
    if (!authLoading && !user) redirectToAuth(navigate, { replace: true });
    if (!authLoading) void refresh();
    return () => { generation.current++; };
  }, [authLoading, user, refresh, navigate]);
  const cancel = async () => {
    if (!visibleReply || !user?.id || !id || pending.current) return;
    pending.current = true; setSaving(true); setError(false);
    const turn = generation.current;
    try {
      const saved = await executePropertyBookingChange(supabase, user.id, id, { status: 'cancelled' }, visibleReply.order.updated_at);
      if (turn === generation.current) { setReply(saved); setLoadedFor(`${user.id}:${id}`); }
    } catch { if (turn === generation.current) setError(true); }
    finally { if (turn === generation.current) { pending.current = false; setSaving(false); } }
  };
  const status = visibleReply?.order.status;
  return <AppLayout><PageContainer className="space-y-5 py-6 pb-32">
    <h1 className="text-2xl font-semibold">{t('Бронирование жилья', 'Property reservation')}</h1>
    {(loading || authLoading) && <p role="status">{t('Проверяем сохранённое бронирование…', 'Checking the persisted reservation…')}</p>}
    {error && <div role="alert"><p>{t('Изменение не подтверждено. Обновите статус или повторите действие с сохранённым идентификатором.', 'Change not confirmed. Refresh the status or retry with the retained request identity.')}</p><Button variant="outline" disabled={saving} onClick={() => void refresh()}>{t('Обновить статус', 'Refresh status')}</Button></div>}
    {visibleReply && <>
      <section className="border border-border p-5 space-y-3" aria-label={t('Сохранённое состояние', 'Persisted state')}>
        <p data-testid="property-reservation-status">{status === 'cancelled' ? t('Отменено', 'Cancelled') : status === 'confirmed' ? t('Подтверждено', 'Confirmed') : t('Ожидает подтверждения', 'Awaiting confirmation')}</p>
        <p>{toBangkokDateKey(visibleReply.order.start_at)} — {toBangkokDateKey(visibleReply.order.end_at)}</p>
        <p>{visibleReply.order_participants[0].name}</p>
        <p className="text-sm text-muted-foreground">{t('Оплата не списывалась. Оценка стоимости уточняется управляющим.', 'No payment has been collected. The manager verifies the estimated price.')}</p>
      </section>
      <Button variant="outline" disabled={saving || loading} onClick={() => void refresh()}>{t('Обновить статус', 'Refresh status')}</Button>
      {status !== 'cancelled' && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" disabled={saving}>{saving ? t('Проверяем…', 'Checking…') : t('Отменить бронирование', 'Cancel reservation')}</Button></AlertDialogTrigger>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('Отменить бронирование?', 'Cancel reservation?')}</AlertDialogTitle><AlertDialogDescription>{t('После подтверждённой отмены даты будут освобождены. Оплата и возврат не выполняются.', 'A confirmed cancellation releases the dates. No payment or refund is performed.')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('Оставить', 'Keep reservation')}</AlertDialogCancel><AlertDialogAction onClick={() => void cancel()}>{t('Да, отменить', 'Yes, cancel')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>}
    </>}
    <Button variant="outline" onClick={() => navigate(APP_ROUTES.BOOKINGS)}>{t('Мои бронирования', 'My bookings')}</Button>
  </PageContainer></AppLayout>;
}
