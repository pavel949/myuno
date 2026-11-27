import { ArrowRight, BriefcaseBusiness, Building2, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R, partnerOfferHref } from '@/lib/config/routes';

type AudienceCard = {
  icon: typeof Home;
  href: string;
  title: LangValues;
  description: LangValues;
  action: LangValues;
};

const audiences: AudienceCard[] = [
  {
    icon: Building2,
    href: R.OWNER_ONBOARDING,
    title: { ru: 'У меня есть недвижимость', en: 'I own property', th: 'มีอสังหาริมทรัพย์' },
    description: { ru: 'Добавьте виллу, квартиру или дом, который хотите предложить гостям.', en: 'Add the villa, apartment or home you would like to list for guests.', th: 'เพิ่มวิลล่า อพาร์ตเมนต์ หรือบ้านที่ต้องการเสนอให้ผู้เข้าพัก' },
    action: { ru: 'Разместить жильё', en: 'List a property', th: 'ลงประกาศที่พัก' },
  },
  {
    icon: Sparkles,
    href: partnerOfferHref('services'),
    title: { ru: 'Предлагаю услуги', en: 'I provide local services', th: 'ให้บริการท้องถิ่น' },
    description: { ru: 'Получайте заявки от гостей, собственников и управляющих компаний.', en: 'Receive relevant requests from guests, owners, and property managers.', th: 'รับคำขอจากแขก เจ้าของ และผู้จัดการอสังหาริมทรัพย์' },
    action: { ru: 'Предложить услугу', en: 'Offer a service', th: 'เสนอบริการ' },
  },
  {
    icon: Sparkles,
    href: partnerOfferHref('experiences'),
    title: { ru: 'Провожу экскурсии и мероприятия', en: 'I organise experiences', th: 'จัดกิจกรรมและทัวร์' },
    description: { ru: 'Расскажите о маршруте, мастер-классе или другом занятии для гостей.', en: 'Tell us about a tour, workshop or other activity you offer to guests.', th: 'แนะนำทัวร์ เวิร์กช็อป หรือกิจกรรมสำหรับผู้เข้าพัก' },
    action: { ru: 'Предложить впечатление', en: 'Offer an experience', th: 'เสนอกิจกรรม' },
  },
  {
    icon: BriefcaseBusiness,
    href: R.FOR_MANAGEMENT_COMPANIES,
    title: { ru: 'Управляю портфелем', en: 'I manage a portfolio', th: 'บริหารพอร์ตอสังหาริมทรัพย์' },
    description: { ru: 'Бронирования, задачи, команда, финансы и отчёты в одном рабочем пространстве.', en: 'Bookings, tasks, teams, finances, and owner reports in one workspace.', th: 'การจอง งาน ทีม การเงิน และรายงานเจ้าของในพื้นที่เดียว' },
    action: { ru: 'Посмотреть платформу', en: 'View the platform', th: 'ดูแพลตฟอร์ม' },
  },
  {
    icon: Building2,
    href: R.FOR_REAL_ESTATE_DEVELOPERS,
    title: { ru: 'Я застройщик', en: 'I am a developer', th: 'เป็นผู้พัฒนาโครงการ' },
    description: { ru: 'Размещайте проекты и отвечайте на обращения покупателей.', en: 'List projects, capture buyer enquiries, and manage your development leads.', th: 'ลงประกาศโครงการ รับคำถามผู้ซื้อ และจัดการลีดของโครงการ' },
    action: { ru: 'Для застройщиков', en: 'For developers', th: 'สำหรับผู้พัฒนา' },
  },

];

const trustSignals: LangValues[] = [
  { ru: 'Локальная команда на Пхукете', en: 'Local Phuket team', th: 'ทีมท้องถิ่นในภูเก็ต' },
  { ru: 'Поддержка на русском, английском и тайском', en: 'Support in English, Russian, and Thai', th: 'รองรับภาษาอังกฤษ รัสเซีย และไทย' },
  { ru: 'Прозрачные условия и отчёты', en: 'Transparent terms and reporting', th: 'เงื่อนไขและรายงานที่โปร่งใส' },
  { ru: 'Помощь человека, когда она нужна', en: 'Human help when you need it', th: 'มีทีมงานช่วยเหลือเมื่อคุณต้องการ' },
];

export function HomeAudienceGrid() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);

  return (
    <section className="home-audience home-container" aria-label={t({ ru: 'Решения для собственников и партнёров', en: 'Solutions for owners and partners', th: 'บริการสำหรับเจ้าของและพาร์ทเนอร์' })}>
      <div className="home-audience-grid">
        {audiences.map(({ icon: Icon, href, title, description, action }) => (
          <Link key={href} to={href} className="home-audience-card">
            <Icon className="home-audience-icon" size={28} aria-hidden="true" />
            <h3>{t(title)}</h3>
            <p>{t(description)}</p>
            <span>{t(action)} <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeTrustBar() {
  const { language } = useLanguage();
  return (
    <section className="home-trust home-container" aria-label={pickLang(language, { ru: 'Почему myUNO', en: 'Why myUNO', th: 'ทำไมต้อง myUNO' })}>
      <ul>
        {trustSignals.map((signal) => <li key={pickLang(language, signal)}>{pickLang(language, signal)}</li>)}
      </ul>
    </section>
  );
}
