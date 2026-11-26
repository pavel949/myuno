import { Link } from 'react-router-dom';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

const sections = [
  {
    title: { en: 'Stay', ru: 'Жильё', th: 'ที่พัก' },
    links: [
      { path: R.PROPERTY_RENT, en: 'Explore stays', ru: 'Найти жильё', th: 'ค้นหาที่พัก' },
      { path: R.AREA_INDEX, en: 'Areas', ru: 'Районы', th: 'ย่านต่าง ๆ' },
      { path: R.PROPERTY_RENT_LONG, en: 'Long-term rentals', ru: 'Долгосрочная аренда', th: 'เช่าระยะยาว' },
    ],
  },
  {
    title: { en: 'Services', ru: 'Услуги', th: 'บริการ' },
    links: [
      { path: R.GOAL_SERVICES, en: 'Browse services', ru: 'Все услуги', th: 'ดูบริการ' },
      { path: R.EXPERIENCES, en: 'Experiences', ru: 'Впечатления', th: 'ประสบการณ์' },
      { path: R.FOR_LOCAL_SERVICE_PROVIDERS, en: 'For providers', ru: 'Поставщикам услуг', th: 'สำหรับผู้ให้บริการ' },
    ],
  },
  {
    title: { en: 'Living', ru: 'Жизнь', th: 'ใช้ชีวิต' },
    links: [
      { path: R.RELOCATE, en: 'Relocation', ru: 'Переезд', th: 'การย้ายถิ่นฐาน' },
      { path: R.PROPERTY_BUY, en: 'Homes for sale', ru: 'Купить жильё', th: 'บ้านสำหรับขาย' },
      { path: R.INVEST, en: 'Investing', ru: 'Инвестиции', th: 'ลงทุน' },
    ],
  },
  {
    title: { en: 'Owners', ru: 'Собственники', th: 'เจ้าของ' },
    links: [
      { path: R.FOR_OWNERS, en: 'For owners', ru: 'Собственникам', th: 'สำหรับเจ้าของ' },
      { path: R.FOR_MANAGEMENT_COMPANIES, en: 'Management companies', ru: 'Управляющим компаниям', th: 'สำหรับบริษัทจัดการ' },
      { path: R.FOR_REAL_ESTATE_DEVELOPERS, en: 'For developers', ru: 'Застройщикам', th: 'สำหรับผู้พัฒนา' },
      { path: R.OWNER_PORTAL, en: 'Owner sign in', ru: 'Вход для собственников', th: 'เข้าสู่ระบบเจ้าของ' },
    ],
  },
  {
    title: { en: 'myUNO', ru: 'myUNO', th: 'myUNO' },
    links: [
      { path: R.FOR_BUSINESS, en: 'For business', ru: 'Для бизнеса', th: 'สำหรับธุรกิจ' },
      { path: R.SUPPORT, en: 'Help', ru: 'Помощь', th: 'ความช่วยเหลือ' },
      { path: R.PRIVACY, en: 'Privacy', ru: 'Конфиденциальность', th: 'ความเป็นส่วนตัว' },
      { path: R.TERMS, en: 'Terms', ru: 'Условия', th: 'ข้อกำหนด' },
    ],
  },
];

export function PublicFooterDirectory() {
  const { language } = useLanguage();
  return (
    <nav aria-label={pickLang(language, { en: 'More links', ru: 'Дополнительные разделы', th: 'ลิงก์เพิ่มเติม' })} className="public-footer-directory">
      {sections.map(({ title, links }) => (
        <div key={title.en}>
          <h3 className="text-body font-semibold">{pickLang(language, title)}</h3>
          <ul>
            {links.map(({ path, en, ru, th }) => (
              <li key={path}><Link className="ds-focus" to={path}>{pickLang(language, { en, ru, th })}</Link></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
