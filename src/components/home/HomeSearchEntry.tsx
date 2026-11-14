import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

export function HomePlanLinks() {
  const { language } = useLanguage();
  return <nav className="premium-plan-links home-container" aria-label={pickLang(language, { ru: 'Начните с ваших планов', en: 'Start with your plans', th: 'เริ่มจากแผนของคุณ' })}>
    {homeSearchIntents.map(intent => <Link key={intent.query} to={`${R.PROPERTY_SEARCH}?${intent.query}`}>{pickLang(language, intent.title)}<ArrowRight size={16} aria-hidden="true" /></Link>)}
  </nav>;
}
