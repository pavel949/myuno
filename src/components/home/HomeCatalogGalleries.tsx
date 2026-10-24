import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ImageOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { useExperiences } from '@/hooks/useExperiences';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { HorizontalRail } from './HorizontalRail';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { homeServiceCategories } from './homeServiceCategories';

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

function CatalogPhoto({ image, onUnavailable }: { image?: string | null; onUnavailable?: (image: string) => void }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const safe = complexMediaUrl(image);
  return (
    <div className="home-catalog-photo">
      {safe && failedImage !== safe ? (
        <img
          onError={() => { setFailedImage(safe); onUnavailable?.(safe); }}
          src={safe}
          alt=""
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
  { slug: 'kamala', name: { ru: 'Камала', en: 'Kamala', th: 'กมลา' } },
  { slug: 'surin', name: { ru: 'Сурин', en: 'Surin', th: 'สุรินทร์' } },
  { slug: 'bang-tao', name: { ru: 'Банг Тао', en: 'Bang Tao', th: 'บางเทา' } },
];

export function HomeLocationGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  return <section className="home-locations home-container" aria-labelledby="home-locations-title">
    <div className="home-section-heading"><div>
      <h2 id="home-locations-title">{t({ ru: 'Где остановиться на Пхукете?', en: 'Where to stay in Phuket?', th: 'พักที่ไหนดีในภูเก็ต' })}</h2>
      <p className="home-section-lead">{t({ ru: 'Не знаете район? Познакомьтесь с островом до выбора жилья.', en: 'Not sure about the area? Get to know the island before choosing a home.', th: 'ยังไม่แน่ใจเรื่องย่าน ทำความรู้จักเกาะก่อนเลือกที่พัก' })}</p>
    </div><Link className="home-text-link" to={R.AREA_INDEX}>{t({ ru: 'Все районы', en: 'All areas', th: 'ทุกย่าน' })}<ArrowRight size={18} aria-hidden="true" /></Link></div>
    <div className="home-area-guide-links">
      {AREA_GUIDES.map(area => <Link className="home-area-guide-link" key={area.slug} to={R.AREA_DETAIL(area.slug)}>
        <span>{t(area.name)}</span>
        <span>{t({ ru: 'Гид по району', en: 'Area guide', th: 'คู่มือย่าน' })}<ArrowRight size={16} aria-hidden="true" /></span>
      </Link>)}
    </div>
  </section>;
}

export function HomeExperienceGallery() {
  const { language } = useLanguage();
  const [failedMedia, setFailedMedia] = useState<Set<string>>(() => new Set());
  const t = (value: LangValues) => pickLang(language, value);
  const { experiences, isLoading, error, refetch } = useExperiences({
    limit: 8,
    publishedOnly: true,
  });
  // Curated preview needs stored usable media; no invented image substitutes.
  const preview = experiences.flatMap(item => {
    const image = [item.cover_image, ...(item.images ?? [])].map(complexMediaUrl).find(image => image && !failedMedia.has(image));
    return image ? [{ item, image }] : [];
  }).slice(0, 4);
  const title = t({
    ru: 'За пределами дома',
    en: 'More of the island',
    th: 'สัมผัสประสบการณ์บนเกาะ',
  });
  // Successful empty supply is omitted; a failed read remains retryable.
  if (!isLoading && !error && !preview.length) return null;
  return (
    <section
      className="home-catalog home-experiences home-container"
      aria-labelledby="home-experiences-title"
    >
      <div className="home-section-heading">
        <div>
          <h2 id="home-experiences-title">{title}</h2>
          <p className="home-section-lead">
            {t({
              ru: 'Идеи для прогулок и отдыха на острове.',
              en: 'Explore activities around the island.',
              th: 'กิจกรรมและไอเดียสำหรับพักผ่อนบนเกาะ',
            })}
          </p>
        </div>
        <Link className="home-text-link" to={R.EXPERIENCES}>
          {t({
            ru: 'Все впечатления',
            en: 'All experiences',
            th: 'ประสบการณ์ทั้งหมด',
          })}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {isLoading || error || !experiences.length ? (
        <CatalogState
          loading={isLoading}
          error={Boolean(error)}
          retry={refetch}
          empty={{
            ru: 'Опубликованных впечатлений пока нет. Загляните позже.',
            en: 'No published experiences yet. Check back later.',
            th: 'ยังไม่มีประสบการณ์ที่เผยแพร่ โปรดกลับมาดูอีกครั้ง',
          }}
        />
      ) : (
        <HorizontalRail label={title}>
          {preview.map(({ item, image }) => (
            <article className="home-catalog-card" key={item.id}>
              <Link to={R.EXPERIENCE_DETAIL(item.id)}>
                <CatalogPhoto image={image} onUnavailable={failed => setFailedMedia(previous => new Set(previous).add(failed))} />
                <div className="home-catalog-copy">
                  <Compass size={18} aria-hidden="true" />
                  <h3>
                    {(language === 'ru' ? item.title_ru : item.title_en) ||
                      item.title_en ||
                      item.title_ru}
                  </h3>
                  {item.location_name && <p>{item.location_name}</p>}
                  <span>
                    {t({
                      ru: 'Посмотреть программу',
                      en: 'Explore the experience',
                      th: 'ดูรายละเอียด',
                    })}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </HorizontalRail>
      )}
    </section>
  );
}

function ServiceCategoryArt({ image }: { image: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="home-service-category-art" aria-hidden="true">
    {failed ? <ImageOff size={36} /> : <img src={image} alt="" width="320" height="200" loading="lazy" decoding="async" onError={() => setFailed(true)} />}
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
  if (!catalog.isLoading && !catalog.error && !categories.length) return null;
  return <section className="home-catalog home-services home-container" aria-labelledby="home-services-title">
    <div className="home-section-heading"><div>
      <h2 id="home-services-title">{title}</h2>
      <p className="home-section-lead">{t({ ru: 'Начните с категории — варианты и условия найдёте внутри.', en: 'Start with a category, then explore options and details.', th: 'เริ่มจากหมวดหมู่ แล้วดูตัวเลือกและรายละเอียด' })}</p>
    </div></div>
    {catalog.isLoading || catalog.error || !categories.length ? <CatalogState
      loading={catalog.isLoading} error={Boolean(catalog.error)} retry={catalog.refetch}
      empty={{ ru: 'Пока нет категорий услуг для просмотра. Загляните позже.', en: 'No service categories to explore yet. Check back later.', th: 'ยังไม่มีหมวดหมู่บริการให้เลือก โปรดกลับมาดูอีกครั้ง' }}
    /> : <div className="home-service-category-grid">
      {categories.map(category => <article className="home-service-category-card" key={category.id}>
        <Link to={category.path}>
          <ServiceCategoryArt image={category.image} />
          <div className="home-service-category-copy"><h3>{pickLang(language, { ru: category.labelRu, en: category.labelEn, th: category.labelTh })}</h3>
            <p>{t(category.benefit)}</p>
            <span>{t({ ru: 'Открыть категорию', en: 'Explore category', th: 'ดูหมวดหมู่' })}<ArrowRight size={16} aria-hidden="true" /></span>
          </div>
        </Link>
      </article>)}
    </div>}
  </section>;
}
