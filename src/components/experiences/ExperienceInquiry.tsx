import { useId, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import { APP_ROUTES } from '@/lib/config/routes';
import { consultationIntakeErrorCopy, createConsultationIntakeAttempt } from '@/lib/consultationIntake';
import { contactIntakeSchema } from '@/lib/crm/validation';
import { bangkokTodayISO, toBangkokDateKey } from '@/lib/hotelDates';
import { pickLang } from '@/lib/i18n/pickLang';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isPreferredDate = (date: string) => datePattern.test(date) && toBangkokDateKey(date) === date && date >= bangkokTodayISO();
const isPartySize = (value: number) => Number.isInteger(value) && value >= 1 && value <= 50;

type ExperienceRpc = (name: 'submit_experience_inquiry', args: { payload: never }) => PromiseLike<{ data: unknown; error: unknown }>;
const experienceIntake = {
  rpc: (_name: 'submit_consultation_request', args: { payload: never }) =>
    (supabase.rpc as unknown as ExperienceRpc).call(supabase, 'submit_experience_inquiry', args),
};

function readSelection(key: string) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? '{}');
    return {
      date: typeof value.date === 'string' && isPreferredDate(value.date) ? value.date : '',
      guests: isPartySize(value.guests) ? String(value.guests) : '1',
    };
  } catch {
    return { date: '', guests: '1' };
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  entryPoint: 'experience_discovery:concierge' | 'experience_detail:concierge';
}

export function ExperienceInquiry(props: Props) {
  return <ExperienceInquiryDialog key={props.listingId} {...props} />;
}

