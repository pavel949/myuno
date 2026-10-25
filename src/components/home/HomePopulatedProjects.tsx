import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { usePublicPropertyProjects, type PropertyProject } from '@/hooks/usePropertyProjects';
import type { Property } from '@/hooks/useProperties';
import { complexDetailHref } from '@/lib/real-estate/propertyDetailIntent';
import { getDistrictLabel } from '@/lib/taxonomies';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { HomeGallery } from './HomeGallery';

function CommunityCard({ project }: { project: PropertyProject }) {
  const { language } = useLanguage();
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const images = [...new Set([project.cover_image, ...(project.images ?? [])].map(complexMediaUrl).filter((url): url is string => Boolean(url)))];
  const image = images.find(url => !failed.has(url));
  const title = (language === 'ru' ? project.name_ru : project.name_en) || project.name_en || project.name_ru;
  return <article className="home-community-card"><Link to={complexDetailHref(project.id, 'rent')} aria-label={title}>
    <div className={`home-community-art${image ? '' : ' home-community-art--symbol'}`}>{image ? <img src={image} width="640" height="480" alt="" loading="lazy" decoding="async" onError={() => setFailed(previous => new Set(previous).add(image))} /> : <Building2 size={40} aria-hidden="true" />}</div>
    <div className="home-community-copy"><h3>{title}</h3>{project.district && <p>{getDistrictLabel(project.district, language === 'ru' ? 'ru' : 'en')}</p>}<span>{pickLang(language, { ru: 'О комплексе', en: 'Explore the community', th: 'ดูรายละเอียดโครงการ' })}<ArrowRight size={16} aria-hidden="true" /></span></div>
  </Link></article>;
}
/** Only communities linked to loaded public homes; no inferred availability/counts. */
export function HomePopulatedProjects({ homes }: { homes: Property[] }) {
  const projectIds = [...new Set(homes.map(home => home.project_id).filter((id): id is string => Boolean(id)))];
  const projects = usePublicPropertyProjects(3, undefined, projectIds);
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const rows = (projects.data ?? []).filter(project => projectIds.includes(project.id)).slice(0, 3);
  if (!projectIds.length || (!projects.isLoading && !projects.isError && !rows.length)) return null;
  const state = projects.isError ? <div role="alert"><p>{t({ ru: 'Не удалось загрузить комплексы.', en: 'Could not load communities.', th: 'โหลดโครงการไม่สำเร็จ' })}</p><button type="button" className="home-text-link" onClick={() => projects.refetch()}>{t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</button></div> : projects.isLoading ? <p role="status">{t({ ru: 'Загружаем комплексы…', en: 'Loading communities…', th: 'กำลังโหลดโครงการ…' })}</p> : undefined;
  return <HomeGallery id="home-communities-title" className="home-populated-projects" title={t({ ru: 'Жилые комплексы', en: 'Residential communities', th: 'โครงการที่อยู่อาศัย' })}
    state={state} href={R.COMPLEXES + '?mode=rent'} linkLabel={t({ ru: 'Все комплексы', en: 'All communities', th: 'ทุกโครงการ' })}>
    {rows.map(project => <CommunityCard key={project.id} project={project} />)}
  </HomeGallery>;
}
