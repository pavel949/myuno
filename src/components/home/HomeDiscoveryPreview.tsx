import { ProjectStartingPrice } from '@/components/newbuilds/ProjectStartingPrice';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { useProperties } from '@/hooks/useProperties';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { HomeGallery } from './HomeGallery';
import { HomeListingCard } from './HomeListingCard';
import { selectHomeShowcase } from './homeShowcase';

export function HomeHousingPreview() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const stays = useProperties({ listingType: 'rent' }, 18);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const homes = selectHomeShowcase((stays.data ?? []).filter(home => !failed.has(home.id)), 3);
  const state = stays.isLoading ? <p role="status">{t({ ru: 'Загружаем жильё…', en: 'Loading homes…', th: 'กำลังโหลดที่พัก…' })}</p>
    : stays.isError ? <div role="alert"><p>{t({ ru: 'Не удалось загрузить жильё.', en: 'Could not load homes.', th: 'โหลดที่พักไม่สำเร็จ' })}</p><button className="home-text-link" onClick={() => stays.refetch()}>{t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</button></div>
    : !homes.length ? <p>{t({ ru: 'Пока нет вариантов с опубликованными фотографиями. Откройте весь каталог.', en: 'No homes with published photos to preview yet. Explore the full catalogue.', th: 'ยังไม่มีที่พักพร้อมภาพให้แสดง ดูรายการทั้งหมด' })}</p> : undefined;
  return <HomeGallery id="home-stays-title" className="home-properties" title={t({ ru: 'Место, в котором хочется жить', en: 'A place to make your own', th: 'ที่พักที่เป็นตัวคุณ' })} description={t({ ru: 'Жильё на время поездки и для жизни на острове.', en: 'Homes for your time on the island, however long you stay.', th: 'ที่พักบนเกาะไม่ว่าคุณจะอยู่นานแค่ไหน' })} href={`${R.PROPERTY_SEARCH}?mode=rent`} linkLabel={t({ ru: 'Всё жильё', en: 'All homes', th: 'ที่พักทั้งหมด' })} state={state && <div className="home-catalog-state">{state}</div>}>
    {homes.map(property => <HomeListingCard key={property.id} property={property} onUnavailable={id => setFailed(previous => new Set(previous).add(id))} />)}
  </HomeGallery>;
}

export function HomeNewbuildsPreview() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const projects = useOffplanProjects();
  const rows = (projects.data ?? []).slice(0, 3);
  return <section className="home-gallery premium-newbuilds" aria-labelledby="home-newbuilds-title"><div className="home-container">
    <div className="home-section-heading"><div><h2 id="home-newbuilds-title">{t({ ru: 'Новые дома. Следующая глава.', en: 'New homes. Your next chapter.', th: 'บ้านใหม่ บทต่อไปของคุณ' })}</h2><p className="home-section-lead">{t({ ru: 'Познакомьтесь с проектами и застройщиками. Подробности и условия — в каталоге.', en: 'Meet the projects and their developers. Explore the details and terms in the catalogue.', th: 'รู้จักโครงการและผู้พัฒนา ดูรายละเอียดและเงื่อนไขในรายการ' })}</p></div><Link className="home-text-link" to={R.OFFPLAN}>{t({ ru: 'Все новостройки', en: 'All new developments', th: 'โครงการใหม่ทั้งหมด' })}<ArrowRight size={18} aria-hidden="true" /></Link></div>
    {projects.isLoading ? <p role="status" className="home-catalog-state">{t({ ru: 'Загружаем проекты…', en: 'Loading projects…', th: 'กำลังโหลดโครงการ…' })}</p> : projects.isError ? <div role="alert" className="home-catalog-state"><p>{t({ ru: 'Не удалось загрузить проекты.', en: 'Could not load projects.', th: 'โหลดโครงการไม่สำเร็จ' })}</p><button className="home-text-link" onClick={() => projects.refetch()}>{t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</button></div> : !rows.length ? <p className="home-catalog-state">{t({ ru: 'Опубликованные проекты появятся здесь. Каталог остаётся доступен.', en: 'Published projects will appear here. You can still explore the catalogue.', th: 'โครงการที่เผยแพร่จะแสดงที่นี่ คุณยังดูรายการได้' })}</p> : <div className="premium-project-grid">{rows.map(project => <article key={project.id}><Link to={R.OFFPLAN_DETAIL(project.id)}>
      <div className="premium-project-photo">{project.coverImage ? <img src={project.coverImage} alt="" loading="lazy" /> : <Building2 aria-label={t({ ru: 'Фото проекта пока нет', en: 'Project photo not provided', th: 'ยังไม่มีภาพโครงการ' })} />}</div>
      <div className="premium-project-copy">{project.district && <p>{project.district}</p>}<h3>{language === 'ru' ? project.nameRu || project.nameEn : project.nameEn}</h3><ProjectStartingPrice price={project.priceFrom} className="home-project-price" /><span className="home-project-link">{t({ ru: 'Познакомиться с проектом', en: 'Explore the project', th: 'สำรวจโครงการ' })}<ArrowRight size={16} aria-hidden="true" /></span></div>
    </Link></article>)}</div>}
  </div></section>;
}
