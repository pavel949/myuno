import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
export function BuyerRequestSummary({ metadata }: { metadata: Record<string, unknown> | null }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  if (metadata?.request_only !== true || typeof metadata.project_id !== 'string') return null;
  const intents: Record<string, string> = { documents: t('Документы', 'Documents', 'เอกสาร'), viewing: t('Просмотр', 'Viewing', 'นัดชม'), reserve_request: t('Запрос резерва', 'Reservation request', 'คำขอจอง'), consultation: t('Консультация', 'Consultation', 'ปรึกษา') };
  return <section className="border p-3 space-y-2" aria-label={t('Заявка по новостройке', 'Newbuild enquiry', 'คำขอโครงการใหม่')}>
    <p>{t('Намерение', 'Intent', 'ความต้องการ')}: {intents[String(metadata.intent)] || t('Уточнить', 'Clarify', 'รอยืนยัน')}</p>
    <p>{t('Проект', 'Project', 'โครงการ')}: <Link className="underline" to={`/property/offplan/${encodeURIComponent(metadata.project_id)}`}>{metadata.project_id}</Link></p>
    {typeof metadata.unit_id === 'string' && <p>{t('Объект', 'Unit', 'ยูนิต')}: {metadata.unit_id}</p>}
    <p className="text-sm text-muted-foreground">{t('Только запрос. Резерв и оплата не подтверждены.', 'Request only. Reservation and payment are not confirmed.', 'คำขอเท่านั้น ยังไม่ยืนยันการจองและการชำระเงิน')}</p>
  </section>;
}