function ExperienceInquiryDialog({ open, onOpenChange, listingId, listingTitle, entryPoint }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const id = useId();
  const draftKey = `myuno:experience-inquiry:v1:${listingId}`;
  const [selection, setSelection] = useState(() => readSelection(draftKey));
  const [contact, setContact] = useState<{ actor: string; name?: string; phone?: string }>();
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ actor: string; id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const [intake] = useState(() => createConsultationIntakeAttempt());
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const currentReceipt = receipt?.actor === user?.id ? receipt : undefined;
  const userContact = contact?.actor === user?.id ? contact : undefined;
  const name = userContact?.name ?? String(user?.user_metadata?.full_name ?? '');
  const phone = userContact?.phone ?? String(user?.user_metadata?.phone ?? user?.phone ?? '');
  const close = (next: boolean) => {
    if (!sending.current) onOpenChange(next);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || currentReceipt || authLoading) return;
    setError('');
    const guestCount = Number(selection.guests);
    if (!isPreferredDate(selection.date) || !isPartySize(guestCount)) {
      setError(t('Выберите дату и укажите от 1 до 50 гостей.', 'Choose a date and enter 1 to 50 guests.', 'เลือกวันที่และระบุจำนวนผู้เข้าร่วม 1 ถึง 50 คน'));
      return;
    }
    if (!user) {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ date: selection.date, guests: guestCount }));
      } catch {
        setError(t('Браузер не сохранил выбор для входа. Разрешите данные сайта и повторите.', 'Your browser could not save your selection. Allow site data and try again.', 'เบราว์เซอร์บันทึกตัวเลือกไม่ได้ โปรดอนุญาตข้อมูลเว็บไซต์แล้วลองอีกครั้ง'));
        return;
      }
      const params = new URLSearchParams(location.search);
      params.set('inquiry', '1');
      redirectToAuth(navigate, { from: `${location.pathname}?${params}${location.hash}` });
      return;
    }

    const validated = contactIntakeSchema.safeParse({ name, phone });
    if (!validated.success) {
      setError(t('Укажите имя и действительный телефон.', 'Enter your name and a valid phone number.', 'กรอกชื่อและหมายเลขโทรศัพท์ที่ถูกต้อง'));
      return;
    }
    const route = APP_ROUTES.EXPERIENCE_DETAIL(listingId);
    sending.current = true;
    setSubmitting(true);
    try {
      const result = await intake.submit(experienceIntake, {
        ...validated.data,
        request_type: 'tour_booking',
        vertical_id: 'tours',
        lead_source: 'cta',
        preferred_language: language,
        entry_point: route,
        preferred_dates: [{ date: selection.date, time: '' }],
        guests_count: guestCount,
        vertical_metadata: { listing_id: listingId, listing_title: listingTitle, spec_vertical: 'tour', experience_entry: entryPoint },
        notes: `${listingTitle}\n${route}\n${selection.date} · ${guestCount}`,
      }, user.id);
      setReceipt({ actor: user.id, id: result.id });
      try { sessionStorage.removeItem(draftKey); } catch { /* The server receipt is already confirmed. */ }
      void queryClient.invalidateQueries({ queryKey: ['me-requests', user.id] });
    } catch (cause) {
      const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : undefined;
      setError(code === '42501' || code === 'PGRST202'
        ? t('Сохранение этой заявки пока недоступно.', 'Saving this request is currently unavailable.', 'ยังไม่สามารถบันทึกคำขอนี้ได้')
        : code === '22023' || code === '22P02' || code === '22008'
          ? t('Проверьте дату и сведения. Возможно, предложение уже закрыто.', 'Check the date and details. The offer may no longer be open.', 'ตรวจสอบวันที่และรายละเอียด ข้อเสนอนี้อาจปิดแล้ว')
          : code === '23505'
            ? consultationIntakeErrorCopy(cause)[language]
            : t('Ответ не получен. Повторите отправку с теми же данными, чтобы восстановить номер заявки.', 'No response received. Send the same details again to recover your request ID.', 'ยังไม่ได้รับการตอบกลับ ส่งรายละเอียดเดิมอีกครั้งเพื่อกู้คืนหมายเลขคำขอ'));
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  return <ResponsiveModal open={open} onOpenChange={close} size="sm"
    title={t('Уточнить места у myUNO', 'Ask myUNO about availability', 'สอบถามที่ว่างกับ myUNO')}
    description={listingTitle}>
    {currentReceipt ? <div className="space-y-4">
      <div role="status" className="space-y-2">
        <p className="font-semibold">{t('Заявка получена. Команда уточняет доступность.', 'Request received. The team will check availability.', 'ได้รับคำขอแล้ว ทีมงานจะตรวจสอบที่ว่าง')}</p>
        <p className="break-all text-sm text-muted-foreground">{t('Номер заявки', 'Request ID', 'หมายเลขคำขอ')} {currentReceipt.id}</p>
      </div>
      <Button asChild className="h-auto min-h-11 w-full whitespace-normal">
        <Link to={`${APP_ROUTES.ME_REQUESTS}?source=experience#experience-${encodeURIComponent(currentReceipt.id)}`}>
          {t('Открыть мои заявки', 'View my requests', 'ดูคำขอของฉัน')}
        </Link>
      </Button>
    </div> : <form className="space-y-4" aria-busy={submitting} onSubmit={submit}>
      <p className="text-sm text-muted-foreground">{t('Укажите желаемую дату. Доступность подтвердит команда myUNO.', 'Choose your preferred date. The myUNO team will confirm availability.', 'เลือกวันที่ต้องการ ทีม myUNO จะยืนยันว่ามีที่ว่างหรือไม่')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${id}-date`}>{t('Желаемая дата', 'Preferred date', 'วันที่ต้องการ')}</Label>
          <Input id={`${id}-date`} className="min-w-0" type="date" min={bangkokTodayISO()} value={selection.date} required disabled={submitting}
            onChange={event => setSelection({ ...selection, date: event.target.value })} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${id}-guests`}>{t('Гостей', 'Guests', 'จำนวนผู้เข้าร่วม')}</Label>
          <Input id={`${id}-guests`} type="number" min={1} max={50} value={selection.guests} required disabled={submitting}
            onChange={event => setSelection({ ...selection, guests: event.target.value })} />
        </div>
      </div>
      {user && <>
        <div className="space-y-2">
          <Label htmlFor={`${id}-name`}>{t('Имя', 'Name', 'ชื่อ')}</Label>
          <Input id={`${id}-name`} autoComplete="name" value={name} maxLength={120} required disabled={submitting}
            onChange={event => setContact({ ...userContact, actor: user.id, name: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-phone`}>{t('Телефон или WhatsApp', 'Phone or WhatsApp', 'โทรศัพท์หรือ WhatsApp')}</Label>
          <Input id={`${id}-phone`} type="tel" autoComplete="tel" value={phone} maxLength={40} required disabled={submitting}
            onChange={event => setContact({ ...userContact, actor: user.id, phone: event.target.value })} />
        </div>
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal" disabled={submitting || authLoading}>
        {submitting ? t('Отправляем…', 'Sending…', 'กำลังส่ง…') : user
          ? t('Отправить заявку', 'Send request', 'ส่งคำขอ')
          : t('Войти и продолжить', 'Sign in to continue', 'เข้าสู่ระบบเพื่อดำเนินการต่อ')}
      </Button>
    </form>}
  </ResponsiveModal>;
}
