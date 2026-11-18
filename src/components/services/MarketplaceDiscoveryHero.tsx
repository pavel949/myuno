import { Link } from 'react-router-dom';
import { ArrowRight, Car, Compass, Flower2, Plane, Ship, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import transferImage from '@/assets/solutions/transfer.webp';
import flowersImage from '@/assets/solutions/flowers.webp';
import airportImage from '@/assets/home-service-categories/arrival.svg';
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
  const images = [transferImage, airportImage, flowersImage];
  return <section className="space-y-3" aria-label={t('Подборка myUNO', 'myUNO discovery', 'ค้นหาบริการ myUNO')}>
    <div className="max-w-[var(--layout-width-article)]">
      <h2 className="font-display text-xl font-medium leading-tight text-foreground sm:text-2xl">{isExperience
        ? t('Ваш день на Пхукете', 'Your day in Phuket', 'วันของคุณในภูเก็ต')
        : t('Для поездки, дома и особых моментов', 'For your trip, home and special moments', 'สำหรับการเดินทาง บ้าน และช่วงเวลาพิเศษ')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isExperience
        ? t('Выберите впечатление. Дату, наличие мест и условия уточнит myUNO.', 'Choose an experience. myUNO will confirm dates, availability and terms.', 'เลือกประสบการณ์ myUNO จะยืนยันวัน ความพร้อม และเงื่อนไข')
        : t('Выберите услугу и отправьте заявку myUNO. Условия подтверждаются до заказа.', 'Choose a service and send a request to myUNO. Terms are confirmed before ordering.', 'เลือกบริการและส่งคำขอถึง myUNO โดยยืนยันเงื่อนไขก่อนสั่งบริการ')}</p>
    </div>
    <nav aria-label={t('Направления', 'Explore categories', 'สำรวจหมวดหมู่')}
      className={isExperience ? 'flex flex-wrap gap-2' : 'flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible'}>
      {journeys.map((item, index) => <Link key={item.to} to={item.to}
        onFocus={event => {
          if (!isExperience) event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        }}
        className={isExperience
          ? 'group inline-flex min-h-11 items-center gap-2 border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'group flex w-[78%] shrink-0 flex-col overflow-hidden border border-border bg-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto'}>
        {!isExperience && <img src={images[index]} alt="" className="aspect-[16/7] w-full object-cover" />}
        <span className={isExperience ? 'contents' : 'flex min-h-20 items-center gap-3 p-3'}>
          <item.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-foreground">{t(item.ru, item.en, item.th)}</span>
          <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
        </span>
      </Link>)}
    </nav>
  </section>;
}
