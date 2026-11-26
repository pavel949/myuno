import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { consultationIntakeErrorCopy, createConsultationIntakeAttempt } from '@/lib/consultationIntake';
import { contactIntakeSchema } from '@/lib/crm/validation';
import { pickLang } from '@/lib/i18n/pickLang';
import { bangkokTodayISO, parseCivilDate } from '@/lib/hotelDates';

export function ResaleEnquiryForm({ listingId, onClose, offerCurrency }: { listingId: string; onClose: () => void; offerCurrency?: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const id = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [viewingFormat, setViewingFormat] = useState('');
  const [offer, setOffer] = useState({ amount: '', payment: '', transferDate: '', furniture: '', keepBookings: false });
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const [intake] = useState(() => createConsultationIntakeAttempt({ allowUncertainRetry: false }));
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const today = bangkokTodayISO();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || receipt) return;
    const contact = contactIntakeSchema.safeParse({ name, phone });
    if (!contact.success) {
      setError(t('Укажите имя и действительный телефон.', 'Enter your name and a valid phone number.', 'กรอกชื่อและหมายเลขโทรศัพท์ที่ถูกต้อง'));
      return;
    }

    const amount = Number(offer.amount);
    if (offerCurrency && (!/^\d+(?:\.\d{1,2})?$/.test(offer.amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100)))) {
      setError(t('Укажите сумму больше нуля.', 'Enter an offer amount greater than zero.', 'ระบุยอดข้อเสนอที่มากกว่าศูนย์'));
      return;
    }
    if (offerCurrency && offer.transferDate && (offer.transferDate < today || Number.isNaN(parseCivilDate(offer.transferDate).getTime()))) {
      setError(t('Выберите дату передачи в будущем.', 'Choose a transfer date from today onward.', 'เลือกวันที่โอนตั้งแต่วันนี้เป็นต้นไป'));
      return;
    }

    const entryPoint = APP_ROUTES.RESALE_DETAIL(listingId);
    const offerTerms = offerCurrency ? {
      amount,
      currency: offerCurrency,
      payment_preference: offer.payment || undefined,
      transfer_date: offer.transferDate || undefined,
      furniture_preference: offer.furniture || undefined,
      keep_existing_bookings: offer.keepBookings || undefined,
    } : undefined;
    const notesForTeam = offerTerms ? [
      'Resale offer: ' + entryPoint,
      'Offer: ' + offerTerms.currency + ' ' + offerTerms.amount,
      offerTerms.payment_preference && 'Payment preference: ' + offerTerms.payment_preference,
      offerTerms.transfer_date && 'Proposed transfer: ' + offerTerms.transfer_date,
      offerTerms.furniture_preference && 'Furniture: ' + offerTerms.furniture_preference,
      offerTerms.keep_existing_bookings && 'Buyer requests keeping existing rental bookings.',
    ] : ['Resale viewing: ' + entryPoint, viewingFormat && 'Viewing format: ' + viewingFormat];
    sending.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = await intake.submit(supabase, {
        ...contact.data,
        request_type: offerTerms ? 'property_consultation' : 'property_tour',
        vertical_id: 'property',
        lead_source: 'website',
        preferred_language: language,
        entry_point: entryPoint,
        vertical_metadata: {
          marketplace: 'resale',
          resale_listing_id: listingId,
          intent: offerTerms ? 'offer' : 'viewing',
          ...(offerTerms ? { offer: offerTerms } : viewingFormat ? { viewing_format: viewingFormat } : {}),
        },
        notes: [...notesForTeam, notes.trim()].filter(Boolean).join('\n'),
      }, user?.id);
      setReceipt(result.id);
    } catch (cause) {
      setError(pickLang(language, consultationIntakeErrorCopy(cause)));
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div className="space-y-4">
        <div role="status" className="space-y-2">
          <p className="font-semibold">{offerCurrency
            ? t('Предложение получено и будет рассмотрено', 'Offer received for review', 'ได้รับข้อเสนอเพื่อพิจารณาแล้ว')
            : t('Заявка на показ получена', 'Viewing request received', 'ได้รับคำขอนัดชมแล้ว')}</p>
          <p className="break-all text-sm text-muted-foreground">{t('Номер заявки', 'Request ID', 'หมายเลขคำขอ')} {receipt}</p>
        </div>
        <Button type="button" variant="outline" onClick={onClose}>{t('Закрыть', 'Close', 'ปิด')}</Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit} aria-busy={submitting}>
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>{t('Имя', 'Name', 'ชื่อ')}</Label>
        <Input id={`${id}-name`} autoComplete="name" value={name} onChange={event => setName(event.target.value)} required maxLength={120} disabled={submitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-phone`}>{t('Телефон или WhatsApp', 'Phone or WhatsApp', 'โทรศัพท์หรือ WhatsApp')}</Label>
        <Input id={`${id}-phone`} type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} required maxLength={40} disabled={submitting} />
      </div>
      {offerCurrency ? (
        <fieldset className="grid gap-4 sm:grid-cols-2" disabled={submitting}>
          <legend className="mb-2 font-semibold">{t('Ваше предложение', 'Your offer', 'ข้อเสนอของคุณ')}</legend>
          <div className="space-y-2">
            <Label htmlFor={id + '-amount'}>{t('Сумма предложения', 'Offer amount', 'ยอดข้อเสนอ')} ({offerCurrency})</Label>
            <Input id={id + '-amount'} type="number" inputMode="decimal" min="0.01" step="0.01" required value={offer.amount} onChange={event => setOffer({ ...offer, amount: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id + '-transfer'}>{t('Желаемая дата передачи', 'Preferred transfer date', 'วันที่โอนที่ต้องการ')}</Label>
            <Input id={id + '-transfer'} type="date" min={today} value={offer.transferDate} onChange={event => setOffer({ ...offer, transferDate: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id + '-payment'}>{t('Способ оплаты', 'Payment preference', 'วิธีชำระเงินที่ต้องการ')}</Label>
            <Select value={offer.payment || 'discuss'} onValueChange={value => setOffer({ ...offer, payment: value === 'discuss' ? '' : value })} disabled={submitting}>
              <SelectTrigger id={id + '-payment'}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="discuss">{t('Обсудить', 'To discuss', 'หารือภายหลัง')}</SelectItem>
                <SelectItem value="own_funds">{t('Собственные средства', 'Own funds', 'เงินทุนส่วนตัว')}</SelectItem>
                <SelectItem value="financing">{t('Финансирование', 'Financing', 'สินเชื่อ')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={id + '-furniture'}>{t('Мебель', 'Furniture', 'เฟอร์นิเจอร์')}</Label>
            <Select value={offer.furniture || 'discuss'} onValueChange={value => setOffer({ ...offer, furniture: value === 'discuss' ? '' : value })} disabled={submitting}>
              <SelectTrigger id={id + '-furniture'}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="discuss">{t('Обсудить', 'To discuss', 'หารือภายหลัง')}</SelectItem>
                <SelectItem value="included">{t('Включить', 'Include', 'รวม')}</SelectItem>
                <SelectItem value="excluded">{t('Исключить', 'Exclude', 'ไม่รวม')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
            <input type="checkbox" className="ds-focus size-4" checked={offer.keepBookings} onChange={event => setOffer({ ...offer, keepBookings: event.target.checked })} />
            {t('Сохранить существующие бронирования', 'Keep existing rental bookings', 'คงการจองเช่าที่มีอยู่')}
          </label>
        </fieldset>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={id + '-viewing'}>{t('Формат показа', 'Viewing format', 'รูปแบบการเข้าชม')}</Label>
          <Select value={viewingFormat || 'any'} onValueChange={value => setViewingFormat(value === 'any' ? '' : value)} disabled={submitting}>
            <SelectTrigger id={id + '-viewing'}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t('Любой формат', 'Either format', 'รูปแบบใดก็ได้')}</SelectItem>
              <SelectItem value="in_person">{t('Лично', 'In person', 'เข้าชมด้วยตนเอง')}</SelectItem>
              <SelectItem value="video">{t('По видео', 'Video viewing', 'เข้าชมผ่านวิดีโอ')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${id}-notes`}>{offerCurrency
          ? t('Дополнительные условия (необязательно)', 'Additional terms (optional)', 'เงื่อนไขเพิ่มเติม (ไม่จำเป็น)')
          : t('Пожелания по дате и времени (необязательно)', 'Preferred date and time (optional)', 'วันและเวลาที่สะดวก (ไม่จำเป็น)')}</Label>
        <Textarea id={`${id}-notes`} rows={3} value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} disabled={submitting} />
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal" disabled={submitting}>
        {submitting
          ? t('Отправляем…', 'Sending…', 'กำลังส่ง…')
          : offerCurrency ? t('Отправить предложение на рассмотрение', 'Send offer for review', 'ส่งข้อเสนอเพื่อพิจารณา')
            : t('Отправить заявку', 'Send request', 'ส่งคำขอ')}
      </Button>
    </form>
  );
}
