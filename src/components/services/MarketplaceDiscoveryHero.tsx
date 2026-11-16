import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Headphones, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';

/** Shared discovery surface for services and experiences. No fabricated offers, prices or availability. */
export function MarketplaceDiscoveryHero({ kind }: { kind: 'services' | 'experiences' }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const isExperience = kind === 'experiences';
  const journeys = isExperience
    ? [
        { to: APP_ROUTES.YACHTS, ru: 'Яхты и морские прогулки', en: 'Yachts & sea escapes', th: 'เรือยอชต์และทริปทะเล', subRu: 'Откройте острова с воды', subEn: 'Explore the islands from the sea', subTh: 'สำรวจเกาะทางทะเล' },
        { to: APP_ROUTES.EXPERIENCES + '?type=tour', ru: 'Экскурсии', en: 'Tours & discoveries', th: 'ทัวร์และการสำรวจ', subRu: 'Новые впечатления на Пхукете', subEn: 'Discover more of Phuket', subTh: 'ค้นพบภูเก็ต' },
        { to: APP_ROUTES.SERVICES, ru: 'Услуги для поездки', en: 'Travel services', th: 'บริการท่องเที่ยว', subRu: 'Организуйте всё необходимое', subEn: 'Make your trip effortless', subTh: 'จัดการทุกอย่างได้ง่าย' },
      ]
    : [
        { to: APP_ROUTES.FAST_TRACK, ru: 'Встреча в аэропорту', en: 'Airport Fast Track', th: 'บริการฟาสต์แทร็กสนามบิน', subRu: 'Спокойное прибытие и вылет', subEn: 'A smoother arrival and departure', subTh: 'เดินทางเข้าออกอย่างสะดวก' },
        { to: APP_ROUTES.AIRPORT_TRANSFER, ru: 'Трансфер', en: 'Airport transfers', th: 'รถรับส่งสนามบิน', subRu: 'До отеля, виллы или аэропорта', subEn: 'To your hotel, villa or airport', subTh: 'ไปโรงแรม วิลล่า หรือสนามบิน' },
        { to: APP_ROUTES.FLOWERS, ru: 'Цветы и подарки', en: 'Flowers & gifts', th: 'ดอกไม้และของขวัญ', subRu: 'Для особенного момента', subEn: 'For a special moment', subTh: 'สำหรับโอกาสพิเศษ' },
        { to: APP_ROUTES.EXPERIENCES, ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์', subRu: 'Яхты, экскурсии и отдых', subEn: 'Yachts, tours and adventures', subTh: 'เรือยอชต์ ทัวร์ และกิจกรรม' },
      ];
  return <section className="space-y-4" aria-label={t('Подборка myUNO', 'myUNO discovery', 'ค้นหาบริการ myUNO')}>
    <div className="border border-border bg-card p-[var(--card-padding)] sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{t('myUNO · Пхукет', 'myUNO · Phuket', 'myUNO · ภูเก็ต')}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{isExperience
        ? t('Впечатления, которые запоминаются', 'Experiences worth remembering', 'ประสบการณ์ที่น่าจดจำ')
        : t('Пхукет становится проще', 'Phuket, made effortless', 'ภูเก็ตง่ายขึ้น')}</h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{isExperience
        ? t('Выбирайте, исследуйте предложения и отправляйте заявку. Мы покажем следующий шаг без ложных обещаний доступности.', 'Explore offers and request an experience. Availability is confirmed before booking.', 'สำรวจข้อเสนอและส่งคำขอ โดยต้องยืนยันความพร้อมก่อนจอง')
        : t('Проверяйте услуги, выбирайте удобный вариант и отправляйте заявку в одном месте.', 'Discover useful services and request what you need, all in one place.', 'ค้นหาและขอรับบริการที่ต้องการได้ในที่เดียว')}</p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />{t('Заявки под контролем myUNO', 'Requests managed by myUNO', 'myUNO ดูแลคำขอ')}</span>
        <span className="inline-flex items-center gap-2"><CalendarCheck className="size-4 text-primary" />{t('Подтверждение после проверки', 'Booking confirmed after review', 'ยืนยันหลังตรวจสอบ')}</span>
        <span className="inline-flex items-center gap-2"><Headphones className="size-4 text-primary" />{t('Поддержка на Пхукете', 'Support in Phuket', 'บริการช่วยเหลือในภูเก็ต')}</span>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {journeys.map(item => <Link key={item.to} to={item.to} className="group flex min-h-36 flex-col justify-between border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="font-display text-lg font-semibold text-foreground">{t(item.ru, item.en, item.th)}</span>
        <span className="mt-3 flex items-end justify-between gap-2 text-sm text-muted-foreground"><span>{t(item.subRu, item.subEn, item.subTh)}</span><ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
      </Link>)}
    </div>
  </section>;
}
