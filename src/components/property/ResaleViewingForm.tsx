import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { consultationIntakeErrorCopy, createGeneralConsultationIntakeAttempt } from '@/lib/consultationIntake';
import { contactIntakeSchema } from '@/lib/crm/validation';
import { pickLang } from '@/lib/i18n/pickLang';

export function ResaleViewingForm({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const id = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const [intake] = useState(() => createGeneralConsultationIntakeAttempt());
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || receipt) return;
    const contact = contactIntakeSchema.safeParse({ name, phone });
    if (!contact.success) {
      setError(t('Укажите имя и действительный телефон.', 'Enter your name and a valid phone number.', 'กรอกชื่อและหมายเลขโทรศัพท์ที่ถูกต้อง'));
      return;
    }

    const entryPoint = APP_ROUTES.RESALE_DETAIL(listingId);
    sending.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = await intake.submit(supabase, {
        ...contact.data,
        request_type: 'property_tour',
        vertical_id: 'property',
        lead_source: 'website',
        preferred_language: language,
        entry_point: entryPoint,
        vertical_metadata: { marketplace: 'resale', resale_listing_id: listingId, intent: 'viewing' },
        // The existing inbox displays client notes as well as the structured context.
        notes: [`Resale viewing: ${entryPoint}`, notes.trim()].filter(Boolean).join('\n'),
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
          <p className="font-semibold">{t('Заявка на показ получена', 'Viewing request received', 'ได้รับคำขอนัดชมแล้ว')}</p>
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
      <div className="space-y-2">
        <Label htmlFor={`${id}-notes`}>{t('Пожелания по дате и времени (необязательно)', 'Preferred date and time (optional)', 'วันและเวลาที่สะดวก (ไม่จำเป็น)')}</Label>
        <Textarea id={`${id}-notes`} rows={3} value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} disabled={submitting} />
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal" disabled={submitting}>
        {submitting ? t('Отправляем…', 'Sending…', 'กำลังส่ง…') : t('Отправить заявку', 'Send request', 'ส่งคำขอ')}
      </Button>
    </form>
  );
}
