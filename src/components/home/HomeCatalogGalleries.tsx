import '@/styles/marketplace-unity.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ImageOff, MapPin, Flower2, PlaneLanding, CarFront, House, Sailboat } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { useExperiences } from '@/hooks/useExperiences';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { homeAreaCover } from './homeAreaCovers';
import { HomeGallery } from './HomeGallery';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { homeServiceCategories } from './homeServiceCategories';
import { HomeDiscoveryPaths } from './HomeDiscoveryPaths';

export function CatalogState({
  loading,
  error,
  empty,
  retry,
  label,
}: {
  loading: boolean;
  error: boolean;
  empty: LangValues;
  retry: () => unknown;
  label?: string;
}) {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  return (
    <div className="home-catalog-state" role={error ? 'alert' : 'status'}>
      {label && <p className="home-catalog-state-label">{label}</p>}
      <p>
        {loading
          ? t({
              ru: 'Загружаем каталог…',
              en: 'Loading the catalog…',
              th: 'กำลังโหลดรายการ…',
            })
          : error
            ? t({
                ru: 'Не удалось загрузить каталог. Попробуйте ещё раз.',
                en: 'Could not load the catalog. Please try again.',
                th: 'โหลดรายการไม่สำเร็จ โปรดลองอีกครั้ง',
              })
            : t(empty)}
      </p>
      {error && (
        <button type="button" onClick={retry}>
          {t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}
        </button>
      )}
    </div>
  );
}

function CatalogPhoto({ image, alt, onUnavailable }: { image?: string | null; alt: string; onUnavailable?: (image: string) => void }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const safe = complexMediaUrl(image);
  return (
    <div className="home-catalog-photo">
      {safe && failedImage !== safe ? (
        <img
          onError={() => { setFailedImage(safe); onUnavailable?.(safe); }}
          src={safe}
          alt={alt}
          loading="lazy"
          decoding="async"
          width="600"
          height="400"
        />
      ) : (
        <ImageOff size={28} aria-hidden="true" />
      )}
    </div>
  );
}

// Guide routes are verified navigation, not supply or photographic evidence.
// Project photos cannot establish what an entire neighborhood looks like.
const AREA_GUIDES = [
  { slug: 'laguna', name: { ru: 'Лагуна', en: 'Laguna', th: 'ลากูน่า' } },
  { slug: 'kamala', name: { ru: 'Камала', en: 'Kamala', th: 'กมลา' } },
  { slug: 'surin', name: { ru: 'Сурин', en: 'Surin', th: 'สุรินทร์' } },
  { slug: 'bang-tao', name: { ru: 'Банг Тао', en: 'Bang Tao', th: 'บางเทา' } },
];

export function HomeLocationGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  return <HomeGallery id="home-locations-title" className="home-locations" title={t({ ru: 'Районы Пхукета', en: 'Phuket areas', th: 'ย่านในภูเก็ต' })}
    description={t({ ru: 'Сначала познакомьтесь с районом, затем выбирайте жильё.', en: 'Get to know an area before choosing a home.', th: 'ทำความรู้จักย่านก่อนเลือกที่พัก' })}
    href={R.AREA_INDEX} linkLabel={t({ ru: 'Все районы', en: 'All areas', th: 'ทุกย่าน' })}>
    {AREA_GUIDES.map(area => { const cover = homeAreaCover(area.slug); return <article className="home-guide-card" key={area.slug}><Link className="home-area-guide-link" to={R.AREA_DETAIL(area.slug)}>
      <div className="home-area-cover"><img src={cover.src} alt={t(area.name)} width="640" height="360" loading="lazy" decoding="async" />{cover.kind === 'illustration' && <span className="home-area-cover-label">{t({ ru: 'Иллюстрация', en: 'Illustration', th: 'ภาพประกอบ' })}</span>}</div>
      <div className="home-guide-copy"><MapPin className="home-guide-pin" size={22} aria-hidden="true" /><h3>{t(area.name)}</h3><p>{t({ ru: 'Знакомство с районом', en: 'Explore the area guide', th: 'ทำความรู้จักย่าน' })}</p>
      <span>{t({ ru: 'О районе', en: 'Area guide', th: 'คู่มือย่าน' })}<ArrowRight size={16} aria-hidden="true" /></span></div>
    </Link></article>; })}
  </HomeGallery>;
}

