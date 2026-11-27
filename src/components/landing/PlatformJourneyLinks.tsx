import { Building2, CalendarDays, Compass, House, KeyRound, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { MarketplaceDiscoveryMenu } from '@/components/services/MarketplaceDiscoveryMenu';
import { pickLang } from '@/lib/i18n/pickLang';

type Journey = 'property' | 'services' | 'experiences';
const ITEMS = [
  { id: 'rent', href: APP_ROUTES.PROPERTY_RENT, icon: CalendarDays, ru: 'Арендовать', en: 'Rent a place', th: 'เช่าที่พัก', subRu: 'Даты, гости и предложения жилья', subEn: 'Dates, guests and property listings', subTh: 'วันเข้าพักและจำนวนผู้เข้าพัก' },
  { id: 'buy', href: APP_ROUTES.GOAL_BUY, icon: Building2, ru: 'Купить недвижимость', en: 'Buy property', th: 'ซื้ออสังหาริมทรัพย์', subRu: 'Новостройки и вторичный рынок', subEn: 'New developments and resale', subTh: 'โครงการใหม่และมือสอง' },
  { id: 'sell', href: APP_ROUTES.PROPERTY_SELL, icon: House, ru: 'Продать объект', en: 'Sell a property', th: 'ขายอสังหาริมทรัพย์', subRu: 'Обсудить продажу с командой', subEn: 'Discuss a sale with the team', subTh: 'ปรึกษาทีมงานเรื่องการขาย' },
  { id: 'manage', href: APP_ROUTES.FOR_OWNERS, icon: KeyRound, ru: 'Управлять объектом', en: 'Manage a property', th: 'จัดการอสังหาริมทรัพย์', subRu: 'Аренда, уход и отчётность', subEn: 'Rentals, care and reporting', subTh: 'เช่า ดูแล และรายงาน' },
  { id: 'services', href: APP_ROUTES.SERVICES, icon: ShoppingBag, ru: 'Услуги', en: 'Services', th: 'บริการ', subRu: 'Для жизни и отдыха', subEn: 'For life and travel', subTh: 'สำหรับชีวิตและการเดินทาง' },
  { id: 'experiences', href: APP_ROUTES.EXPERIENCES, icon: Compass, ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์', subRu: 'Яхты, туры и активности', subEn: 'Yachts, tours and activities', subTh: 'เรือยอชต์ ทัวร์ และกิจกรรม' },
] as const;

/** One DS2.1 navigation pattern shared across public verticals; links preserve existing route contracts. */
export function PlatformJourneyLinks({ journey }: { journey: Journey }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const selected = journey === 'property' ? ITEMS.slice(0, 4) : ITEMS.slice(4);
  return <nav aria-label={t('Выберите направление', 'Choose your journey', 'เลือกบริการ')}><MarketplaceDiscoveryMenu
    title={t('С чего начнём?', 'Where shall we start?', 'เริ่มจากตรงไหนดี')}
    allHref={APP_ROUTES.DISCOVER}
    allLabel={t('Все возможности', 'All possibilities', 'ดูทั้งหมด')}
    items={selected.map(item => ({ id: item.id, href: item.href, icon: item.icon,
      label: t(item.ru, item.en, item.th), description: t(item.subRu, item.subEn, item.subTh) }))}
  /></nav>;
}
