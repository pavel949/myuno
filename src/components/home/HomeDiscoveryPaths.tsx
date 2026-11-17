import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

/** Useful navigation when a photographic preview is unavailable, not substitute supply. */
export function HomeDiscoveryPaths({ kind }: { kind: 'homes' | 'experiences' }) {
  const { language } = useLanguage();
  const paths = kind === 'homes' ? [
    { to: R.PROPERTY_RENT_SHORT, label: { ru: 'На время поездки', en: 'For a holiday', th: 'สำหรับวันหยุด' } },
    { to: R.PROPERTY_RENT_LONG, label: { ru: 'Для жизни на острове', en: 'For a longer stay', th: 'สำหรับการพักระยะยาว' } },
  ] : [
    { to: `${R.EXPERIENCES}?type=tour`, label: { ru: 'Экскурсии', en: 'Tours', th: 'ทัวร์' } },
    { to: `${R.EXPERIENCES}?type=activity`, label: { ru: 'Активный отдых', en: 'Activities', th: 'กิจกรรม' } },
  ];
  return <div className="home-discovery-paths">
    {paths.map(path => <Link key={path.to} to={path.to} className="home-text-link">
      {pickLang(language, path.label)}<ArrowRight size={18} aria-hidden="true" />
    </Link>)}
  </div>;
}
