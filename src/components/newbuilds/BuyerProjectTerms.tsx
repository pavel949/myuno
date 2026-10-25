import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { BuyerRequestForm } from './BuyerRequestForm';
/** No cost or payment obligation is inferred from marketing copy or expired promos. */
export function BuyerProjectTerms({ projectId }: { projectId: string }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const pending = t('Требует подтверждения', 'Requires confirmation', 'ต้องยืนยัน');
  const rows = [
    t('Владение и иностранная квота', 'Ownership and foreign quota', 'กรรมสิทธิ์และโควตาต่างชาติ'),
    t('График платежей и срок действия цены', 'Payment schedule and price validity', 'กำหนดชำระเงินและอายุราคา'),
    t('Сбор за регистрацию / переход права', 'Registration / transfer fees', 'ค่าจดทะเบียนและค่าโอน'),
    t('Разовый взнос в фонд', 'Sinking fund contribution', 'เงินกองทุนส่วนกลาง'),
    t('Периодические расходы на содержание', 'Recurring maintenance fees', 'ค่าส่วนกลางประจำ'),
    t('Комплектация и обязательные пакеты', 'Fit-out and mandatory packages', 'การตกแต่งและแพ็กเกจที่จำเป็น'),
  ];
  return <section className="space-y-4">
    <h3 className="font-semibold">{t('Условия и расходы', 'Terms and costs', 'เงื่อนไขและค่าใช้จ่าย')}</h3>
    <p className="text-sm text-muted-foreground">{t('Проверенная версия предложения пока не опубликована. Команда уточнит полный бюджет, документы и сроки до любого обязательства.', 'A verified offer revision is not published yet. The team will confirm the full budget, documents and dates before any commitment.', 'ยังไม่มีข้อเสนอฉบับยืนยัน ทีมงานจะตรวจสอบงบประมาณ เอกสาร และกำหนดเวลาก่อนมีข้อผูกพัน')}</p>
    <dl className="divide-y">{rows.map(label => <div key={label} className="py-3 flex flex-wrap gap-2 justify-between"><dt>{label}</dt><dd className="text-muted-foreground">{pending}</dd></div>)}</dl>
    <BuyerRequestForm projectId={projectId} intent="documents" />
  </section>;
}
