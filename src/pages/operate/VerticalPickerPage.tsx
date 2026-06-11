import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { listVerticalSpecs } from '@/lib/vertical-specs';
import { BackButton } from '@/components/uno/BackButton';
import { ArrowRight } from 'lucide-react';

/**
 * Vertical picker — entry point to spec-driven onboarding.
 * Route: /mc/listings/new
 *
 * Lists every registered VerticalSpec and routes to /mc/listings/new/:vertical,
 * where VerticalWizard renders fields + validation defined by the spec.
 */
export default function VerticalPickerPage() {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const specs = listVerticalSpecs();

  return (
    <div className="container py-6 max-w-4xl space-y-6">
      <BackButton />
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {lang === 'ru' ? 'Новая карточка' : 'New listing'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'ru'
            ? 'Выберите вертикаль — мастер задаст только релевантные поля и проверит качество перед модерацией.'
            : 'Pick a vertical — the wizard will ask only relevant fields and quality-check before review.'}
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {specs.map((s) => (
          <li key={s.id}>
            <Link
              to={`/mc/listings/new/${s.id}`}
              className="group flex items-start justify-between gap-3 border border-border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">{s.label[lang]}</div>
                <div className="text-xs text-muted-foreground">
                  {s.onboarding.length} {lang === 'ru' ? 'шагов' : 'steps'}
                  {' · '}
                  {s.references?.slice(0, 2).join(' · ')}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
