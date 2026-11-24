import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoginRequiredModal } from '@/components/guest/LoginRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestCheckout } from '@/hooks/useGuestCheckout';
import type { FlowersBuyNowItem } from '@/hooks/useBuyNowFlowers';
import { flowerDeliveryRpc, flowerReceiptPattern, FLOWER_WINDOWS, readFlowerCartLine } from '@/lib/flowerDelivery';
import { contactIntakeSchema } from '@/lib/crm/validation';
import { bangkokTodayISO } from '@/lib/hotelDates';
import { pickLang } from '@/lib/i18n/pickLang';

type Slot = keyof typeof FLOWER_WINDOWS;
type Selection = Pick<FlowersBuyNowItem, 'id' | 'name' | 'quantity'> & { nameRu?: string };
const defaultForm = { recipient: '', phone: '', address: '', date: '', slot: '' as Slot | '', note: '' };

export default function FlowersOrder() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { getItemsByType, isLoading: cartLoading } = useCart();
  const { requireLogin, getPreservedState, clearPreservedState, showLoginModal, setShowLoginModal } = useGuestCheckout();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const receipt = params.get('request') ?? '';
  const buyNowItem = (location.state as { buyNowItem?: FlowersBuyNowItem } | null)?.buyNowItem;
  const [restored, setRestored] = useState<Selection[]>();
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const busy = useRef(false);
  const formId = useId();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const money = (value: number) => new Intl.NumberFormat(language, { style: 'currency', currency: 'THB' }).format(value);
  const selection: Selection[] = restored ?? (buyNowItem ? [buyNowItem] : getItemsByType('flowers'));

  useEffect(() => {
    if (!user) return;
    const draft = getPreservedState();
    if (draft?.returnPath !== '/flowers/order' || draft.formData?.flow !== 'flower-delivery') return;
    setForm(current => ({ ...current, date: String(draft.formData.date ?? ''), slot: (draft.formData.slot || '') as Slot }));
    setRestored(draft.selectedItems as Selection[] | undefined);
    clearPreservedState();
  }, [user, getPreservedState, clearPreservedState]);

  const query = useQuery({
    queryKey: ['flower-delivery', user?.id, receipt],
    queryFn: () => flowerDeliveryRpc('get_flower_delivery', { p_id: receipt }),
    enabled: Boolean(user && flowerReceiptPattern.test(receipt)),
    refetchInterval: query => query.state.data?.status === 'pending' ? 15000 : false,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy.current || authLoading) return;
    setMessage('');
    const items = selection.map(item => readFlowerCartLine(item.id, item.quantity));
    if (!form.slot || !form.date || items.length < 1 || items.length > 10 || items.some(item => !item)) {
      setMessage(t('Проверьте букет, дату и интервал.', 'Check the bouquet, date and time window.', 'ตรวจสอบช่อดอกไม้ วันที่ และช่วงเวลา'));
      return;
    }
    const validItems = items.filter(item => item !== null);
    if (new Set(validItems.map(item => item.bouquet_id)).size !== validItems.length) {
      setMessage(t('Выберите один размер для каждого букета.', 'Choose one size per bouquet.', 'เลือกหนึ่งขนาดต่อช่อ'));
      return;
    }
    if (!user) {
      requireLogin({
        formData: { flow: 'flower-delivery', date: form.date, slot: form.slot },
        selectedItems: selection.map(({ id, name, nameRu, quantity }) => ({ id, name, nameRu, quantity })),
      }, 'order');
      return;
    }
    const contact = contactIntakeSchema.safeParse({ name: form.recipient, phone: form.phone });
    if (!contact.success || form.address.trim().length < 5) {
      setMessage(t('Укажите имя, действительный телефон и полный адрес.', 'Enter a name, valid phone number and full address.', 'ระบุชื่อ หมายเลขโทรศัพท์ที่ถูกต้อง และที่อยู่เต็ม'));
      return;
    }
    const payload = {
      recipient: contact.data.name, phone: contact.data.phone, address: form.address.trim(),
      date: form.date, slot: form.slot, note: form.note.trim(), items: validItems,
    };
    const key = 'myuno:flower-request-pending:' + user.id;
    busy.current = true;
    setSending(true);
    try {
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload))))).join(',');
      const pending = JSON.parse(sessionStorage.getItem(key) ?? 'null') as { hash: string; nonce: string } | null;
      if (pending && pending.hash !== hash) {
        setMessage(t('Восстановите предыдущую заявку с теми же данными.', 'Recover the previous request using the same details.', 'ใช้รายละเอียดเดิมเพื่อกู้คืนคำขอก่อนหน้า'));
        return;
      }
      const nonce = pending?.nonce ?? crypto.randomUUID();
      sessionStorage.setItem(key, JSON.stringify({ nonce, hash }));
      const id = await flowerDeliveryRpc('request_flower_delivery', { payload: { ...payload, request_key: nonce } });
      if (!flowerReceiptPattern.test(id)) throw new Error('Receipt missing');
      try { sessionStorage.removeItem(key); } catch { /* The server receipt wins. */ }
      setParams({ request: id }, { replace: true });
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
      if (code === '22023' || code === '22P02' || code === '22008' || code === 'PGRST202') {
        try { sessionStorage.removeItem(key); } catch { /* State is already unavailable. */ }
      }
      setMessage(t('Сохранение не подтверждено. Проверьте данные или повторите запрос с теми же деталями.', 'Saving was not confirmed. Check the details or retry with the same information.', 'ยังไม่ได้ยืนยันการบันทึก ตรวจสอบข้อมูลหรือลองใช้รายละเอียดเดิมอีกครั้ง'));
    } finally {
      busy.current = false;
      setSending(false);
    }
  };
  const change = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm(current => ({ ...current, [key]: value }));
  const order = query.data;
  const quote = order?.confirmed_quote ?? order?.estimate;

  return <AppLayout>
    <PageContainer className="space-y-6">
      <BackButton fallbackPath="/flowers" />
      <h1 className="font-display text-2xl font-bold">{t('Доставка цветов', 'Flower delivery', 'บริการส่งดอกไม้')}</h1>
      {receipt ? <section className="space-y-3 border border-border p-4 sm:p-6">
        <p className="break-all text-sm text-muted-foreground">{t('Номер заявки', 'Request ID', 'หมายเลขคำขอ')} {receipt}</p>
        {!user && !authLoading ? <Button asChild><Link to={'/auth?redirect=' + encodeURIComponent('/flowers/order?request=' + receipt)}>{t('Войти', 'Sign in', 'เข้าสู่ระบบ')}</Link></Button>
          : query.isLoading || authLoading ? <p role="status">{t('Загружаем заявку…', 'Loading request…', 'กำลังโหลดคำขอ…')}</p>
          : query.isError ? <Button variant="outline" onClick={() => void query.refetch()}>{t('Повторить загрузку', 'Retry loading', 'ลองโหลดอีกครั้ง')}</Button>
          : !order ? <p>{t('Заявка не найдена.', 'Request not found.', 'ไม่พบคำขอ')}</p> : <>
        <p role="status" className="font-semibold">{order.status === 'confirmed'
          ? t('Доставка и итоговая сумма подтверждены', 'Delivery and total confirmed', 'ยืนยันการจัดส่งและยอดรวมแล้ว')
          : order.status === 'unavailable'
            ? t('Доставку не удалось подтвердить', 'Delivery could not be confirmed', 'ไม่สามารถยืนยันการจัดส่ง')
            : t('Команда проверяет доставку', 'The team is checking delivery', 'ทีมงานกำลังตรวจสอบการจัดส่ง')}</p>
        <p className="break-words">{order.request.address}</p>
        <p>{order.request.date} · {FLOWER_WINDOWS[order.request.slot]} ({t('по Пхукету', 'Phuket time', 'เวลาภูเก็ต')})</p>
        {quote && order.status !== 'unavailable' && <dl className="border-t border-border pt-3">
          <div className="flex justify-between gap-4"><dt>{t('Букеты', 'Bouquets', 'ช่อดอกไม้')}</dt><dd>{money(quote.subtotal)}</dd></div>
          <div className="flex justify-between gap-4"><dt>{t('Доставка', 'Delivery', 'ค่าจัดส่ง')}</dt><dd>{money(quote.delivery_fee)}</dd></div>
          <div className="flex justify-between gap-4 font-semibold"><dt>{order.status === 'confirmed' ? t('К оплате', 'Total due', 'ยอดที่ต้องชำระ') : t('Предварительная сумма', 'Estimated total', 'ยอดโดยประมาณ')}</dt><dd>{money(quote.total)}</dd></div>
        </dl>}
        {order.status === 'confirmed' && <p>{t('Команда myUNO свяжется с вами для согласования оплаты.', 'The myUNO team will contact you to arrange payment.', 'ทีม myUNO จะติดต่อคุณเพื่อนัดหมายการชำระเงิน')}</p>}
        </>}
      </section> : selection.length === 0 ? <p>{cartLoading ? t('Загрузка…', 'Loading…', 'กำลังโหลด…') : t('Добавьте букет из каталога.', 'Add a bouquet from the catalogue.', 'เพิ่มช่อดอกไม้จากแคตตาล็อก')}</p>
      : <form onSubmit={submit} aria-busy={sending} className="space-y-5">
        <p className="text-muted-foreground">{t('Команда myUNO подтвердит адрес, время и полную сумму. Оплата на этом шаге не требуется.', 'The myUNO team will confirm the address, time and full total. No payment is required at this step.', 'ทีม myUNO จะยืนยันที่อยู่ เวลา และยอดรวม ขั้นตอนนี้ยังไม่ต้องชำระเงิน')}</p>
        <ul className="space-y-1 border-y border-border py-3">{selection.map(item => <li key={item.id} className="break-words">{item.quantity} × {language === 'ru' ? item.nameRu || item.name : item.name}</li>)}</ul>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor={formId + '-date'}>{t('Желаемая дата', 'Preferred date', 'วันที่ต้องการ')}</Label><Input id={formId + '-date'} type="date" min={bangkokTodayISO()} required value={form.date} onChange={e => change('date', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor={formId + '-slot'}>{t('Желаемый интервал по Пхукету', 'Preferred window in Phuket', 'ช่วงเวลาที่ต้องการในภูเก็ต')}</Label>
            <select id={formId + '-slot'} className="min-h-11 w-full border border-input bg-background px-3 text-sm" required value={form.slot} onChange={e => change('slot', e.target.value as Slot)}>
              <option value="">{t('Выберите интервал', 'Choose a window', 'เลือกช่วงเวลา')}</option>
              {Object.entries(FLOWER_WINDOWS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </div>
        {user && <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={formId + '-recipient'}>{t('Имя получателя', 'Recipient name', 'ชื่อผู้รับ')}</Label><Input id={formId + '-recipient'} required maxLength={120} value={form.recipient} onChange={e => change('recipient', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor={formId + '-phone'}>{t('Телефон получателя', 'Recipient phone', 'เบอร์โทรผู้รับ')}</Label><Input id={formId + '-phone'} type="tel" required maxLength={40} value={form.phone} onChange={e => change('phone', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor={formId + '-address'}>{t('Полный адрес доставки', 'Full delivery address', 'ที่อยู่จัดส่งเต็ม')}</Label><Input id={formId + '-address'} required minLength={5} maxLength={500} value={form.address} onChange={e => change('address', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor={formId + '-note'}>{t('Примечание для команды', 'Note for the team', 'หมายเหตุถึงทีมงาน')}</Label><Textarea id={formId + '-note'} maxLength={500} value={form.note} onChange={e => change('note', e.target.value)} /></div>
        </>}
        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal" disabled={sending || authLoading}>{sending ? t('Отправляем…', 'Sending…', 'กำลังส่ง…')
          : user ? t('Запросить подтверждение доставки', 'Request delivery confirmation', 'ขอการยืนยันการจัดส่ง')
            : t('Войти и продолжить', 'Sign in to continue', 'เข้าสู่ระบบเพื่อดำเนินการต่อ')}</Button>
      </form>}
      <LoginRequiredModal open={showLoginModal} onOpenChange={setShowLoginModal} returnPath="/flowers/order" context="order" />
    </PageContainer>
  </AppLayout>;
}
