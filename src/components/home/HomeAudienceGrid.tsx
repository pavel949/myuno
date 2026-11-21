import { ArrowRight, BriefcaseBusiness, Building2, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

type AudienceCard = {
  icon: typeof Home;
  href: string;
  title: LangValues;
  description: LangValues;
  action: LangValues;
};

const audiences: AudienceCard[] = [
  {
    icon: Home,
    href: R.PROPERTY_RENT,
    title: { ru: 'Я гость или арендатор', en: 'I am a guest or renter', th: 'ฉันเป็นผู้เข้าพักหรือผู้เช่า' },
    description: { ru: 'Найдите жильё на отпуск или длительный срок и отправьте запрос по подходящему объекту.', en: 'Explore holiday and long-term homes and enquire about the right place.', th: 'ค้นหาที่พักระยะสั้นหรือระยะยาวและสอบถามรายการที่เหมาะสม' },
    action: { ru: 'Найти жильё', en: 'Find a home', th: 'ค้นหาที่พัก' },
  },
  {
    icon: Building2,
    href: R.GOAL_BUY,
    title: { ru: 'Я покупатель или инвестор', en: 'I am a buyer or investor', th: 'ฉันเป็นผู้ซื้อหรือนักลงทุน' },
    description: { ru: 'Изучайте недвижимость и новостройки, сравнивайте варианты и обращайтесь за подбором.', en: 'Explore homes and new developments, compare options and request assistance.', th: 'สำรวจอสังหาริมทรัพย์และโครงการใหม่ เปรียบเทียบตัวเลือกและขอคำแนะนำ' },
    action: { ru: 'Смотреть недвижимость', en: 'Explore properties', th: 'ดูอสังหาริมทรัพย์' },
  },
  {
    icon: Sparkles,
    href: R.EXPERIENCES,
    title: { ru: 'Я ищу впечатления', en: 'I am exploring experiences', th: 'ฉันกำลังมองหากิจกรรม' },
    description: { ru: 'Откройте занятия и впечатления на острове.', en: 'Discover activities and experiences across the island.', th: 'ค้นหากิจกรรมและประสบการณ์บนเกาะ' },
    action: { ru: 'Смотреть впечатления', en: 'Explore experiences', th: 'ดูกิจกรรม' },
  },
  {
    icon: Building2,
    href: R.FOR_OWNERS,
    title: { ru: 'У меня есть недвижимость', en: 'I own property', th: 'มีอสังหาริมทรัพย์' },
    description: { ru: 'Сдача, обслуживание и управление объектом с прозрачной отчётностью.', en: 'Rent, maintain, and manage your property with transparent reporting.', th: 'ปล่อยเช่า ดูแล และจัดการทรัพย์สินพร้อมรายงานที่โปร่งใส' },
    action: { ru: 'Решения для собственников', en: 'For property owners', th: 'สำหรับเจ้าของ' },
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
    title: { ru: 'Я застройщик или девелопер', en: 'I am a developer', th: 'เป็นผู้พัฒนาโครงการ' },
    description: { ru: 'Размещайте проекты, принимайте обращения покупателей и управляйте лидами.', en: 'List projects, capture buyer enquiries, and manage your development leads.', th: 'ลงประกาศโครงการ รับคำถามผู้ซื้อ และจัดการลีดของโครงการ' },
    action: { ru: 'Для застройщиков', en: 'For developers', th: 'สำหรับผู้พัฒนา' },
  },
  {
    icon: Sparkles,
    href: R.FOR_LOCAL_SERVICE_PROVIDERS,
    title: { ru: 'Предлагаю услуги', en: 'I provide local services', th: 'ให้บริการท้องถิ่น' },
    description: { ru: 'Получайте заявки от гостей, собственников и управляющих компаний.', en: 'Receive relevant requests from guests, owners, and property managers.', th: 'รับคำขอจากแขก เจ้าของ และผู้จัดการอสังหาริมทรัพย์' },
    action: { ru: 'Стать партнёром', en: 'Become a partner', th: 'ร่วมเป็นพาร์ทเนอร์' },
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
