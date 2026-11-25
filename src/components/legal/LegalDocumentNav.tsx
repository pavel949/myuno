import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * Shared legal-document switcher + document facts (Design Bible K9).
 * One template for every legal page: the reader can move between documents
 * and always sees which version they are reading and in which languages.
 * Version / updated values come from the page itself — never invented here.
 */
export const LEGAL_DOCUMENTS = [
  { path: '/terms', ru: 'Условия', en: 'Terms' },
  { path: '/privacy', ru: 'Конфиденциальность', en: 'Privacy' },
  { path: '/cookies', ru: 'Cookies', en: 'Cookies' },
  { path: '/refund-policy', ru: 'Возвраты', en: 'Refunds' },
  { path: '/dispute-resolution', ru: 'Споры', en: 'Disputes' },
  { path: '/ip-policy', ru: 'Интеллектуальная собственность', en: 'IP policy' },
  { path: '/partner-agreement', ru: 'Договор партнёра', en: 'Partner agreement' },
] as const;

export type LegalDocumentPath = (typeof LEGAL_DOCUMENTS)[number]['path'];

interface LegalDocumentNavProps {
  current: LegalDocumentPath;
  /** Display string as stated on the page, e.g. "2.0". */
  version?: string;
  /** Display string as stated on the page, e.g. "January 2026". */
  updatedRu?: string;
  updatedEn?: string;
  className?: string;
}

export function LegalDocumentNav({ current, version, updatedRu, updatedEn, className }: LegalDocumentNavProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const updated = isRu ? updatedRu : updatedEn;

  return (
    <div className={cn('mb-6 space-y-3', className)}>
      <nav aria-label={isRu ? 'Юридические документы' : 'Legal documents'}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Юридические документы' : 'Legal documents'}
        </p>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {LEGAL_DOCUMENTS.map((doc) => {
            const isCurrent = doc.path === current;
            return (
              <li key={doc.path} className="shrink-0">
                <Link
                  to={doc.path}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/40',
                  )}
                >
                  {isRu ? doc.ru : doc.en}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 border-y border-border py-3 text-sm min-[420px]:grid-cols-3">
        {version && (
          <div className="flex gap-2 min-[420px]:block">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{isRu ? 'Версия' : 'Version'}</dt>
            <dd className="font-mono tabular-nums">{version}</dd>
          </div>
        )}
        {updated && (
          <div className="flex gap-2 min-[420px]:block">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{isRu ? 'Обновлено' : 'Updated'}</dt>
            <dd>{updated}</dd>
          </div>
        )}
        <div className="flex gap-2 min-[420px]:block">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">{isRu ? 'Языки' : 'Languages'}</dt>
          <dd>{isRu ? 'Русский, English' : 'English, Русский'}</dd>
        </div>
      </dl>
    </div>
  );
}
