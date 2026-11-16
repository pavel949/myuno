import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, CalendarDays, Compass, House, KeyRound, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

type Journey = 'property' | 'services' | 'experiences';
const ITEMS = [
  { id: 'rent', href: APP_ROUTES.PROPERTY_BROWSE + '?mode=rent&tenancy=short', icon: CalendarDays, ru: 'Арендовать', en: 'Rent a place', th: 'เช่าที่พัก', subRu: 'Даты, гости и предложения жилья', subEn: 'Dates, guests and property listings', subTh: 'วันเข้าพักและจำนวนผู้เข้าพัก' },
  { id: 'buy', href: APP_ROUTES.GOAL_BUY, icon: Building2, ru: 'Купить недвижимость', en: 'Buy property', th: 'ซื้ออสังหาริมทรัพย์', subRu: 'Новостройки и вторичный рынок', subEn: 'New developments and resale', subTh: 'โครงการใหม่และมือสอง' },
  { id: 'sell', href: APP_ROUTES.SELL, icon: House, ru: 'Продать объект', en: 'Sell a property', th: 'ขายอสังหาริมทรัพย์', subRu: 'Оценка и заявка на продажу', subEn: 'Valuation and sale enquiry', subTh: 'ประเมินราคาและส่งคำขอ' },
  { id: 'manage', href: APP_ROUTES.OWNER_MANAGEMENT_LANDING, icon: KeyRound, ru: 'Управлять объектом', en: 'Manage a property', th: 'จัดการอสังหาริมทรัพย์', subRu: 'Аренда, уход и отчётность', subEn: 'Rentals, care and reporting', subTh: 'เช่า ดูแล และรายงาน' },
  { id: 'services', href: APP_ROUTES.SERVICES, icon: ShoppingBag, ru: 'Услуги', en: 'Services', th: 'บริการ', subRu: 'Для жизни и отдыха', subEn: 'For life and travel', subTh: 'สำหรับชีวิตและการเดินทาง' },
  { id: 'experiences', href: APP_ROUTES.EXPERIENCES, icon: Compass, ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์', subRu: 'Яхты, туры и активности', subEn: 'Yachts, tours and activities', subTh: 'เรือยอชต์ ทัวร์ และกิจกรรม' },
] as const;

/** One DS2.1 navigation pattern shared across public verticals; links preserve existing route contracts. */
export function PlatformJourneyLinks({ journey }: { journey: Journey }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const selected = journey === 'property' ? ITEMS.slice(0, 4) : ITEMS.slice(4);
  return <nav aria-label={t('Выберите направление', 'Choose your journey', 'เลือกบริการ')} className="space-y-3">
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-h3">{t('С чего начнём?', 'Where shall we start?', 'เริ่มจากตรงไหนดี')}</h2>
      <Link to={APP_ROUTES.DISCOVER} className="text-sm font-medium text-primary underline-offset-4 hover:underline">{t('Все возможности', 'All possibilities', 'ดูทั้งหมด')}</Link>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {selected.map(item => <Link key={item.id} to={item.href} className="group flex min-h-32 flex-col justify-between border border-border bg-card p-[var(--card-padding)] transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center justify-between gap-2"><item.icon className="size-5 text-primary" aria-hidden="true"/><ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" aria-hidden="true"/></span>
        <span className="mt-4 space-y-1"><span className="block font-display text-lg font-semibold text-foreground">{t(item.ru, item.en, item.th)}</span><span className="block text-sm text-muted-foreground">{t(item.subRu, item.subEn, item.subTh)}</span></span>
      </Link>)}
    </div>
  </nav>;
}
