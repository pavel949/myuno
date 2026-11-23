import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { useUniversalLead } from '@/hooks/useUniversalLead';
import { buildSearchLeadInput, type SearchLeadKind } from '@/lib/searchLead';

/** Sends the current catalogue criteria to the team as a CRM request; never a booking. */
export function SearchLeadRequest({ kind, params, className = '' }: { kind: SearchLeadKind; params: URLSearchParams; className?: string }) {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const { submitLead, isSubmitting } = useUniversalLead();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const id = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || name.length > 100) return setError(t({ ru: 'Укажите имя.', en: 'Enter your name.', th: 'กรุณาระบุชื่อ' }));
    if (!/^\+?[\d\s()-]{7,20}$/.test(phone.trim())) return setError(t({ ru: 'Укажите телефон или WhatsApp в международном формате.', en: 'Enter a phone or WhatsApp number in international format.', th: 'กรุณาระบุหมายเลขโทรศัพท์หรือ WhatsApp' }));
    setError('');
    submitLead.mutate(buildSearchLeadInput(kind, params, { name, phone, notes: notes.slice(0, 1000) }), { onSuccess: () => setSent(true) });
  }

  const title = kind === 'experiences'
    ? t({ ru: 'Подобрать впечатления с командой', en: 'Get help choosing experiences', th: 'ให้ทีมช่วยเลือกประสบการณ์' })
    : kind === 'buy' ? t({ ru: 'Подбор недвижимости для покупки', en: 'Get help finding a home to buy', th: 'ให้ทีมช่วยหาที่อยู่อาศัยเพื่อซื้อ' })
    : t({ ru: 'Подбор жилья в аренду', en: 'Get help finding a rental', th: 'ให้ทีมช่วยหาที่พักเช่า' });

  return <section aria-labelledby={`${id}-t`} className={`border border-border bg-card p-4 sm:p-6 ${className}`}>
    <h2 id={`${id}-t`} className="font-display text-h4">{title}</h2>
    {sent ? <p role="status" className="mt-2 text-sm">{t({ ru: 'Заявка сохранена вместе с условиями поиска. Команда свяжется с вами.', en: 'Your request was saved with your search criteria. The team will contact you.', th: 'บันทึกคำขอพร้อมเงื่อนไขการค้นหาแล้ว ทีมจะติดต่อกลับ' })}</p> : <>
      <p className="mt-1 text-sm text-muted-foreground">{t({ ru: 'Мы передадим команде выбранные условия поиска. Это заявка, а не бронирование.', en: 'Your current search criteria are sent to the team. This is a request, not a booking.', th: 'เงื่อนไขการค้นหาจะถูกส่งให้ทีม นี่คือคำขอ ไม่ใช่การจอง' })}</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
        <label className="text-sm">{t({ ru: 'Имя', en: 'Name', th: 'ชื่อ' })}<Input className="mt-1" value={name} maxLength={100} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
        <label className="text-sm">{t({ ru: 'Телефон / WhatsApp', en: 'Phone / WhatsApp', th: 'โทรศัพท์ / WhatsApp' })}<Input className="mt-1" type="tel" value={phone} maxLength={20} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></label>
        <label className="text-sm sm:col-span-2">{t({ ru: 'Комментарий (необязательно)', en: 'Comment (optional)', th: 'ความคิดเห็น (ไม่บังคับ)' })}<Input className="mt-1" value={notes} maxLength={1000} onChange={e => setNotes(e.target.value)} /></label>
        {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" className="min-h-11 sm:col-span-2 sm:justify-self-start" disabled={isSubmitting}>{isSubmitting ? t({ ru: 'Отправляем…', en: 'Sending…', th: 'กำลังส่ง…' }) : t({ ru: 'Отправить заявку', en: 'Send request', th: 'ส่งคำขอ' })}</Button>
      </form>
    </>}
  </section>;
}
