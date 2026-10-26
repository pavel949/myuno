import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

/** Shortcuts select existing offers; they never establish availability or billing. */
const homeSearchIntents = [
  { query: 'mode=rent&tenancy=short', title: { ru: 'На время поездки', en: 'For a holiday', th: 'สำหรับวันหยุด' } },
  { query: 'mode=rent&tenancy=medium', title: { ru: 'На несколько месяцев', en: 'For a few months', th: 'พักหลายเดือน' } },
  { query: 'mode=rent&tenancy=long', title: { ru: 'Поселиться надолго', en: 'Settle in for longer', th: 'อยู่อาศัยระยะยาว' } },
  { query: 'mode=buy', title: { ru: 'Купить дом', en: 'Buy a home', th: 'ซื้อบ้าน' } },
] satisfies { query: string; title: LangValues }[];

export function HomeSearchEntry() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  return <div className="home-search-entry">
    <Link className="home-search-entry-button" to={R.SEARCH}>
      <Search size={23} aria-hidden="true" /><span><strong>{t({ ru: 'Найти жильё или услугу', en: 'Find a home or a service', th: 'ค้นหาที่พักหรือบริการ' })}</strong><small>{t({ ru: 'Один поиск по myUNO', en: 'One search across myUNO', th: 'ค้นหาทุกอย่างใน myUNO' })}</small></span><ArrowRight size={22} aria-hidden="true" />
    </Link>
    <p>{t({ ru: 'Даты и район — когда будете готовы', en: 'Dates and area are optional', th: 'วันที่และย่านเป็นตัวเลือก' })}</p>
  </div>;
}

export function HomePlanLinks() {
  const { language } = useLanguage();
  return <nav className="premium-plan-links home-container" aria-label={pickLang(language, { ru: 'Начните с ваших планов', en: 'Start with your plans', th: 'เริ่มจากแผนของคุณ' })}>
    {homeSearchIntents.map(intent => <Link key={intent.query} to={`${R.PROPERTY_SEARCH}?${intent.query}`}>{pickLang(language, intent.title)}<ArrowRight size={16} aria-hidden="true" /></Link>)}
  </nav>;
}
