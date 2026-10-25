import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useUniversalLead } from '@/hooks/useUniversalLead';
import { buyerRequestContext, OFFPLAN_VERTICAL, type BuyerIntent } from '@/lib/offplan/buyerContract';
import { validateContactIntake } from '@/lib/crm/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function BuyerRequestForm({ projectId, unitId, intent = 'consultation' }: { projectId: string; unitId?: string; intent?: BuyerIntent }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { submitLead, isSubmitting } = useUniversalLead();
  const [receipt, setReceipt] = useState<string>();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [selectedIntent, setIntent] = useState<BuyerIntent>(intent);
  if (receipt) return <div role="status" className="space-y-3 p-4">
    <p>{t('Заявка сохранена. Команда проверит условия и свяжется с вами.', 'Request saved. The team will check the terms and contact you.', 'บันทึกคำขอแล้ว ทีมงานจะตรวจสอบเงื่อนไขและติดต่อคุณ')}</p>
    <p className="text-xs break-all">{t('Номер заявки', 'Request reference', 'หมายเลขคำขอ')}: {receipt}</p>
    <p>{t('Это запрос: объект не удерживается, оплата не требуется.', 'This is a request: the unit is not held and no payment is required.', 'นี่คือคำขอ ยังไม่มีการกันยูนิตและไม่ต้องชำระเงิน')}</p>
  </div>;
  return <form className="space-y-4 p-4" onSubmit={async e => {
    e.preventDefault(); setError('');
    if (!validateContactIntake(form).ok) { setError(t('Проверьте имя и контактные данные.', 'Check your name and contact details.', 'โปรดตรวจสอบชื่อและข้อมูลติดต่อ')); return; }
    try {
      const result = await submitLead.mutateAsync({ vertical_id: OFFPLAN_VERTICAL, request_type: 'property_consultation', lead_source: 'cta', entry_point: 'offplan_buyer', name: form.name, phone: form.phone, email: form.email || undefined, preferred_language: language, notes: form.notes, vertical_metadata: buyerRequestContext(projectId, selectedIntent, unitId) });
      if (!result?.id) throw new Error('Missing receipt');
      setReceipt(result.id);
    } catch { setError(t('Сохранение не подтверждено. Попробуйте ещё раз.', 'Saving was not confirmed. Please try again.', 'ยังยืนยันการบันทึกไม่ได้ โปรดลองอีกครั้ง')); }
  }}>
    <Label htmlFor="buyer-intent">{t('Что вас интересует', 'Request', 'คำขอ')}</Label>
    <select id="buyer-intent" className="w-full border bg-background p-2" value={selectedIntent} onChange={e => setIntent(e.target.value as BuyerIntent)}>
      <option value="documents">{t('Документы', 'Documents', 'เอกสาร')}</option><option value="viewing">{t('Просмотр', 'Viewing', 'นัดชม')}</option><option value="reserve_request">{t('Запрос резерва', 'Reservation request', 'คำขอจอง')}</option><option value="consultation">{t('Консультация', 'Consultation', 'ปรึกษา')}</option>
    </select>
    {(['name', 'phone', 'email'] as const).map((key, i) => <div key={key}><Label htmlFor={`buyer-${key}`}>{[t('Имя', 'Name', 'ชื่อ'), t('Телефон', 'Phone', 'โทรศัพท์'), t('Email', 'Email', 'อีเมล')][i]}</Label><Input id={`buyer-${key}`} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}
    <Label htmlFor="buyer-notes">{t('Комментарий', 'Message', 'ข้อความ')}</Label><Textarea id="buyer-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
    <p className="text-sm text-muted-foreground">{t('Запрос не удерживает объект и не требует оплаты. Наличие и условия подтвердит команда.', 'A request does not hold the unit or require payment. The team will confirm availability and terms.', 'คำขอไม่กันยูนิตและไม่ต้องชำระเงิน ทีมงานจะยืนยันสถานะและเงื่อนไข')}</p>
    {error && <p role="alert">{error}</p>}<Button type="submit" disabled={isSubmitting}>{t('Отправить запрос', 'Send request', 'ส่งคำขอ')}</Button>
  </form>;
}
