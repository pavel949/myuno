import { ArrowRight, Building2, Compass, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

type HeroChoice = {
  icon: typeof Home;
  href: string;
  label: LangValues;
  description: LangValues;
};

const choices: HeroChoice[] = [
  {
    icon: Home,
    href: `${R.PROPERTY_SEARCH}?mode=rent`,
    label: { ru: 'Снять жильё', en: 'Rent a home', th: 'เช่าที่พัก' },
    description: { ru: 'На отпуск, несколько месяцев или надолго', en: 'For a holiday, a few months, or longer', th: 'สำหรับวันหยุด หลายเดือน หรือระยะยาว' },
  },
  {
    icon: Building2,
    href: `${R.PROPERTY_SEARCH}?mode=buy`,
    label: { ru: 'Купить недвижимость', en: 'Buy property', th: 'ซื้ออสังหาริมทรัพย์' },
    description: { ru: 'Дома, квартиры, новые проекты', en: 'Homes, condos, new projects', th: 'บ้าน คอนโด โครงการใหม่' },
  },
  {
    icon: Compass,
    href: R.EXPERIENCES,
    label: { ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์' },
    description: { ru: 'Идеи для отдыха и островной жизни', en: 'Ideas for island days and nights', th: 'ไอเดียสำหรับวันพักผ่อนบนเกาะ' },
  },
  {
    icon: Sparkles,
    href: R.GOAL_SERVICES,
    label: { ru: 'Найти услугу', en: 'Find a service', th: 'ค้นหาบริการ' },
    description: { ru: 'Трансфер, уборка, переезд и помощь', en: 'Transfers, cleaning, moving, and help', th: 'รถรับส่ง ทำความสะอาด ย้ายบ้าน และอื่น ๆ' },
  },
];

export function HomeHeroChoices() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);

  return (
    <div className="home-hero-choices" aria-label={t({ ru: 'Выберите задачу', en: 'Choose your goal', th: 'เลือกเป้าหมาย' })}>
      <p className="home-hero-choices-label">{t({ ru: 'С чего начнём?', en: 'Start here', th: 'เริ่มที่นี่' })}</p>
      <div className="home-hero-choice-grid">
        {choices.map(({ icon: Icon, href, label, description }) => (
          <Link key={href} className="home-hero-choice" to={href}>
            <span className="home-hero-choice-icon"><Icon size={19} aria-hidden="true" /></span>
            <span className="home-hero-choice-copy"><strong>{t(label)}</strong><small>{t(description)}</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <Link className="home-hero-help" to={R.DISCOVER}>
        {t({ ru: 'Не уверены, что выбрать? Поможем разобраться', en: 'Not sure what you need? We’ll help you choose', th: 'ไม่แน่ใจว่าจะเลือกอะไร ให้เราช่วยแนะนำ' })}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
