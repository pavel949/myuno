import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { projectStartingPrice } from '@/lib/real-estate/publicNewbuildPresentation';

/** The canonical project editor stores price_from in THB. Do not relabel it
 * with viewer currency or advertise it as a verified unit-level minimum. */
export function ProjectStartingPrice({ price, className = '' }: { price: unknown; className?: string }) {
  const { language } = useLanguage();
  const amount = projectStartingPrice(price);
  if (amount == null) return <span className={className}>{pickLang(language, { ru: 'Цена уточняется', en: 'Price to be confirmed', th: 'อยู่ระหว่างยืนยันราคา' })}</span>;
  const formatted = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 }).format(amount);
  return <span className={`inline-flex min-w-0 max-w-full flex-col ${className}`}>
    <span className="break-words">{pickLang(language, { ru: 'от', en: 'From', th: 'เริ่มต้น' })} {formatted} THB</span>
    <small className="text-[length:var(--public-caption-size)] font-normal text-muted-foreground">{pickLang(language, { ru: 'Цена требует уточнения', en: 'Price requires confirmation', th: 'ต้องยืนยันราคา' })}</small>
  </span>;
}
