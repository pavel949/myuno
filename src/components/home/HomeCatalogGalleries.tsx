import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ImageOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { usePublicPropertyProjects } from '@/hooks/usePropertyProjects';
import { useExperiences } from '@/hooks/useExperiences';
import { getDistrictLabel } from '@/lib/taxonomies';
import { LIVE_AREA_SLUGS } from '@/content/landings/areaLandings';
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

function CatalogPhoto({ image }: { image?: string | null }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const safe = complexMediaUrl(image);
  return (
    <div className="home-catalog-photo">
      {safe && failedImage !== safe ? (
        <img
          onError={() => setFailedImage(safe)}
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

/** Stock catalog illustrations must not be presented as neighborhood photography. */
function areaProjectPhoto(project?: { cover_image?: string | null; images?: string[] | null }) {
  return [project?.cover_image, ...(project?.images ?? [])].find(value => {
    const safe = complexMediaUrl(value);
    if (!safe) return false;
    const host = new URL(safe).hostname;
    return !/(^|\.)(unsplash\.com|pexels\.com|pixabay\.com)$/.test(host);
  });
}

export function HomeLocationGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const projects = usePublicPropertyProjects(24);
  // Editorial guide order is independent of the alphabetical project catalogue.
  // One targeted public read supplies Surin media without downloading every project.
  const surin = usePublicPropertyProjects(1, 'Surin');
  const seen = new Set<string>();
  const catalogAreas = [...(projects.data ?? []), ...(surin.data ?? [])].flatMap(project => {
    const district = project.district;
    if (!district) return [];
    const normalized = district.toLowerCase().trim().replace(/[ _-]+/g, '');
    const slug = LIVE_AREA_SLUGS.find(value => value.replace(/-/g, '') === normalized);
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    return [{ slug, district, project }];
  });
  const featured = ['kamala', 'surin', 'bang-tao'];
  const areas = [
    ...featured.map(slug => catalogAreas.find(area => area.slug === slug) ?? { slug, district: slug === 'bang-tao' ? 'Bang Tao' : slug, project: undefined }),
    ...catalogAreas.filter(area => !featured.includes(area.slug)),
  ];
  const retry = () => { void projects.refetch(); void surin.refetch(); };
  const title = t({ ru: 'Познакомьтесь с районами Пхукета', en: 'Get to know Phuket’s areas', th: 'ทำความรู้จักย่านต่าง ๆ ในภูเก็ต' });
  return <section className="home-locations home-container" aria-labelledby="home-locations-title">
    <div className="home-section-heading"><div><h2 id="home-locations-title">{title}</h2><p className="home-section-lead">{t({ ru: 'Ещё не знаете, где остановиться? Начните со знакомства с островом.', en: 'Not sure where to stay? Start by getting to know the island.', th: 'ยังไม่แน่ใจว่าจะพักที่ไหน เริ่มจากทำความรู้จักเกาะ' })}</p></div><Link className="home-text-link" to={R.AREA_INDEX}>{t({ ru: 'Все районы', en: 'All areas', th: 'ทุกย่าน' })}<ArrowRight size={18} aria-hidden="true" /></Link></div>
    {(projects.isLoading || surin.isLoading || projects.isError || surin.isError) && <CatalogState loading={projects.isLoading || surin.isLoading} error={projects.isError || surin.isError} retry={retry} empty={{ ru: 'Фото районов пока нет.', en: 'Area photographs are not available yet.', th: 'ยังไม่มีภาพย่าน' }} />}
    <HorizontalRail label={title}>
      {areas.map(({ slug, district, project }) => <Link className="home-location-card home-location-card--editorial" key={slug} to={R.AREA_DETAIL(slug)}>
        <CatalogPhoto image={areaProjectPhoto(project)} />
        <div className="home-location-copy"><h3>{getDistrictLabel(district, language === 'ru' ? 'ru' : 'en')}</h3><p>{project ? <>{t(areaProjectPhoto(project) ? { ru: 'Фото из карточки комплекса', en: 'Image from the community catalog', th: 'ภาพจากรายการโครงการ' } : { ru: 'В каталоге района', en: 'In this area’s catalog', th: 'ในรายการของย่านนี้' })}: {language === 'ru' ? project.name_ru || project.name_en : project.name_en || project.name_ru}</> : t({ ru: 'Фото района пока нет', en: 'Area photograph not available yet', th: 'ยังไม่มีภาพย่าน' })}</p><span>{t({ ru: 'Познакомиться с районом', en: 'Explore the area guide', th: 'อ่านคู่มือย่าน' })}<ArrowRight size={16} aria-hidden="true" /></span></div>
      </Link>)}
    </HorizontalRail>
  </section>;
}

export function HomeExperienceGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const { experiences, isLoading, error, refetch } = useExperiences({
    limit: 8,
    publishedOnly: true,
  });
  const title = t({
    ru: 'За пределами дома',
    en: 'More of the island',
    th: 'สัมผัสประสบการณ์บนเกาะ',
  });
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
              ru: 'Туры и занятия из опубликованного каталога.',
              en: 'Tours and activities from the published catalog.',
              th: 'ทัวร์และกิจกรรมจากรายการที่เผยแพร่',
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
          {experiences.map((item) => (
            <article className="home-catalog-card" key={item.id}>
              <Link to={R.EXPERIENCE_DETAIL(item.id)}>
                <CatalogPhoto image={item.cover_image || item.images?.[0]} />
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
  return <section className="home-catalog home-services home-container" aria-labelledby="home-services-title">
    <div className="home-section-heading"><div>
      <h2 id="home-services-title">{title}</h2>
      <p className="home-section-lead">{t({ ru: 'Начните с категории — варианты и условия найдёте внутри.', en: 'Start with a category, then explore options and details.', th: 'เริ่มจากหมวดหมู่ แล้วดูตัวเลือกและรายละเอียด' })}</p>
    </div></div>
    {catalog.isLoading || catalog.error || !categories.length ? <CatalogState
      loading={catalog.isLoading} error={Boolean(catalog.error)} retry={catalog.refetch}
      empty={{ ru: 'Пока нет категорий услуг для просмотра. Загляните позже.', en: 'No service categories to explore yet. Check back later.', th: 'ยังไม่มีหมวดหมู่บริการให้เลือก โปรดกลับมาดูอีกครั้ง' }}
    /> : <HorizontalRail label={t({ ru: 'Категории услуг', en: 'Service categories', th: 'หมวดหมู่บริการ' })} compact>
      {categories.map(category => <article className="home-service-category-card" key={category.id}>
        <Link to={category.path}>
          <ServiceCategoryArt image={category.image} />
          <div className="home-service-category-copy"><h3>{pickLang(language, { ru: category.labelRu, en: category.labelEn, th: category.labelTh })}</h3>
            <span>{t({ ru: 'Открыть категорию', en: 'Explore category', th: 'ดูหมวดหมู่' })}<ArrowRight size={16} aria-hidden="true" /></span>
          </div>
        </Link>
      </article>)}
    </HorizontalRail>}
  </section>;
}
