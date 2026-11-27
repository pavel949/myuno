/** Shared header for Island life (Life OS) pages: breadcrumbs, title, lead. */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

export const LIFE_OS_CONTAINER = 'container pt-6 pb-24 md:pt-8';
export const LIFE_OS_SECTION_TITLE = 'text-lg font-semibold text-foreground';

export function LifeOsPageHeader({ current, title, lead, icon, children }: { current?: string; title: ReactNode; lead?: ReactNode; icon?: ReactNode; children?: ReactNode }) {
  const { language } = useLanguage();
  const home = pickLang(language, { ru: 'Жизнь на острове', en: 'Island life', th: 'ชีวิตบนเกาะ' });
  return <header className="mb-8 md:mb-10">
    <nav aria-label={pickLang(language, { ru: 'Навигационная цепочка', en: 'Breadcrumb', th: 'เส้นทางนำทาง' })} className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {current ? <>
          <li><Link className="ds-focus inline-flex min-h-11 items-center hover:text-foreground" to={R.DISCOVER_SITUATIONS}>{home}</Link></li>
          <li aria-hidden="true"><ChevronRight className="size-4" /></li>
          <li aria-current="page" className="text-foreground">{current}</li>
        </> : <li aria-current="page" className="inline-flex min-h-11 items-center text-foreground">{home}</li>}
      </ol>
    </nav>
    <div className="flex items-start gap-4">
      {icon}
      <div className="min-w-0">
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{lead}</p>}
      </div>
    </div>
    {children}
  </header>;
}
