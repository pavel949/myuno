import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ImageOff, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { usePublicPropertyProjects } from '@/hooks/usePropertyProjects';
import { useExperiences } from '@/hooks/useExperiences';
import { useBouquets } from '@/hooks/useBouquets';
import { useMarketplaceServices } from '@/hooks/useServiceMarketplace';
import { getDistrictLabel } from '@/lib/taxonomies';
import { LIVE_AREA_SLUGS } from '@/content/landings/areaLandings';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { HorizontalRail } from './HorizontalRail';

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

export function HomeLocationGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const projects = usePublicPropertyProjects(24);
  const seen = new Set<string>();
  const areas = (projects.data ?? []).flatMap(project => {
    const district = project.district;
    if (!district) return [];
    const normalized = district.toLowerCase().trim().replace(/[ _-]+/g, '');
    const slug = LIVE_AREA_SLUGS.find(value => value.replace(/-/g, '') === normalized);
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    return [{ slug, district, project }];
  });
  const title = t({ ru: 'Познакомьтесь с районами Пхукета', en: 'Get to know Phuket’s areas', th: 'ทำความรู้จักย่านต่าง ๆ ในภูเก็ต' });
  return <section className="home-locations home-container" aria-labelledby="home-locations-title">
    <div className="home-section-heading"><div><h2 id="home-locations-title">{title}</h2><p className="home-section-lead">{t({ ru: 'Ещё не знаете, где остановиться? Начните со знакомства с островом.', en: 'Not sure where to stay? Start by getting to know the island.', th: 'ยังไม่แน่ใจว่าจะพักที่ไหน เริ่มจากทำความรู้จักเกาะ' })}</p></div><Link className="home-text-link" to="/area">{t({ ru: 'Все районы', en: 'All areas', th: 'ทุกย่าน' })}<ArrowRight size={18} aria-hidden="true" /></Link></div>
    {projects.isLoading || projects.isError || !areas.length ? <CatalogState loading={projects.isLoading} error={projects.isError} retry={projects.refetch} empty={{ ru: 'В каталоге пока нет опубликованных районов.', en: 'No areas in the published catalog yet.', th: 'ยังไม่มีย่านในรายการที่เผยแพร่' }} /> : <HorizontalRail label={title}>
      {areas.map(({ slug, district, project }) => <Link className="home-location-card home-location-card--editorial" key={slug} to={`/area/${slug}`}>
        <CatalogPhoto image={project.cover_image || project.images?.[0]} />
        <div className="home-location-copy"><h3>{getDistrictLabel(district, language === 'ru' ? 'ru' : 'en')}</h3><p>{t(project.cover_image || project.images?.[0] ? { ru: 'На фото — комплекс', en: 'Pictured community', th: 'โครงการในภาพ' } : { ru: 'В каталоге района', en: 'In this area’s catalog', th: 'ในรายการของย่านนี้' })}: {language === 'ru' ? project.name_ru || project.name_en : project.name_en || project.name_ru}</p><span>{t({ ru: 'Познакомиться с районом', en: 'Explore the area guide', th: 'อ่านคู่มือย่าน' })}<ArrowRight size={16} aria-hidden="true" /></span></div>
      </Link>)}
    </HorizontalRail>}
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

