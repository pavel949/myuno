import { ProjectStartingPrice } from '@/components/newbuilds/ProjectStartingPrice';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { useProperties } from '@/hooks/useProperties';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { DEFAULT_HOME_SALE_MAX_PRICE, propertySaleBudgetLabel, propertySearchHref } from '@/lib/propertySearchQuery';
import { HomeGallery } from './HomeGallery';
import { HomeDiscoveryPaths } from './HomeDiscoveryPaths';
import { HomeListingCard } from './HomeListingCard';
import { selectHomeShowcase } from './homeShowcase';

export function HomeHousingPreview() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  // Bounded candidate pool: filter usable media before displaying six cards.
  // An empty preview does not prove the full catalogue is empty.
  const stays = useProperties({ listingType: 'rent' }, 48);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const homes = selectHomeShowcase((stays.data ?? []).filter(home => !failed.has(home.id)), 6);
  const state = stays.isLoading ? <p role="status">{t({ ru: 'Загружаем жильё…', en: 'Loading homes…', th: 'กำลังโหลดที่พัก…' })}</p>
    : stays.isError ? <div role="alert"><p>{t({ ru: 'Не удалось загрузить жильё.', en: 'Could not load homes.', th: 'โหลดที่พักไม่สำเร็จ' })}</p><button className="home-text-link" onClick={() => stays.refetch()}>{t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</button></div>
    : !homes.length ? <><p>{t({ ru: 'Нет фотографий для этой подборки. Выберите срок аренды, чтобы перейти к поиску.', en: 'No photo preview to show. Choose a rental duration to start your search.', th: 'ยังไม่มีภาพตัวอย่าง เลือกระยะเวลาเช่าเพื่อเริ่มค้นหา' })}</p><HomeDiscoveryPaths kind="homes" /></> : undefined;
  return <HomeGallery id="home-stays-title" className="home-properties" title={t({ ru: 'Место, в котором хочется жить', en: 'A place to make your own', th: 'ที่พักที่เป็นตัวคุณ' })} description={t({ ru: 'Жильё на время поездки и для жизни на острове.', en: 'Homes for your time on the island, however long you stay.', th: 'ที่พักบนเกาะไม่ว่าคุณจะอยู่นานแค่ไหน' })} href={`${R.PROPERTY_SEARCH}?mode=rent`} linkLabel={t({ ru: 'Всё жильё', en: 'All homes', th: 'ที่พักทั้งหมด' })} state={state && <div className="home-catalog-state">{state}</div>}>
    {homes.map(property => <HomeListingCard key={property.id} property={property} onUnavailable={id => setFailed(previous => new Set(previous).add(id))} />)}
  </HomeGallery>;
}

export function HomeSalePreview() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const budget = DEFAULT_HOME_SALE_MAX_PRICE;
  const sale = useProperties({ listingType: 'sale', minPrice: 0.01, maxPrice: budget }, 48);
  const homes = selectHomeShowcase(sale.data ?? [], 4);
  const browse = propertySearchHref('', { mode: 'buy', maxPrice: String(budget) });
  let state;

  if (sale.isLoading) {
    state = (
      <div role="status">
        <span className="sr-only">{t({ ru: 'Загружаем предложения о продаже', en: 'Loading homes for sale', th: 'กำลังโหลดบ้านสำหรับขาย' })}</span>
        <div aria-hidden="true"><ContentSkeleton variant="card" count={2} /></div>
      </div>
    );
  } else if (sale.isError) {
    state = (
      <div className="home-catalog-state" role="alert">
        <p>{t({ ru: 'Не удалось загрузить предложения о продаже.', en: 'Could not load homes for sale.', th: 'โหลดบ้านสำหรับขายไม่สำเร็จ' })}</p>
        <button type="button" className="home-text-link" onClick={() => void sale.refetch()}>
          {t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}
        </button>
      </div>
    );
  } else if (!homes.length) {
    state = <p className="home-catalog-state">{t({ ru: 'Нет предложений с фото для этой подборки.', en: 'No homes with photos to preview at this budget.', th: 'ยังไม่มีบ้านพร้อมภาพตัวอย่างในงบประมาณนี้' })}</p>;
  }

  return (
    <div className="home-sale-band">
      <HomeGallery
        id="home-sale-title"
        title={t({ ru: 'Жильё на продажу', en: 'Homes for sale', th: 'บ้านสำหรับขาย' })}
        description={propertySaleBudgetLabel(budget, language)}
        href={browse}
        linkLabel={t({ ru: 'Посмотреть предложения', en: 'See homes', th: 'ดูบ้าน' })}
        state={state}
      >
        {homes.map(property => <PropertyListingCard key={property.id} property={property} mode="buy" focusedOffer />)}
      </HomeGallery>
    </div>
  );
}

export function HomeNewbuildsPreview() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const projects = useOffplanProjects();
  const rows = (projects.data ?? []).slice(0, 6);
  const title = t({ ru: 'Новые жилые комплексы', en: 'New developments', th: 'โครงการที่พักใหม่' });
  const state = projects.isLoading ? <p role="status" className="home-catalog-state">{t({ ru: 'Загружаем проекты…', en: 'Loading projects…', th: 'กำลังโหลดโครงการ…' })}</p> : projects.isError ? <div role="alert" className="home-catalog-state"><p>{t({ ru: 'Не удалось загрузить проекты.', en: 'Could not load projects.', th: 'โหลดโครงการไม่สำเร็จ' })}</p><button className="home-text-link" onClick={() => projects.refetch()}>{t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</button></div> : !rows.length ? <p className="home-catalog-state">{t({ ru: 'Опубликованные проекты появятся здесь. Каталог остаётся доступен.', en: 'Published projects will appear here. You can still explore the catalogue.', th: 'โครงการที่เผยแพร่จะแสดงที่นี่ คุณยังดูรายการได้' })}</p> : undefined;
  return <HomeGallery id="home-newbuilds-title" className="premium-newbuilds" title={title}
    description={t({ ru: 'Новостройки и проекты для покупки. Сравните планировки, цены и условия застройщиков.', en: 'New developments to buy. Compare layouts, prices and developer terms.', th: 'โครงการใหม่สำหรับซื้อ เปรียบเทียบแปลน ราคา และเงื่อนไขของผู้พัฒนา' })}
    href={R.OFFPLAN} linkLabel={t({ ru: 'Все новостройки', en: 'All new developments', th: 'โครงการใหม่ทั้งหมด' })} state={state}>
    {rows.map(project => <article key={project.id}><Link to={R.OFFPLAN_DETAIL(project.id)}>
      <div className="premium-project-photo">{project.coverImage ? <img src={project.coverImage} alt={language === 'ru' ? project.nameRu || project.nameEn : project.nameEn} loading="lazy" /> : <Building2 aria-label={t({ ru: 'Фото проекта пока нет', en: 'Project photo not provided', th: 'ยังไม่มีภาพโครงการ' })} />}</div>
      <div className="premium-project-copy">{project.district && <p>{project.district}</p>}<h3>{language === 'ru' ? project.nameRu || project.nameEn : project.nameEn}</h3><ProjectStartingPrice price={project.priceFrom} className="home-project-price" /><span className="home-project-link">{t({ ru: 'Познакомиться с проектом', en: 'Explore the project', th: 'สำรวจโครงการ' })}<ArrowRight size={16} aria-hidden="true" /></span></div>
    </Link></article>)}
  </HomeGallery>;
}
