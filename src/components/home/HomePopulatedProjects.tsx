import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { usePublicPropertyProjects } from '@/hooks/usePropertyProjects';
import type { Property } from '@/hooks/useProperties';
import { complexDetailHref } from '@/lib/real-estate/propertyDetailIntent';

/** Only projects linked to loaded public rental homes; not date-specific availability. */
export function HomePopulatedProjects({ homes }: { homes: Property[] }) {
  const projects = usePublicPropertyProjects(12);
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const ids = new Set(homes.map(home => home.project_id).filter(Boolean));
  const rows = (projects.data ?? []).filter(project => ids.has(project.id)).slice(0, 3);
  // This secondary discovery strip must not delay or duplicate the primary homes state.
  if (projects.isLoading || projects.isError || !rows.length) return null;
  return <section className="home-populated-projects home-container" aria-labelledby="home-communities-title"><h2 id="home-communities-title">{t({ ru: 'Больше о комплексах', en: 'Explore the communities', th: 'ทำความรู้จักโครงการ' })}</h2><div>{rows.map(project => <Link key={project.id} to={complexDetailHref(project.id, 'rent')}><span>{(language === 'ru' ? project.name_ru : project.name_en) || project.name_en || project.name_ru}</span><ArrowRight size={18} aria-hidden="true" /></Link>)}</div></section>;
}
