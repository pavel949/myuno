import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { HorizontalRail } from './HorizontalRail';
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
  noInventory: { ru: 'Пока нет опубликованных предложений', en: 'No published listings yet', th: 'ยังไม่มีที่พักที่เผยแพร่' },
  countError: { ru: 'Не удалось загрузить количество предложений', en: 'Could not load listing count', th: 'โหลดจำนวนที่พักไม่สำเร็จ' },
  countNote: { ru: 'Опубликованные предложения. Даты можно проверить внутри комплекса.', en: 'Published listings. Open the complex to check dates.', th: 'ที่พักที่เผยแพร่แล้ว เปิดหน้าโครงการเพื่อตรวจสอบวันที่เข้าพัก' },
  open: { ru: 'Открыть комплекс', en: 'Explore community', th: 'ดูข้อมูลโครงการ' },
  loading: { ru: 'Загружаем комплексы…', en: 'Loading communities…', th: 'กำลังโหลดโครงการ…' },
  error: { ru: 'Не удалось загрузить комплексы.', en: 'Could not load communities.', th: 'โหลดโครงการไม่สำเร็จ' },
  retry: { ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' },
  resultCount: { ru: 'комплексов', en: 'communities', th: 'โครงการ' },
  noImage: { ru: 'Фото скоро появится', en: 'Photo coming soon', th: 'กำลังเพิ่มรูปภาพ' },
} as const;

function formatListingCount(total: number, language: string) {
  const amount = new Intl.NumberFormat(language).format(total);
  if (language === 'ru') {
    const lastTwo = total % 100;
    const last = total % 10;
    const word = lastTwo >= 11 && lastTwo <= 14 ? 'предложений' : last === 1 ? 'предложение' : last >= 2 && last <= 4 ? 'предложения' : 'предложений';
    return amount + ' ' + word;
  }
  if (language === 'th') return amount + ' ที่พัก';
  return amount + ' ' + (total === 1 ? 'listing' : 'listings');
}

function projectLocation(project: PropertyProject) {
  return project.district || '';
}

function ProjectCard({ project, mode, propertyType, language, queryKey, onCount, hidden }: {
  project: PropertyProject;
  mode: ListingMode;
  propertyType: string;
  language: string;
  queryKey: string;
  onCount: (projectId: string, queryKey: string, total: number | null) => void;
  hidden: boolean;
}) {
  const count = usePropertiesByProject(project.id, 1, {
    mode,
    propertyType: propertyType || undefined,
  });
  useEffect(() => {
    if (count.isSuccess) onCount(project.id, queryKey, count.data?.total ?? 0);
    else if (count.isError) onCount(project.id, queryKey, null);
  }, [count.data?.total, count.isError, count.isSuccess, onCount, project.id, queryKey]);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const isRu = language === 'ru';
  const lang = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';
  const name = (isRu ? project.name_ru : project.name_en) || project.name_en || project.name_ru;
  const location = projectLocation(project);
  const image = [project.cover_image, ...(project.images || [])]
    .map(complexMediaUrl)
    .find((value): value is string => Boolean(value));
  const portalParams = new URLSearchParams({ mode });
  if (propertyType) portalParams.set('propertyType', propertyType);
  const href = `${APP_ROUTES.COMPLEX_DETAIL(project.id)}?${portalParams.toString()}`;

  return (
    <article hidden={hidden} className="home-project-card">
      <Link to={href} className="home-project-card-link" aria-label={`${name} — ${copy.open[lang]}`}>
        <div className="home-project-card-image">
          {image && failedImage !== image ? <img onError={() => setFailedImage(image)} src={image} alt={name} loading="lazy" decoding="async" width="720" height="480" /> : <div className="home-project-no-image"><Building2 size={34} aria-hidden="true" /><span>{copy.noImage[lang]}</span></div>}
        </div>
        <div className="home-project-card-copy">
          {location && <p className="home-project-location"><MapPin size={15} aria-hidden="true" />{getDistrictLabel(location, isRu ? 'ru' : 'en')}</p>}
          <h3>{name}</h3>
          <p className="home-project-count" aria-live="polite">
            {count.isLoading ? '…' : count.isError ? copy.countError[lang] : count.data?.total
              ? formatListingCount(count.data.total, language)
              : copy.noInventory[lang]}
            {!count.isLoading && !count.isError && count.data?.total ? <span>{copy.countNote[lang]}</span> : null}
          </p>
          <span className="home-project-card-cta">{copy.open[lang]}<ArrowRight size={17} aria-hidden="true" /></span>
        </div>
      </Link>
    </article>
  );
}

