import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

/** Useful navigation when browsing the existing marketplace routes. */
export function HomeDiscoveryPaths({ kind }: { kind: 'homes' | 'experiences' | 'services' }) {
  const { language } = useLanguage();
  const paths = kind === 'homes' ? [
    { to: R.PROPERTY_RENT_SHORT, label: { ru: 'На время поездки', en: 'For a holiday', th: 'สำหรับวันหยุด' } },
    { to: R.PROPERTY_RENT_LONG, label: { ru: 'Для жизни на острове', en: 'For a longer stay', th: 'สำหรับการพักระยะยาว' } },
    { to: R.OFFPLAN_SEARCH, label: { ru: 'Новостройки', en: 'New developments', th: 'โครงการใหม่' } },
    { to: R.RESALE, label: { ru: 'Вторичное жильё', en: 'Resale homes', th: 'บ้านมือสอง' } },
    { to: R.INVEST_REAL_ESTATE, label: { ru: 'Инвестиции в недвижимость', en: 'Property investment', th: 'ลงทุนอสังหาริมทรัพย์' } },
  ] : kind === 'services' ? [
    { to: R.VISA_IMMIGRATION, label: { ru: 'Визы и иммиграция', en: 'Visas and immigration', th: 'วีซ่าและการย้ายถิ่น' } },
    { to: R.LEGAL, label: { ru: 'Юридические услуги', en: 'Legal services', th: 'บริการด้านกฎหมาย' } },
    { to: R.PETS, label: { ru: 'Услуги для животных', en: 'Pet services', th: 'บริการสัตว์เลี้ยง' } },
  ] : [
    { to: R.YACHTS, label: { ru: 'Яхты и морские прогулки', en: 'Yachts and boat trips', th: 'เรือยอชต์และทริปทางทะเล' } },
    { to: `${R.EXPERIENCES}?type=tour`, label: { ru: 'Экскурсии', en: 'Tours', th: 'ทัวร์' } },
    { to: `${R.EXPERIENCES}?type=activity`, label: { ru: 'Активный отдых', en: 'Activities', th: 'กิจกรรม' } },
  ];
  return <div className="home-discovery-paths">
    {paths.map(path => <Link key={path.to} to={path.to} className="home-text-link">
      {pickLang(language, path.label)}<ArrowRight size={18} aria-hidden="true" />
    </Link>)}
  </div>;
}
