import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useRelocationArticles } from '@/hooks/useRelocationArticles';
import { RELOCATION_ARTICLE_CATEGORIES, type RelocationArticleCategory } from '@/data/relocationArticles.seed';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronRight, BookOpen, Search } from 'lucide-react';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text: string | null | undefined, query: string) {
  const value = text ?? '';
  const q = query.trim();
  if (!q) return value;
  const parts = value.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function RelocationGuidesHub() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: articles, isLoading } = useRelocationArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get('cat') ?? 'all') as RelocationArticleCategory | 'all';
  const query = searchParams.get('q') ?? '';

  const setFilter = (next: RelocationArticleCategory | 'all') => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('cat'); else params.set('cat', next);
    setSearchParams(params, { replace: true });
  };
  const setQuery = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (!next) params.delete('q'); else params.set('q', next);
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(() => {
    if (!articles) return [];
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (filter !== 'all' && a.category !== filter) return false;
      if (!q) return true;
      return (
        a.title_ru.toLowerCase().includes(q) ||
        a.title_en.toLowerCase().includes(q) ||
        (a.summary_ru ?? '').toLowerCase().includes(q) ||
        (a.summary_en ?? '').toLowerCase().includes(q)
      );
    });
  }, [articles, filter, query]);

  const title = isRu ? 'Гайды по переезду на Пхукет' : 'Phuket relocation guides';
  const description = isRu
    ? 'Визы, жильё, школы, банки, TM30, медицина и логистика — практические материалы на русском и английском.'
    : 'Visas, housing, schools, banking, TM30, healthcare and logistics — practical RU/EN guides.';

  return (
    <AppLayout>
      <SEOHead title={title} description={description} type="article" url="https://myuno.app/relocate/guides" />
      <div className="px-4 pb-28 pt-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath={APP_ROUTES.RELOCATE} variant="ghost" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary shrink-0" />
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isRu ? 'Поиск по гайдам…' : 'Search guides…'}
            className="pl-9"
            aria-label={isRu ? 'Поиск гайдов' : 'Search guides'}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs border transition-colors',
              filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground',
            )}
          >
            {isRu ? 'Все' : 'All'}
          </button>
          {RELOCATION_ARTICLE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs border transition-colors',
                filter === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground',
              )}
            >
              {isRu ? c.label_ru : c.label_en}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-none" />
            ))}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-none border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              {isRu ? 'Ничего не найдено. Попробуйте другой запрос или категорию.' : 'No guides found. Try another query or category.'}
            </div>
          )}

          {!isLoading &&
            filtered.map((a) => {
              const cat = RELOCATION_ARTICLE_CATEGORIES.find((c) => c.id === a.category);
              return (
                <Link
                  key={a.slug}
                  to={APP_ROUTES.RELOCATION_GUIDE(a.slug)}
                  className="flex items-start gap-3 rounded-none border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {cat ? (isRu ? cat.label_ru : cat.label_en) : a.category}
                    </p>
                    <h2 className="text-base font-semibold text-foreground mt-0.5">{highlight(isRu ? a.title_ru : a.title_en, query)}</h2>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{highlight(isRu ? a.summary_ru : a.summary_en, query)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" aria-hidden />
                </Link>
              );
            })}
        </div>

        <div className="mt-8 rounded-none border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">{isRu ? 'Инструменты' : 'Tools'}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <Link to={APP_ROUTES.VISA_COMPARE} className="text-primary underline-offset-2 hover:underline">
                {isRu ? 'Сравнение виз' : 'Visa comparison'}
              </Link>
            </li>
            <li>
              <Link to={APP_ROUTES.RELOCATION_MY_PLAN} className="text-primary underline-offset-2 hover:underline">
                {isRu ? 'Мой план переезда' : 'My relocation plan'}
              </Link>
            </li>
            <li>
              <Link to={APP_ROUTES.RELOCATION_AREAS} className="text-primary underline-offset-2 hover:underline">
                {isRu ? 'Районы для жизни' : 'Neighbourhoods'}
              </Link>
            </li>
            <li>
              <Link to={APP_ROUTES.COST_OF_LIVING} className="text-primary underline-offset-2 hover:underline">
                {isRu ? 'Калькулятор стоимости жизни' : 'Cost of living calculator'}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
