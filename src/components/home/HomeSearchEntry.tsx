import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

/** Shortcuts select existing offers; they never establish availability or billing. */
const homeSearchIntents = [
  { href: `${R.PROPERTY_SEARCH}?mode=rent&tenancy=short`, title: { ru: 'На время поездки', en: 'For a holiday', th: 'สำหรับวันหยุด' } },
  { href: `${R.PROPERTY_SEARCH}?mode=rent&tenancy=medium`, title: { ru: 'На несколько месяцев', en: 'For a few months', th: 'พักหลายเดือน' } },
  { href: `${R.PROPERTY_SEARCH}?mode=rent&tenancy=long`, title: { ru: 'Поселиться надолго', en: 'Settle in for longer', th: 'อยู่อาศัยระยะยาว' } },
  { href: R.GOAL_BUY, title: { ru: 'Купить дом', en: 'Buy a home', th: 'ซื้อบ้าน' } },
] satisfies { href: string; title: LangValues }[];

export function HomeSearchEntry() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  return <div className="home-search-entry">
    <Link className="home-search-entry-button" to={R.DISCOVER}>
      <Search className="home-search-symbol" size={23} aria-hidden="true" />
      <span className="home-search-entry-copy"><strong>{t({ ru: 'С чего начнём?', en: 'What are you looking for?', th: 'คุณกำลังมองหาอะไร' })}</strong><small>{t({ ru: 'Аренда, покупка, переезд или услуга — сначала выберите задачу', en: 'Rent, buy, move or find a service — choose your goal first', th: 'เช่า ซื้อ ย้ายมาอยู่ หรือหาบริการ — เลือกเป้าหมายก่อน' })}</small></span>
      <span className="home-search-entry-action" aria-hidden="true"><span>{t({ ru: 'Выбрать', en: 'Choose', th: 'เลือก' })}</span><ArrowRight size={20} /></span>
    </Link>
  </div>;
}

export function HomePlanLinks() {
  const { language } = useLanguage();
  return <nav className="premium-plan-links home-container" aria-label={pickLang(language, { ru: 'Начните с ваших планов', en: 'Start with your plans', th: 'เริ่มจากแผนของคุณ' })}>
    {homeSearchIntents.map(intent => <Link key={intent.href} to={intent.href}>{pickLang(language, intent.title)}<ArrowRight size={16} aria-hidden="true" /></Link>)}
  </nav>;
}
