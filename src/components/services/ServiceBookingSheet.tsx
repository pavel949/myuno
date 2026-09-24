import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, CalendarX, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import { computeSlots, formatPhuketTime, phuketToday, addDays } from '@/lib/services/slots';
import { useProviderHours, useBusySlots, useCreateServiceOrder, orderErrorCode } from '@/hooks/useServiceMarketplace';

export interface BookableService {
  id: string;
  providerId: string;
  name: string;
  price: number | null;
  currency?: string | null;
  durationMinutes: number | null;
  leadTimeHours?: number | null;
}

export function ServiceBookingSheet({ service, open, onOpenChange }: {
  service: BookableService | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { language } = useLanguage();
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = phuketToday();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const hoursQ = useProviderHours(service?.providerId);
  const busyQ = useBusySlots(service?.providerId, date);
  const create = useCreateServiceOrder();

  const slots = useMemo(() => computeSlots({
    date,
    hours: hoursQ.data ?? [],
    busy: busyQ.data ?? [],
    durationMinutes: service?.durationMinutes ?? 60,
    leadTimeHours: service?.leadTimeHours ?? 2,
  }), [date, hoursQ.data, busyQ.data, service]);

  const noHours = hoursQ.isSuccess && (hoursQ.data?.length ?? 0) === 0;
  const locale = language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB';

  const reset = () => { setSlot(null); setError(null); setDoneId(null); setNotes(''); };

  const submit = async () => {
    if (!service || !slot) return;
    if (!user) { redirectToAuth(navigate); return; }
    setError(null);
    try {
      const r = await create.mutateAsync({
        serviceId: service.id, providerId: service.providerId, scheduledAt: slot,
        guestId: user.id, guestName: name, guestPhone: phone, notes,
      });
      setDoneId(r.id);
    } catch (e) {
      const code = orderErrorCode(e);
      setError(code === 'SLOT_TAKEN'
        ? L('Это время только что заняли. Выберите другое.', 'This time was just taken. Please pick another.', 'เวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น')
        : code === 'SLOT_IN_PAST'
          ? L('Это время уже прошло.', 'This time has already passed.', 'เวลานี้ผ่านไปแล้ว')
          : code === 'SERVICE_UNAVAILABLE'
            ? L('Услуга сейчас недоступна.', 'This service is not available right now.', 'บริการนี้ไม่พร้อมใช้งาน')
            : L('Не удалось отправить заказ. Попробуйте ещё раз.', 'Could not send the order. Please try again.', 'ส่งคำสั่งซื้อไม่สำเร็จ ลองอีกครั้ง'));
      setSlot(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-none">
        <SheetHeader>
          <SheetTitle>{service?.name}</SheetTitle>
          <SheetDescription>
            {service?.price != null ? `฿${Number(service.price).toLocaleString()}` : L('Цена по запросу', 'Price on request', 'ราคาตามคำขอ')}
            {service?.durationMinutes ? ` · ${service.durationMinutes} ${L('мин', 'min', 'นาที')}` : ''}
          </SheetDescription>
        </SheetHeader>

        {doneId ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <p className="font-medium">{L('Заказ отправлен', 'Order sent', 'ส่งคำสั่งซื้อแล้ว')}</p>
            <p className="text-sm text-muted-foreground">
              {slot ? '' : ''}{L('Провайдер подтвердит время. Статус виден в разделе «Мои заказы».', 'The provider will confirm the time. Track it in My orders.', 'ผู้ให้บริการจะยืนยันเวลา ติดตามได้ใน คำสั่งซื้อของฉัน')}
            </p>
            <p className="text-xs font-mono text-muted-foreground">ID {doneId.slice(0, 8)}</p>
            <Button onClick={() => onOpenChange(false)} className="min-h-[44px]">{L('Готово', 'Done', 'เสร็จ')}</Button>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            <div>
              <p className="text-sm font-medium mb-2">{L('Дата', 'Date', 'วันที่')}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d) => {
                  const dt = new Date(`${d}T00:00:00Z`);
                  return (
                    <button key={d} type="button" onClick={() => { setDate(d); setSlot(null); }}
                      className={`min-w-[56px] min-h-[44px] border px-2 py-1 text-xs ${d === date ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>
                      <div>{dt.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}</div>
                      <div className="font-mono">{dt.getUTCDate()}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">{L('Время (Пхукет)', 'Time (Phuket)', 'เวลา (ภูเก็ต)')}</p>
              {hoursQ.isLoading || busyQ.isLoading ? (
                <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
              ) : hoursQ.isError || busyQ.isError ? (
                <p className="text-sm text-destructive">{L('Не удалось загрузить расписание.', 'Could not load the schedule.', 'โหลดตารางเวลาไม่สำเร็จ')}</p>
              ) : noHours ? (
                <div className="flex items-start gap-2 text-sm text-muted-foreground border border-border p-3">
                  <CalendarX className="h-4 w-4 mt-0.5 shrink-0" />
                  {L('Провайдер ещё не указал часы работы — онлайн-запись пока недоступна. Напишите ему напрямую.',
                     'This provider has not set working hours yet, so online booking is not available. Message them directly.',
                     'ผู้ให้บริการยังไม่ได้กำหนดเวลาทำการ จึงยังจองออนไลน์ไม่ได้')}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{L('На эту дату свободного времени нет.', 'No free time on this date.', 'ไม่มีเวลาว่างในวันนี้')}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button key={s.toISOString()} type="button" onClick={() => setSlot(s)}
                      className={`min-h-[44px] border font-mono text-sm ${slot?.getTime() === s.getTime() ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>
                      {formatPhuketTime(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {slot && (
              <div className="space-y-2">
                <Input placeholder={L('Ваше имя', 'Your name', 'ชื่อของคุณ')} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                <Input placeholder={L('Телефон / WhatsApp', 'Phone / WhatsApp', 'โทรศัพท์ / WhatsApp')} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
                <Textarea placeholder={L('Адрес и детали', 'Address and details', 'ที่อยู่และรายละเอียด')} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full min-h-[44px]" disabled={!slot || create.isPending} onClick={submit}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!user
                ? L('Войти и записаться', 'Sign in to book', 'เข้าสู่ระบบเพื่อจอง')
                : slot
                  ? L(`Записаться на ${formatPhuketTime(slot)}`, `Book ${formatPhuketTime(slot)}`, `จอง ${formatPhuketTime(slot)}`)
                  : L('Выберите время', 'Pick a time', 'เลือกเวลา')}
            </Button>
            <p className="text-xs text-muted-foreground">{L('Оплата не списывается сейчас. Цена берётся из карточки услуги.', 'No payment is taken now. Price comes from the service listing.', 'ยังไม่มีการชำระเงินในตอนนี้')}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
