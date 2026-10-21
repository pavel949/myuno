import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePublicPropertyProjects, type PropertyProject } from '@/hooks/usePropertyProjects';
import { usePropertiesByProject } from '@/hooks/useProperties';
import { APP_ROUTES } from '@/lib/config/routes';
import { getDistrictLabel } from '@/lib/taxonomies';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';

type ListingMode = 'rent' | 'buy';

const copy = {
  title: { ru: 'Жилые комплексы Пхукета', en: 'Residential communities in Phuket', th: 'โครงการที่พักอาศัยในภูเก็ต' },
  lead: { ru: 'Посмотрите фото и описание комплекса, затем выберите жильё и проверьте даты.', en: 'Explore each community, then choose a home and check its dates.', th: 'ดูรูปและข้อมูลโครงการ แล้วเลือกที่พักและตรวจสอบวันที่ว่าง' },
  search: { ru: 'Найти комплекс', en: 'Search communities', th: 'ค้นหาโครงการ' },
  area: { ru: 'Район', en: 'Area', th: 'ย่าน' },
  allAreas: { ru: 'Весь Пхукет', en: 'All areas', th: 'ทุกย่าน' },
  homeType: { ru: 'Тип жилья', en: 'Home type', th: 'ประเภทที่พัก' },
  allTypes: { ru: 'Любой тип', en: 'Any type', th: 'ทุกประเภท' },
  rent: { ru: 'Аренда', en: 'Rent', th: 'เช่า' },
  buy: { ru: 'Покупка', en: 'Buy', th: 'ซื้อ' },
  mode: { ru: 'Что ищете', en: 'Looking to', th: 'กำลังมองหา' },
  noProjects: { ru: 'По этим условиям комплексы не найдены.', en: 'No communities match these filters.', th: 'ไม่พบโครงการตามตัวกรองนี้' },
  noInventory: { ru: 'Пока нет опубликованных объектов', en: 'No homes listed yet', th: 'ยังไม่มีที่พักที่เผยแพร่' },
  countError: { ru: 'Не удалось загрузить количество предложений', en: 'Could not load listing count', th: 'โหลดจำนวนที่พักไม่สำเร็จ' },
  countNote: { ru: 'Опубликованные предложения. Даты проверьте на странице жилья.', en: 'Published listings. Check exact dates on the home page.', th: 'ที่พักที่เผยแพร่แล้ว ตรวจสอบวันที่ในหน้าที่พัก' },
  open: { ru: 'Открыть комплекс', en: 'Explore community', th: 'ดูข้อมูลโครงการ' },
  more: { ru: 'Показать все комплексы', en: 'Show all communities', th: 'ดูโครงการทั้งหมด' },
  less: { ru: 'Свернуть', en: 'Show fewer', th: 'แสดงน้อยลง' },
  loading: { ru: 'Загружаем комплексы…', en: 'Loading communities…', th: 'กำลังโหลดโครงการ…' },
  error: { ru: 'Не удалось загрузить комплексы.', en: 'Could not load communities.', th: 'โหลดโครงการไม่สำเร็จ' },
  retry: { ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' },
  resultCount: { ru: 'комплексов', en: 'communities', th: 'โครงการ' },
  noImage: { ru: 'Фото скоро появится', en: 'Photo coming soon', th: 'กำลังเพิ่มรูปภาพ' },
} as const;

function projectLocation(project: PropertyProject) {
  return project.location_area || project.district || '';
}

function ProjectCard({ project, mode, propertyType, language }: {
  project: PropertyProject;
  mode: ListingMode;
  propertyType: string;
  language: string;
}) {
  const count = usePropertiesByProject(project.id, 1, {
    mode,
    propertyType: propertyType || undefined,
  });
  const isRu = language === 'ru';
  const lang = language === 'ru' ? 'ru' : 'en';
  const name = (isRu ? project.name_ru : project.name_en) || project.name_en || project.name_ru;
  const location = projectLocation(project);
  const image = [project.cover_image, ...(project.images || [])]
    .map(complexMediaUrl)
    .find((value): value is string => Boolean(value));
  const href = `${APP_ROUTES.COMPLEX_DETAIL(project.id)}?mode=${mode}`;

  return (
    <article className="home-project-card">
      <Link to={href} className="home-project-card-link" aria-label={`${name} — ${copy.open[isRu ? 'ru' : 'en']}`}>
        <div className="home-project-card-image">
          {image ? <img src={image} alt={name} loading="lazy" decoding="async" width="720" height="480" /> : <div className="home-project-no-image"><Building2 size={34} aria-hidden="true" /><span>{copy.noImage[isRu ? 'ru' : language === 'th' ? 'th' : 'en']}</span></div>}
        </div>
        <div className="home-project-card-copy">
          {location && <p className="home-project-location"><MapPin size={15} aria-hidden="true" />{getDistrictLabel(location, lang)}</p>}
          <h3>{name}</h3>
          <p className="home-project-count" aria-live="polite">
            {count.isLoading ? '…' : count.isError ? copy.countError[isRu ? 'ru' : language === 'th' ? 'th' : 'en'] : count.data?.total
              ? `${count.data.total} ${isRu ? 'предложений' : language === 'th' ? 'ที่พัก' : 'listings'}`
              : copy.noInventory[isRu ? 'ru' : language === 'th' ? 'th' : 'en']}
            {!count.isLoading && !count.isError && count.data?.total ? <span>{copy.countNote[isRu ? 'ru' : language === 'th' ? 'th' : 'en']}</span> : null}
          </p>
          <span className="home-project-card-cta">{copy.open[isRu ? 'ru' : language === 'th' ? 'th' : 'en']}<ArrowRight size={17} aria-hidden="true" /></span>
        </div>
      </Link>
    </article>
  );
}

export function HomeProjectGallery() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : language === 'th' ? 'th' : 'en';
  const { data: projects, isLoading, isError, refetch } = usePublicPropertyProjects(24);
  const { propertyTypes } = usePropertyFilterOptions();
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [mode, setMode] = useState<ListingMode>('rent');
  const [showAll, setShowAll] = useState(false);
  const rows = projects || [];

  const districts = useMemo(() => {
    const values = [...new Set(rows.map(projectLocation).filter(Boolean))];
    return values.sort((a, b) => getDistrictLabel(a, isRu ? 'ru' : 'en').localeCompare(getDistrictLabel(b, isRu ? 'ru' : 'en')));
  }, [rows, isRu]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language);
    return rows.filter((project) => {
      const location = projectLocation(project);
      const name = `${project.name_en || ''} ${project.name_ru || ''} ${project.address || ''} ${location}`.toLocaleLowerCase(language);
      return (!query || name.includes(query))
        && (!district || location === district)
    });
  }, [rows, search, district, language]);

  const visible = showAll ? filtered : filtered.slice(0, 6);

  return (
    <section className="home-projects home-container" aria-labelledby="home-projects-title">
      <div className="home-section-heading">
        <div>
          <h2 id="home-projects-title">{copy.title[lang]}</h2>
          <p className="home-section-lead">{copy.lead[lang]}</p>
        </div>
        <Link className="home-text-link" to={APP_ROUTES.OFFPLAN}>{isRu ? 'Все проекты' : language === 'th' ? 'ทุกโครงการ' : 'All projects'}<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>

      <div className="home-project-filters" aria-label={isRu ? 'Фильтры комплексов' : language === 'th' ? 'ตัวกรองโครงการ' : 'Community filters'}>
        <label className="home-project-search">
          <span className="home-field-label">{copy.search[lang]}</span>
          <span className="home-project-search-control"><Search size={17} aria-hidden="true" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setShowAll(false); }} placeholder={isRu ? 'Например, Лаян' : language === 'th' ? 'เช่น ลายัน' : 'For example, Layan'} /></span>
        </label>
        <label className="home-project-filter">
          <span className="home-field-label">{copy.area[lang]}</span>
          <select value={district} onChange={(event) => { setDistrict(event.target.value); setShowAll(false); }} aria-label={copy.area[lang]}>
            <option value="">{copy.allAreas[lang]}</option>
            {districts.map((value) => <option key={value} value={value}>{getDistrictLabel(value, isRu ? 'ru' : 'en')}</option>)}
          </select>
        </label>
        <label className="home-project-filter">
          <span className="home-field-label">{copy.homeType[lang]}</span>
          <select value={propertyType} onChange={(event) => { setPropertyType(event.target.value); setShowAll(false); }} aria-label={copy.homeType[lang]}>
            <option value="">{copy.allTypes[lang]}</option>
            {propertyTypes.map((option) => <option key={option.id} value={option.id}>{isRu ? option.labelRu : option.labelEn}</option>)}
          </select>
        </label>
        <div className="home-project-mode">
          <span className="home-field-label">{copy.mode[lang]}</span>
          <div role="group" aria-label={copy.mode[lang]}>
            {(['rent', 'buy'] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{copy[value][lang]}</button>)}
          </div>
        </div>
      </div>

      {isLoading ? <p className="home-project-state" role="status">{copy.loading[lang]}</p> : isError ? <div className="home-project-state" role="alert"><p>{copy.error[lang]}</p><button type="button" onClick={() => refetch()}>{copy.retry[lang]}</button></div> : filtered.length === 0 ? <p className="home-project-state" role="status">{copy.noProjects[lang]}</p> : <>
        <p className="home-project-result-count">{filtered.length} {copy.resultCount[lang]}</p>
        <div className="home-project-grid">
          {visible.map((project) => <ProjectCard key={project.id} project={project} mode={mode} propertyType={propertyType} language={language} />)}
        </div>
        {filtered.length > 6 && <button type="button" className="home-project-more" onClick={() => setShowAll((value) => !value)}>{showAll ? copy.less[lang] : copy.more[lang]}</button>}
      </>}
    </section>
  );
}
