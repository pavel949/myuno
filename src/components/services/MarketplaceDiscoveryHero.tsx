import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Car, Compass, Flower2, Headphones, Plane, ShieldCheck, Ship, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';

/** Shared discovery surface for services and experiences. No fabricated offers, prices or availability. */
export function MarketplaceDiscoveryHero({ kind }: { kind: 'services' | 'experiences' }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const isExperience = kind === 'experiences';
  const journeys = isExperience ? [
    { to: APP_ROUTES.EXPERIENCES + '?type=tour', icon: Compass, ru: 'Экскурсии', en: 'Tours & discoveries', th: 'ทัวร์และการสำรวจ', subRu: 'Острова, природа и культура', subEn: 'Islands, nature and culture', subTh: 'เกาะ ธรรมชาติ และวัฒนธรรม' },
    { to: APP_ROUTES.EXPERIENCES + '?type=activity', icon: Waves, ru: 'Активный отдых', en: 'Activities & adventures', th: 'กิจกรรมและการผจญภัย', subRu: 'Выберите подходящее занятие', subEn: 'Find an activity for your plans', subTh: 'ค้นหากิจกรรมที่เหมาะกับแผนของคุณ' },
    { to: APP_ROUTES.YACHTS, icon: Ship, ru: 'Яхты и морские прогулки', en: 'Yachts & sea trips', th: 'เรือยอชต์และทริปทะเล', subRu: 'Откройте отдельный каталог яхт', subEn: 'Explore the dedicated yacht catalogue', subTh: 'ดูรายการเรือยอชต์โดยเฉพาะ' },
  ] : [
    { to: APP_ROUTES.AIRPORT_TRANSFER, icon: Car, ru: 'Трансфер из аэропорта и в аэропорт', en: 'Airport transfer', th: 'รถรับส่งสนามบิน', subRu: 'Укажите маршрут и выберите автомобиль', subEn: 'Choose your route and vehicle', subTh: 'เลือกเส้นทางและรถยนต์' },
    { to: APP_ROUTES.FAST_TRACK, icon: Plane, ru: 'Fast Track в аэропорту', en: 'Airport Fast Track', th: 'บริการช่องทางด่วนสนามบิน', subRu: 'Выберите прилёт или вылет и пакет услуг', subEn: 'Select arrival or departure and a service package', subTh: 'เลือกขาเข้าหรือขาออกและแพ็กเกจบริการ' },
    { to: APP_ROUTES.FLOWERS, icon: Flower2, ru: 'Доставка цветов', en: 'Flower delivery', th: 'บริการส่งดอกไม้', subRu: 'Откройте каталог букетов', subEn: 'Browse the bouquet catalogue', subTh: 'ดูแคตตาล็อกช่อดอกไม้' },
  ];
  return <section className="space-y-4" aria-label={t('Подборка myUNO', 'myUNO discovery', 'ค้นหาบริการ myUNO')}>
    <div className="border border-border bg-card p-[var(--card-padding)] sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{t('myUNO · Пхукет', 'myUNO · Phuket', 'myUNO · ภูเก็ต')}</p>
      <h2 className="mt-3 font-display text-2xl font-medium leading-tight text-foreground sm:text-3xl">{isExperience
        ? t('Впечатления, которые запоминаются', 'Experiences worth remembering', 'ประสบการณ์ที่น่าจดจำ')
        : t('Услуги для ваших задач', 'Services for your plans', 'บริการตามความต้องการของคุณ')}</h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{isExperience
        ? t('Выберите экскурсию, активность или морскую прогулку, затем изучите предложения и условия.', 'Explore offers and request an experience. Availability is confirmed before booking.', 'สำรวจข้อเสนอและส่งคำขอ โดยต้องยืนยันความพร้อมก่อนจอง')
        : t('Выберите категорию: дом, поездки, юридические вопросы и повседневные дела.', 'Choose a category for home, travel, legal questions or everyday tasks.', 'ค้นหาและขอรับบริการที่ต้องการได้ในที่เดียว')}</p>
      {isExperience && <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />{t('Заявки под контролем myUNO', 'Requests managed by myUNO', 'myUNO ดูแลคำขอ')}</span>
        <span className="inline-flex items-center gap-2"><CalendarCheck className="size-4 text-primary" />{t('Подтверждение после проверки', 'Booking confirmed after review', 'ยืนยันหลังตรวจสอบ')}</span>
        <span className="inline-flex items-center gap-2"><Headphones className="size-4 text-primary" />{t('Поддержка на Пхукете', 'Support in Phuket', 'บริการช่วยเหลือในภูเก็ต')}</span>
      </div>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {journeys.map(item => <Link key={item.to} to={item.to} className="group flex min-h-32 flex-col justify-between border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <item.icon className="mb-3 size-6 text-primary" aria-hidden="true" /><span className="font-display text-lg font-medium text-foreground">{t(item.ru, item.en, item.th)}</span>
        <span className="mt-3 flex items-end justify-between gap-2 text-sm text-muted-foreground"><span>{t(item.subRu, item.subEn, item.subTh)}</span><ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
      </Link>)}
    </div>
  </section>;
}
