import { useId, useMemo, useRef, useState } from 'react';
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
import { formatServicePrice } from '@/lib/services/formatServicePrice';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';

export interface BookableService {
  id: string;
  providerId: string;
  name: string;
  price: number | null;
  currency?: string | null;
  durationMinutes: number | null;
  leadTimeHours?: number | null;
}

interface ServiceBookingSheetProps {
  service: BookableService | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ServiceBookingSheet(props: ServiceBookingSheetProps) {
  return <ServiceBookingForm key={`${props.service?.id ?? 'none'}:${props.open}`} {...props} />;
}

function ServiceBookingForm({ service, open, onOpenChange }: ServiceBookingSheetProps) {
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
  const [doneStatus, setDoneStatus] = useState<string | null>(null);
  const submitting = useRef(false);
  const fieldId = useId();

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
  const scheduleReady = open && hoursQ.isSuccess && busyQ.isSuccess && !hoursQ.isError && !busyQ.isError
    && !hoursQ.isFetching && !busyQ.isFetching;
  const slotValid = scheduleReady && slot != null && slots.some(s => s.getTime() === slot.getTime());
  const contactValid = name.trim().length > 0 && phone.trim().length > 0;
  const locale = language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB';

  const reset = () => { setSlot(null); setError(null); setDoneId(null); setDoneStatus(null); setNotes(''); };

  const submit = async () => {
    if (!service || !slot || !slotValid || submitting.current
      || slot.getTime() < Date.now() + (service.leadTimeHours ?? 2) * 3600_000) return;
    if (!user) { redirectToAuth(navigate); return; }
    if (!contactValid) return;
    submitting.current = true;
    setError(null);
    try {
      const r = await create.mutateAsync({
        serviceId: service.id, providerId: service.providerId, scheduledAt: slot,
        guestId: user.id, guestName: name.trim(), guestPhone: phone.trim(), notes: notes.trim(),
      });
      setDoneStatus(r.status ?? null);
      setDoneId(r.id);
    } catch (e) {
      const code = orderErrorCode(e);
      setError(code === 'SLOT_TAKEN'
        ? L('Выбранное время уже занято. Выберите другое время.', 'This time was just taken. Please pick another.', 'เวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น')
        : code === 'SLOT_IN_PAST'
          ? L('Это время уже прошло.', 'This time has already passed.', 'เวลานี้ผ่านไปแล้ว')
          : code === 'SERVICE_UNAVAILABLE'
            ? L('Услуга сейчас недоступна.', 'This service is not available right now.', 'บริการนี้ไม่พร้อมใช้งาน')
            : L('Не удалось отправить заявку. Повторите попытку.', 'Could not send the order. Please try again.', 'ส่งคำสั่งซื้อไม่สำเร็จ ลองอีกครั้ง'));
      setSlot(null);
    } finally { submitting.current = false; }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-none">
        <SheetHeader>
          <SheetTitle>{service?.name}</SheetTitle>
          <SheetDescription>
            {formatServicePrice(service?.price, service?.currency, language)}
            {service?.durationMinutes ? ` · ${service.durationMinutes} ${L('мин', 'min', 'นาที')}` : ''}
          </SheetDescription>
        </SheetHeader>

        {doneId ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <p className="font-medium">{doneStatus === 'confirmed' ? L('Запись подтверждена', 'Booking confirmed') : L('Заявка отправлена', 'Order sent', 'ส่งคำสั่งซื้อแล้ว')}</p>
            <p className="text-sm text-muted-foreground">
              {doneStatus === 'confirmed' ? L('Время сохранено. Подробности в разделе «Мои услуги».', 'Your time is reserved. See My services for details.') : L('Специалист подтвердит время приёма. Статус заявки отображается в разделе «Мои услуги».', 'The provider will confirm the time. Track it in My services.', 'ผู้ให้บริการจะยืนยันเวลา ติดตามได้ในบริการของฉัน')}
            </p>
            <p className="text-xs font-mono text-muted-foreground">ID {doneId.slice(0, 8)}</p>
            <Button onClick={() => onOpenChange(false)} className="min-h-[44px]">{L('Готово', 'Done', 'เสร็จ')}</Button>
            <Button variant="outline" asChild><Link to={APP_ROUTES.ME_SERVICES} onClick={() => onOpenChange(false)}>{L('Мои услуги', 'My services', 'บริการของฉัน')}</Link></Button>
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
              <p className="text-sm font-medium mb-2">{L('Время (по времени Пхукета)', 'Time (Phuket)', 'เวลา (ภูเก็ต)')}</p>
              {hoursQ.isLoading || busyQ.isLoading ? (
                <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
              ) : hoursQ.isError || busyQ.isError ? (
                <div role="alert" className="space-y-2 text-sm text-destructive">
                  <p>{L('Не удалось загрузить график приёма.', 'Could not load the schedule.', 'โหลดตารางเวลาไม่สำเร็จ')}</p>
                  <Button variant="outline" onClick={() => { void hoursQ.refetch(); void busyQ.refetch(); }}>{L('Повторить', 'Retry', 'ลองใหม่')}</Button>
                </div>
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
                <label htmlFor={`${fieldId}-name`} className="text-sm">{L('Ваше имя', 'Your name', 'ชื่อของคุณ')}</label>
                <Input id={`${fieldId}-name`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
                <label htmlFor={`${fieldId}-phone`} className="text-sm">{L('Телефон / WhatsApp', 'Phone / WhatsApp', 'โทรศัพท์ / WhatsApp')}</label>
                <Input id={`${fieldId}-phone`} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required />
                <label htmlFor={`${fieldId}-notes`} className="text-sm">{L('Адрес и детали', 'Address and details', 'ที่อยู่และรายละเอียด')}</label>
                <Textarea id={`${fieldId}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full min-h-[44px]" disabled={!slotValid || create.isPending || (!!user && !contactValid)} onClick={submit}>
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