export function HomeProjectGallery() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : language === 'th' ? 'th' : 'en';
  const { data: projects, isLoading, isError, refetch } = usePublicPropertyProjects(12);
  const { propertyTypes } = usePropertyFilterOptions();
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [mode, setMode] = useState<ListingMode>('rent');
  const [inventory, setInventory] = useState<{ key: string; values: Record<string, number | null> }>({ key: '', values: {} });
  const countKey = String(mode) + ':' + propertyType;
  const activeCountKey = useRef(countKey);
  activeCountKey.current = countKey;
  const reportCount = useCallback((projectId: string, queryKey: string, total: number | null) => {
    if (activeCountKey.current !== queryKey) return;
    setInventory((previous) => {
      const values = previous.key === queryKey ? previous.values : {};
      if (values[projectId] === total) return previous;
      return { key: queryKey, values: { ...values, [projectId]: total } };
    });
  }, []);
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

  const countsForFilter = inventory.key === countKey ? inventory.values : {};
  const visibleResults = filtered.filter((project) => !propertyType || countsForFilter[project.id] == null || countsForFilter[project.id]! > 0);
  const inventoryReady = !propertyType || filtered.every((project) => Object.prototype.hasOwnProperty.call(countsForFilter, project.id));

  return (
    <section className="home-projects home-container" aria-labelledby="home-projects-title">
      <div className="home-section-heading">
        <div>
          <h2 id="home-projects-title">{copy.title[lang]}</h2>
          <p className="home-section-lead">{copy.lead[lang]}</p>
        </div>
        <Link className="home-text-link" to={APP_ROUTES.OFFPLAN}>{isRu ? 'Все проекты' : language === 'th' ? 'ทุกโครงการ' : 'All projects'}<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>

      <details className="home-project-refinements"><summary>{isRu ? 'Уточнить комплексы' : language === 'th' ? 'กรองโครงการ' : 'Refine communities'}</summary><div className="home-project-filters" aria-label={isRu ? 'Фильтры комплексов' : language === 'th' ? 'ตัวกรองโครงการ' : 'Community filters'}>
        <label className="home-project-search">
          <span className="home-field-label">{copy.search[lang]}</span>
          <span className="home-project-search-control"><Search size={17} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isRu ? 'Например, Лаян' : language === 'th' ? 'เช่น ลายัน' : 'For example, Layan'} /></span>
        </label>
        <label className="home-project-filter">
          <span className="home-field-label">{copy.area[lang]}</span>
          <select value={district} onChange={(event) => setDistrict(event.target.value)} aria-label={copy.area[lang]}>
            <option value="">{copy.allAreas[lang]}</option>
            {districts.map((value) => <option key={value} value={value}>{getDistrictLabel(value, isRu ? 'ru' : 'en')}</option>)}
          </select>
        </label>
        <label className="home-project-filter">
          <span className="home-field-label">{copy.homeType[lang]}</span>
          <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} aria-label={copy.homeType[lang]}>
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

      </details>
      {isLoading ? <p className="home-project-state" role="status">{copy.loading[lang]}</p> : isError ? <div className="home-project-state" role="alert"><p>{copy.error[lang]}</p><button type="button" onClick={() => refetch()}>{copy.retry[lang]}</button></div> : filtered.length === 0 || inventoryReady && visibleResults.length === 0 ? <p className="home-project-state" role="status">{copy.noProjects[lang]}</p> : <>
        <p className="home-project-result-count">{visibleResults.length} {copy.resultCount[lang]}</p>
        <HorizontalRail label={copy.title[lang]}>
          {filtered.map((project) => <ProjectCard key={project.id} project={project} mode={mode} propertyType={propertyType} language={language} queryKey={countKey} onCount={reportCount} hidden={Boolean(propertyType && countsForFilter[project.id] === 0)} />)}
        </HorizontalRail>
      </>}
    </section>
  );
}
