import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { PUBLIC_CONTENT_ANCHOR } from '@/design-system/ecosystemLayout';
import '@/styles/premium-audience.css';

export interface AudienceLink { title: LangValues; description?: LangValues; href: string }
interface AudienceLandingProps {
  path: string;
  eyebrow: LangValues;
  title: LangValues;
  intro: LangValues;
  primary: AudienceLink;
  secondary: AudienceLink;
  choicesTitle: LangValues;
  choices: AudienceLink[];
  nextTitle: LangValues;
  next: AudienceLink[];
  note: LangValues;
}
/** Public introduction only. Existing destinations own access, onboarding and terms. */
export function AudienceLanding(props: AudienceLandingProps) {
  const { language } = useLanguage();
  const label = (value: LangValues) => pickLang(language, value);
  return <AppLayout usePageContainer={false}>
    <SEOHead title={label(props.eyebrow)} description={label(props.intro)} url={`https://www.myuno.app${props.path}`} />
    <div className="premium-audience">
      <header className="audience-hero">
        <p className="audience-eyebrow">{label(props.eyebrow)}</p>
        <h1>{label(props.title)}</h1>
        <p className="audience-intro">{label(props.intro)}</p>
        <div className="audience-actions">
          {props.primary.href.startsWith('#')
            ? <a className="audience-primary" href={props.primary.href}>{label(props.primary.title)}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
            : <Link className="audience-primary" to={props.primary.href}>{label(props.primary.title)}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>}
          <Link className="audience-secondary" to={props.secondary.href}>{label(props.secondary.title)}</Link>
        </div>
      </header>
      <section id="paths" tabIndex={-1} aria-labelledby="audience-paths-title" className={`audience-section ${PUBLIC_CONTENT_ANCHOR}`}>
        <h2 id="audience-paths-title">{label(props.choicesTitle)}</h2>
        <div className="audience-choices">{props.choices.map(item => <article key={item.href}>
          <h3><Link to={item.href}>{label(item.title)}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link></h3>{item.description && <p>{label(item.description)}</p>}
        </article>)}</div>
      </section>
      <section className="audience-section" aria-labelledby="audience-next-title">
        <h2 id="audience-next-title">{label(props.nextTitle)}</h2>
        <ul className="audience-next">{props.next.map(item => <li key={item.href}><Link to={item.href}>{label(item.title)}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>{item.description && <p>{label(item.description)}</p>}</li>)}</ul>
        <p className="audience-note">{label(props.note)}</p>
      </section>
    </div>
  </AppLayout>;
}
