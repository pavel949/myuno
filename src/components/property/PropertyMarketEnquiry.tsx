import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { consultationIntakeErrorCopy, createConsultationIntakeAttempt } from '@/lib/consultationIntake';
import { contactIntakeSchema } from '@/lib/crm/validation';
import { pickLang } from '@/lib/i18n/pickLang';
import { propertyDetailHref } from '@/lib/real-estate/propertyDetailIntent';

export type PropertyEnquiryIntent = { mode: 'buy' } | { mode: 'rent'; tenancy?: 'medium' | 'long' };

export function PropertyMarketEnquiry({ propertyId, title, intent, onClose }: {
  propertyId: string;
  title: string;
  intent: PropertyEnquiryIntent;
  onClose: () => void;
}) {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const fieldId = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  // The deployed legacy RPC does not claim the nonce. A transport failure must
  // never cause a second insert, including after closing/reopening this modal.
  const [intake] = useState(() => createConsultationIntakeAttempt({ allowUncertainRetry: false }));
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const tenancy = intent.mode === 'rent' ? intent.tenancy : undefined;
  const topic = intent.mode === 'buy'
    ? t('Вопрос о покупке', 'Purchase enquiry', 'สอบถามการซื้อ')
    : tenancy === 'medium'
      ? t('Аренда на несколько месяцев', 'Medium-term rental enquiry', 'สอบถามการเช่าระยะกลาง')
      : tenancy === 'long'
        ? t('Долгосрочная аренда', 'Long-term rental enquiry', 'สอบถามการเช่าระยะยาว')
        : t('Вопрос об аренде', 'Rental enquiry', 'สอบถามการเช่า');

  const close = () => { if (!sending.current) onClose(); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || receipt || isLoading) return;
    const contact = contactIntakeSchema.safeParse({ name, phone });
    if (!contact.success) {
      setError(t('Укажите имя и действительный телефон.', 'Enter your name and a valid phone number.', 'กรอกชื่อและหมายเลขโทรศัพท์ที่ถูกต้อง'));
      return;
    }
    const entryPoint = propertyDetailHref(propertyId, intent.mode, tenancy ? `tenancy=${tenancy}` : '');
    sending.current = true;
    setSubmitting(true);
    setError('');
    try {
      const saved = await intake.submit(supabase, {
        ...contact.data,
        request_type: 'property_consultation',
        vertical_id: 'properties',
        lead_source: 'website',
        preferred_language: language,
        entry_point: entryPoint,
        vertical_metadata: {
          property_id: propertyId,
          intent: intent.mode === 'buy' ? 'purchase_enquiry' : 'rental_enquiry',
          mode: intent.mode,
          ...(tenancy ? { tenancy } : {}),
          request_only: true,
          schema_version: 1,
        },
        // Existing operator views can read the subject and exact source even
        // if they do not yet render this structured intake type.
        notes: [`${topic}: ${title}`, entryPoint, notes.trim()].filter(Boolean).join('\n'),
      }, user?.id);
      setReceipt(saved.id);
    } catch (cause) {
      setError(pickLang(language, consultationIntakeErrorCopy(cause)));
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open onOpenChange={open => { if (!open) close(); }} title={topic}
      description={title} size="sm">
      {receipt ? (
        <div className="space-y-4">
          <div role="status" className="space-y-2">
            <p className="font-semibold">{t('Заявка сохранена в myUNO', 'Request saved in myUNO', 'บันทึกคำขอใน myUNO แล้ว')}</p>
            <p className="break-all text-sm text-muted-foreground">{t('Номер заявки', 'Request ID', 'หมายเลขคำขอ')} {receipt}</p>
          </div>
          <Button type="button" variant="outline" onClick={close}>{t('Закрыть', 'Close', 'ปิด')}</Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit} aria-busy={submitting}>
          <p className="text-sm text-muted-foreground">
            {t('Заявку получит команда myUNO. Это не бронирование и не оплата.', 'The myUNO team will review your enquiry. This does not reserve the property or charge you.', 'ทีม myUNO จะตรวจสอบคำขอ ไม่ใช่การจองและไม่มีการเรียกเก็บเงิน')}
          </p>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-name`}>{t('Имя', 'Name', 'ชื่อ')}</Label>
            <Input id={`${fieldId}-name`} autoComplete="name" value={name} onChange={event => setName(event.target.value)}
              required maxLength={120} disabled={submitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-phone`}>{t('Телефон или WhatsApp', 'Phone or WhatsApp', 'โทรศัพท์หรือ WhatsApp')}</Label>
            <Input id={`${fieldId}-phone`} type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)}
              required maxLength={40} disabled={submitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-notes`}>{t('Ваш вопрос (необязательно)', 'Your question (optional)', 'คำถามของคุณ (ไม่จำเป็น)')}</Label>
            <Textarea id={`${fieldId}-notes`} value={notes} onChange={event => setNotes(event.target.value)}
              rows={3} maxLength={1000} disabled={submitting} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal" disabled={isLoading || submitting}>
            {submitting ? t('Отправляем…', 'Sending…', 'กำลังส่ง…') : t('Отправить в myUNO', 'Send to myUNO', 'ส่งให้ myUNO')}
          </Button>
        </form>
      )}
    </ResponsiveModal>
  );
}