export function HomeServiceGallery() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const services = useMarketplaceServices();
  const flowers = useBouquets();
  const offerings = services.data ?? [];
  const bouquets = flowers.bouquets.filter((item) => item.shop).slice(0, 4);
  const title = t({
    ru: 'Помощь в повседневных делах',
    en: 'Everyday life, taken care of',
    th: 'บริการสำหรับชีวิตประจำวัน',
  });
  return (
    <section
      className="home-catalog home-services home-container"
      aria-labelledby="home-services-title"
    >
      <div className="home-section-heading">
        <div>
          <h2 id="home-services-title">{title}</h2>
          <p className="home-section-lead">
            {t({
              ru: 'Опубликованные услуги. Условия и время уточняйте у исполнителя.',
              en: 'Published services. Check details and timing with the provider.',
              th: 'บริการที่เผยแพร่ ตรวจสอบรายละเอียดและเวลากับผู้ให้บริการ',
            })}
          </p>
        </div>
        <Link className="home-text-link" to={R.SERVICES}>
          {t({ ru: 'Все услуги', en: 'All services', th: 'บริการทั้งหมด' })}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {services.isLoading || services.isError ? (
        <CatalogState
          label={t({ ru: 'Услуги', en: 'Services', th: 'บริการ' })}
          loading={services.isLoading}
          error={services.isError}
          retry={services.refetch}
          empty={{ en: '', ru: '', th: '' }}
        />
      ) : null}
      {!services.isLoading &&
        !services.isError &&
        !offerings.length &&
        bouquets.length > 0 && (
          <p className="home-section-lead" role="status">
            {t({
              ru: 'Других опубликованных услуг пока нет. Ниже — букеты из каталога.',
              en: 'No other published services yet. Explore bouquets from the catalog below.',
              th: 'ยังไม่มีบริการอื่นที่เผยแพร่ ดูช่อดอกไม้จากรายการด้านล่าง',
            })}
          </p>
        )}
      {flowers.isLoading || flowers.error ? (
        <CatalogState
          label={t({ ru: 'Цветы', en: 'Flowers', th: 'ดอกไม้' })}
          loading={flowers.isLoading}
          error={Boolean(flowers.error)}
          retry={flowers.refetch}
          empty={{ en: '', ru: '', th: '' }}
        />
      ) : null}
      {!services.isLoading &&
      !services.isError &&
      !flowers.isLoading &&
      !flowers.error &&
      !offerings.length &&
      !bouquets.length ? (
        <CatalogState
          loading={false}
          error={false}
          retry={services.refetch}
          empty={{
            ru: 'Опубликованных услуг и букетов пока нет. В разделе услуг можно оставить заявку на помощь по дому.',
            en: 'No published services or bouquets yet. You can request help with your home in Services.',
            th: 'ยังไม่มีบริการหรือช่อดอกไม้ที่เผยแพร่ คุณสามารถส่งคำขอบริการสำหรับบ้านได้ในหน้าบริการ',
          }}
        />
      ) : null}
      {offerings.length || bouquets.length ? (
        <HorizontalRail label={title}>
          {offerings.slice(0, 6).map((item) => (
            <article className="home-catalog-card" key={item.id}>
              <Link
                to={`${R.SERVICE_PROVIDER(item.provider_id)}?${new URLSearchParams({ returnTo: '/' })}`}
              >
                <CatalogPhoto image={item.images?.[0]} />
                <div className="home-catalog-copy">
                  <Wrench size={18} aria-hidden="true" />
                  <h3>
                    {(language === 'ru' ? item.name_ru : item.name_en) ||
                      item.name_en}
                  </h3>
                  {item.provider?.name && <p>{item.provider.name}</p>}
                  <span>
                    {t({
                      ru: 'Посмотреть услугу',
                      en: 'Explore service',
                      th: 'ดูบริการ',
                    })}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
          {bouquets.map((item) => (
            <article className="home-catalog-card" key={item.id}>
              <Link to={R.BOUQUET_DETAIL(item.id)}>
                <CatalogPhoto image={item.image || item.images?.[0]} />
                <div className="home-catalog-copy">
                  <h3>
                    {(language === 'ru' ? item.name_ru : item.name_en) ||
                      item.name_en}
                  </h3>
                  <p>
                    {(language === 'ru'
                      ? item.shop?.name_ru
                      : item.shop?.name_en) || item.shop?.name_en}
                  </p>
                  <span>
                    {t({
                      ru: 'Посмотреть букет',
                      en: 'Explore bouquet',
                      th: 'ดูช่อดอกไม้',
                    })}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </HorizontalRail>
      ) : null}
      <nav
        className="home-service-categories"
        aria-label={t({
          ru: 'Категории услуг',
          en: 'Service categories',
          th: 'หมวดหมู่บริการ',
        })}
      >
        <Link to={R.FLOWERS}>
          {t({ ru: 'Цветы', en: 'Flowers', th: 'ดอกไม้' })}
        </Link>
        <Link to={R.SERVICES}>
          {t({
            ru: 'Помощь по дому',
            en: 'Home services',
            th: 'บริการสำหรับบ้าน',
          })}
        </Link>
        <Link to={`${R.SERVICES}?category=ac`}>
          {t({
            ru: 'Кондиционеры',
            en: 'Air conditioning',
            th: 'เครื่องปรับอากาศ',
          })}
        </Link>
        <Link to={`${R.SERVICES}?category=plumbing`}>
          {t({ ru: 'Сантехника', en: 'Plumbing', th: 'ประปา' })}
        </Link>
        <Link to={`${R.SERVICES}?category=electrical`}>
          {t({ ru: 'Электрика', en: 'Electrical', th: 'ไฟฟ้า' })}
        </Link>
        <Link to={`${R.SERVICES}?q=water`}>
          {t({ ru: 'Вода', en: 'Water', th: 'น้ำ' })}
        </Link>
      </nav>
    </section>
  );
}
