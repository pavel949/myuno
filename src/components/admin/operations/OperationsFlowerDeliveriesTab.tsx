import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { FLOWER_WINDOWS, flowerDeliveryRpc, type FlowerDeliveryRequest } from '@/lib/flowerDelivery';
import { pickLang } from '@/lib/i18n/pickLang';

export function OperationsFlowerDeliveriesTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState<string>();
  const [feedback, setFeedback] = useState('');
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const money = (value: number) => new Intl.NumberFormat(language, { style: 'currency', currency: 'THB' }).format(value);
  const queryKey = ['operations-flower-delivery', user?.id];
  const queue = useQuery({
    queryKey,
    queryFn: () => flowerDeliveryRpc('list_pending_flower_deliveries', {}),
    enabled: !!user,
  });
  const review = useMutation({
    mutationFn: ({ row, confirm }: { row: FlowerDeliveryRequest; confirm: boolean }) =>
      flowerDeliveryRpc('review_flower_delivery', { p_id: row.id, p_confirm: confirm, p_expected_quote: row.estimate }),
    onSuccess: async ({ status }) => {
      const feedback = {
        confirmed: t('Доставка подтверждена.', 'Delivery confirmed.', 'ยืนยันการจัดส่งแล้ว'),
        unavailable: t('Отказ сохранён.', 'Delivery declined.', 'บันทึกการปฏิเสธแล้ว'),
        expired: t('Этот интервал уже закончился.', 'The requested window has elapsed.', 'ช่วงเวลาที่ขอผ่านไปแล้ว'),
        quote_missing: t('В каталоге нет действующего тарифа для этой заявки.', 'The catalogue has no current rate for this request.', 'ไม่พบราคาปัจจุบันสำหรับคำขอนี้'),
        quote_changed: t('Тариф обновился. Проверьте новую сумму и подтвердите повторно.', 'The rate changed. Review the new total before confirming.', 'ราคาเปลี่ยน โปรดตรวจสอบยอดใหม่ก่อนยืนยัน'),
      };
      setChecked(undefined);
      setFeedback(feedback[status]);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: () => setFeedback(t('Изменение не подтверждено. Обновите очередь.', 'The change was not confirmed. Refresh the queue.', 'ยังไม่ได้ยืนยันการเปลี่ยนแปลง โปรดรีเฟรชรายการ')),
  });

  return <section className="space-y-4">
    <h2 className="font-display text-xl font-semibold">{t('Подтверждение доставки цветов', 'Flower delivery confirmation', 'ยืนยันการจัดส่งดอกไม้')}</h2>
    {feedback && <p role="status">{feedback}</p>}
    {queue.isLoading ? <p role="status">{t('Загрузка…', 'Loading…', 'กำลังโหลด…')}</p>
      : queue.isError ? <Button variant="outline" onClick={() => void queue.refetch()}>{t('Повторить загрузку', 'Retry loading', 'ลองโหลดอีกครั้ง')}</Button>
      : !queue.data?.length ? <p>{t('Открытых заявок нет.', 'No open requests.', 'ไม่มีคำขอที่เปิดอยู่')}</p> : null}
    {queue.data?.map(row => <article key={row.id} className="space-y-3 border border-border p-4">
      <p className="break-all text-xs text-muted-foreground">{row.id}</p>
      <h3 className="break-words font-semibold">{row.request.recipient} · {row.request.phone}</h3>
      <p className="break-words">{row.request.address}</p>
      <p>{row.request.date} · {FLOWER_WINDOWS[row.request.slot]}</p>
      {row.request.note && <p className="break-words text-sm">{row.request.note}</p>}
      {row.estimate ? <>
        <ul className="space-y-1">{row.estimate.items.map(item => <li key={item.bouquet_id}>
          {item.quantity} × {language === 'ru' ? item.name_ru || item.name_en : item.name_en}{item.size ? ' · ' + item.size : ''} · {money(item.unit_price)}
        </li>)}</ul>
        <p className="font-semibold">{t('Итого с доставкой', 'Total with delivery', 'ยอดรวมค่าจัดส่ง')} {money(row.estimate.total)}</p>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" aria-describedby={'flower-review-' + row.id} checked={checked === row.id} onChange={event => setChecked(event.target.checked ? row.id : undefined)} />
          <span id={'flower-review-' + row.id}>{t('Проверены адрес, букет и интервал доставки', 'The address, bouquet and delivery window have been verified', 'ตรวจสอบที่อยู่ ช่อดอกไม้ และช่วงเวลาจัดส่งแล้ว')}</span>
        </label>
      </> : <p className="text-sm text-muted-foreground">{t('Тариф отсутствует или букет не одобрен.', 'The rate is missing or the bouquet has not been approved.', 'ยังไม่มีราคาหรือช่อดอกไม้ยังไม่ได้รับอนุมัติ')}</p>}
      <div className="flex flex-wrap gap-2">
        <Button className="h-auto min-h-11 whitespace-normal" disabled={review.isPending || (!!row.estimate && checked !== row.id)}
          onClick={() => review.mutate({ row, confirm: true })}>
          {row.estimate ? t('Подтвердить доставку и сумму', 'Confirm delivery and total', 'ยืนยันการจัดส่งและยอดรวม')
            : t('Проверить тариф', 'Check the rate', 'ตรวจสอบราคา')}
        </Button>
        <Button variant="outline" disabled={review.isPending} onClick={() => review.mutate({ row, confirm: false })}>
          {t('Отклонить', 'Decline', 'ปฏิเสธ')}
        </Button>
      </div>
    </article>)}
  </section>;
}