export function HomeExperienceGallery() {
  const { language } = useLanguage();
  const [failedMedia, setFailedMedia] = useState<Set<string>>(() => new Set());
  const t = (value: LangValues) => pickLang(language, value);
  const { experiences, isLoading, error, refetch } = useExperiences({
    // Sample beyond the first rail; keep the publication boundary unchanged.
    limit: 24,
    publishedOnly: true,
  });
  // Curated preview needs stored usable media; no invented image substitutes.
  const preview = experiences.flatMap(item => {
    const image = [item.cover_image, ...(item.images ?? [])].map(complexMediaUrl).find(image => image && !failedMedia.has(image));
    return image ? [{ item, image }] : [];
  }).slice(0, 12);
  const title = t({
    ru: 'За пределами дома',
    en: 'More of the island',
    th: 'สัมผัสประสบการณ์บนเกาะ',
  });
  const state = isLoading || error || !preview.length ? (
    <>
      <CatalogState loading={isLoading} error={Boolean(error)} retry={refetch}
        empty={{ ru: 'Нет фотографий для этой подборки. Выберите формат отдыха в каталоге.', en: 'No photo preview to show. Choose an activity in the catalogue.', th: 'ยังไม่มีภาพตัวอย่าง เลือกกิจกรรมในรายการ' }} />
    </>
  ) : undefined;
  return <><HomeGallery id="home-experiences-title" className="home-catalog home-experiences" title={title}
    description={t({ ru: 'Идеи для прогулок и отдыха на острове.', en: 'Explore activities around the island.', th: 'กิจกรรมและไอเดียสำหรับพักผ่อนบนเกาะ' })}
    href={R.EXPERIENCES} linkLabel={t({ ru: 'Все впечатления', en: 'All experiences', th: 'ประสบการณ์ทั้งหมด' })} state={state}>
    {preview.map(({ item, image }) => (
      <article className="home-catalog-card" key={item.id}>
        <Link to={R.EXPERIENCE_DETAIL(item.id)}>
          <CatalogPhoto image={image}
            alt={(language === 'ru' ? item.title_ru : item.title_en) || item.title_en || item.title_ru}
            onUnavailable={failed => setFailedMedia(previous => new Set(previous).add(failed))} />
          <div className="home-catalog-copy">
            <Compass size={18} aria-hidden="true" />
            <h3>{(language === 'ru' ? item.title_ru : item.title_en) || item.title_en || item.title_ru}</h3>
            {item.location_name && <p>{item.location_name}</p>}
            <span>{t({ ru: 'Посмотреть программу', en: 'Explore the experience', th: 'ดูรายละเอียด' })}<ArrowRight size={16} aria-hidden="true" /></span>
          </div>
        </Link>
      </article>
    ))}
  </HomeGallery><nav className="home-container home-category-navigation" aria-label={title}><HomeDiscoveryPaths kind="experiences" /></nav></>;
}

function ServiceCategoryArt({ image, alt, categoryId, categoryPath }: { image: string; alt: string; categoryId: string; categoryPath: string }) {
  const Icon = categoryId === 'flowers' ? Flower2 : categoryId === 'arrival' ? PlaneLanding : categoryId === 'vehicle' ? CarFront : categoryId === 'home' ? House : categoryPath === R.YACHTS ? Sailboat : Compass;
  const photo = categoryId === 'flowers' || categoryPath === R.YACHTS;
  const [failed, setFailed] = useState(false);
  return <div className="home-service-category-art">
    {photo && image && !failed ? <img src={image} alt={alt} width="320" height="200" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="home-service-lucide-symbol"><Icon size={34} strokeWidth={1.7} aria-hidden="true" /></span>}
  </div>;
}

export function HomeServiceGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const catalog = useCatalogFromDB();
  // The shared catalog's static fallback is useful for app navigation, but is
  // not evidence of a live category. Keep loading/error/empty explicit here.
  const categories = catalog.isFromDB ? homeServiceCategories(catalog.categories) : [];
  const title = t({ ru: 'Услуги для жизни и отдыха', en: 'Services for life and leisure', th: 'บริการสำหรับชีวิตและการพักผ่อน' });
  // Static taxonomy fallback is never promoted to published supply.

  return <><HomeGallery id="home-services-title" className="home-services marketplace-home-categories" title={title}
    description={t({ ru: 'Выберите задачу — подробности и условия внутри.', en: 'Choose what you need, then check details and terms.', th: 'เลือกสิ่งที่ต้องการ แล้วดูรายละเอียดและเงื่อนไข' })}
    href={R.GOAL_SERVICES} linkLabel={t({ ru: 'Все услуги', en: 'All services', th: 'บริการทั้งหมด' })}
    state={!catalog.isLoading && !catalog.error && !categories.length ? <p className="home-catalog-state">{t({ ru: 'Подборка появится после публикации категорий. Полный каталог доступен по ссылке.', en: 'The preview will appear when categories are published. Explore the full catalogue using the link.', th: 'ตัวอย่างจะแสดงเมื่อเผยแพร่หมวดหมู่ ดูรายการทั้งหมดได้จากลิงก์' })}</p> : catalog.isLoading || catalog.error ? <CatalogState loading={catalog.isLoading} error={Boolean(catalog.error)} retry={catalog.refetch}
      empty={{ ru: 'Нет категорий для просмотра', en: 'No categories to explore', th: 'ยังไม่มีหมวดหมู่' }} /> : undefined}>
      {categories.map(category => <article className={`home-service-category-card${category.path === R.FLOWERS || category.path === R.YACHTS ? ' home-service-category-card--photo' : ''}`} key={category.id}>
        <Link to={category.path}>
          <ServiceCategoryArt categoryId={category.id} categoryPath={category.path} image={category.image} alt={pickLang(language, { ru: category.labelRu, en: category.labelEn, th: category.labelTh })} />
          <div className="home-service-category-copy">{(category.path === R.FLOWERS || category.path === R.YACHTS) && <p className="home-category-photo-note">{t({ ru: 'Иллюстративное фото. Условия в каталоге.', en: 'Illustrative photo. Offers in the catalogue.', th: 'ภาพประกอบ ดูข้อเสนอในหมวดหมู่' })}</p>}<h3>{pickLang(language, { ru: category.labelRu, en: category.labelEn, th: category.labelTh })}</h3><p>{t(category.benefit)}</p>
            <span>{t({ ru: 'Открыть раздел', en: 'Explore category', th: 'ดูหมวดหมู่' })}<ArrowRight size={16} aria-hidden="true" /></span>
          </div>
        </Link>
        {category.secondary && <Link className="home-service-secondary" to={category.secondary.path}>{pickLang(language, category.secondary.label)}<ArrowRight size={16} aria-hidden="true" /></Link>}
      </article>)}
  </HomeGallery>
    <nav className="home-container home-category-navigation" aria-label={title}><HomeDiscoveryPaths kind="services" /></nav>
  </>;
}
