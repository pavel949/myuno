import { Link } from 'react-router-dom';
import { APP_ROUTES as R, partnerOfferHref } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

const sections = [
  {
    title: { en: 'Rent', ru: 'Аренда', th: 'เช่า' },
    links: [
      { path: R.PROPERTY_RENT, en: 'Find a home', ru: 'Найти жильё', th: 'ค้นหาที่พัก' },
      { path: R.PROPERTY_RENT_LONG, en: 'Long-term rentals', ru: 'Долгосрочная аренда', th: 'เช่าระยะยาว' },
      { path: R.AREA_INDEX, en: 'Areas', ru: 'Районы', th: 'ย่านต่าง ๆ' },
    ],
  },
  {
    title: { en: 'Buy', ru: 'Покупка', th: 'ซื้อ' },
    links: [
      { path: R.PROPERTY_BUY, en: 'Homes for sale', ru: 'Готовое жильё', th: 'บ้านสำหรับขาย' },
      { path: R.OFFPLAN, en: 'New developments', ru: 'Новостройки', th: 'โครงการใหม่' },
      { path: R.INVEST, en: 'Investing', ru: 'Инвестиции', th: 'ลงทุน' },
    ],
  },
  {
    title: { en: 'Experiences and services', ru: 'Впечатления и сервисы', th: 'ประสบการณ์และบริการ' },
    links: [
      { path: R.EXPERIENCES, en: 'Experiences', ru: 'Впечатления', th: 'ประสบการณ์' },
      { path: R.GOAL_SERVICES, en: 'Services', ru: 'Сервисы', th: 'บริการ' },
    ],
  },
  {
    title: { en: 'Island life', ru: 'Жизнь на острове', th: 'ชีวิตบนเกาะ' },
    links: [
      { path: R.DISCOVER, en: 'Life situations', ru: 'Жизненные ситуации', th: 'สถานการณ์ในชีวิต' },
      { path: R.RELOCATE, en: 'Relocation', ru: 'Переезд', th: 'การย้ายถิ่นฐาน' },
    ],
  },
  {
    title: { en: 'Partners', ru: 'Партнёрам', th: 'พาร์ทเนอร์' },
    links: [
      { path: R.LIST_WITH_US, en: 'Post a listing', ru: 'Разместить объявление', th: 'ลงประกาศ' },
      { path: R.FOR_OWNERS, en: 'For owners', ru: 'Собственникам', th: 'สำหรับเจ้าของ' },
      { path: R.FOR_REAL_ESTATE_DEVELOPERS, en: 'For developers', ru: 'Застройщикам', th: 'สำหรับผู้พัฒนา' },
      { path: R.FOR_LOCAL_SERVICE_PROVIDERS, en: 'For service providers', ru: 'Поставщикам услуг', th: 'สำหรับผู้ให้บริการ' },
      { path: partnerOfferHref('experiences'), en: 'For experience providers', ru: 'Поставщикам впечатлений', th: 'สำหรับผู้จัดกิจกรรม' },
      { path: R.OWNER_PORTAL, en: 'Owner sign in', ru: 'Вход для собственников', th: 'เข้าสู่ระบบเจ้าของ' },
    ],
  },
  {
    title: { en: 'myUNO', ru: 'myUNO', th: 'myUNO' },
    links: [
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
