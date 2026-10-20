import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { readCustomerCancellation, cancelCustomerUnpaidOrder } from '@/lib/customerOrderCancellation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const WAITING = new Set(['draft', 'pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit']);

/** Commercial orders only. Eligibility and mutation authority remain server-side. */
interface CancelOrderActionProps {
  orderId: string; status: string; onCancelled?: () => void | Promise<unknown>;
}
export function CancelOrderAction(props: CancelOrderActionProps) {
  const { user } = useAuth();
  return user ? <CustomerCancelAction key={`${user.id}:${props.orderId}:${props.status}`} {...props} actorId={user.id} /> : null;
}

function CustomerCancelAction({ orderId, status, onCancelled, actorId }: CancelOrderActionProps & { actorId: string }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const requestId = useRef<string | null>(null);
  const options = useQuery({
    queryKey: ['customer-order-cancellation', actorId, orderId],
    queryFn: () => readCustomerCancellation(orderId),
    enabled: WAITING.has(status), retry: false, staleTime: 0,
  });
  const command = useMutation({
    mutationFn: async () => {
      if (!options.data?.eligible || !requestId.current) throw new Error('cancellation_unavailable');
      return cancelCustomerUnpaidOrder(options.data, requestId.current);
    },
    onSuccess: async () => {
      setCancelled(true); setOpen(false);
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['me-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] }),
        queryClient.invalidateQueries({ queryKey: ['customer-order-cancellation'] }),
        queryClient.invalidateQueries({ queryKey: ['guest-property-bookings'] }),
        Promise.resolve().then(() => onCancelled?.()),
      ]);
    },
  });
  if (!WAITING.has(status)) return null;
  if (cancelled) return <p role="status" className="text-sm">{t('Заказ отменён', 'Order cancelled', 'ยกเลิกคำสั่งแล้ว')}</p>;
  if (options.isError || options.data?.eligible === false && options.data.reason === 'unavailable') {
    return <p className="text-xs text-muted-foreground">{t('Отмена сейчас недоступна', 'Cancellation is currently unavailable', 'ยังไม่สามารถยกเลิกได้ในขณะนี้')}</p>;
  }
  if (!options.data?.eligible) return null;
  return <>
    <Button variant="outline" size="sm" onClick={() => { requestId.current = crypto.randomUUID(); command.reset(); setOpen(true); }}>
      {t('Отменить заказ', 'Cancel order', 'ยกเลิกคำสั่ง')}
    </Button>
    <Dialog open={open} onOpenChange={value => { if (!command.isPending) setOpen(value); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('Отменить заказ?', 'Cancel this order?', 'ยกเลิกคำสั่งนี้หรือไม่?')}</DialogTitle></DialogHeader>
        <p className="text-sm">{t('Отмена будет подтверждена после проверки состояния заказа.', 'Cancellation will be confirmed after checking the current order state.', 'การยกเลิกจะได้รับการยืนยันหลังตรวจสอบสถานะคำสั่งปัจจุบัน')}</p>
        {command.isError && <p role="alert" className="text-sm text-destructive">{t('Отмена не подтверждена. Проверьте заказ или повторите попытку.', 'Cancellation was not confirmed. Check the order or retry.', 'ยังไม่ยืนยันการยกเลิก โปรดตรวจสอบคำสั่งหรือลองอีกครั้ง')}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={command.isPending} onClick={() => setOpen(false)}>{t('Оставить заказ', 'Keep order', 'เก็บคำสั่งไว้')}</Button>
          <Button variant="destructive" disabled={command.isPending} onClick={() => command.mutate()}>{command.isPending ? t('Проверка…', 'Checking…', 'กำลังตรวจสอบ…') : t('Подтвердить отмену', 'Confirm cancellation', 'ยืนยันการยกเลิก')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
