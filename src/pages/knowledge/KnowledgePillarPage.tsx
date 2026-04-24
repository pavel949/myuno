/**
 * @module pages/knowledge/KnowledgePillarPage
 * @description M9.6 — Render a single pillar page from `knowledge_pillars`.
 *
 * Route: /knowledge/pillars/:slug — slug is the URL-encoded pillar path
 * without the leading slash, e.g. "guides/buying-property-thailand".
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { SEOHead } from '@/components/seo';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Building2, ShieldCheck, Calculator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKnowledgePillar, useKnowledgePillars } from '@/hooks/useKnowledgePillars';
import { ContextualCTA, type ContextualAction } from '@/components/shared/ContextualCTA';
import { useContextualOffplanMatches } from '@/hooks/useContextualMatches';
import { APP_ROUTES } from '@/lib/config/routes';

/** Pillar clusters that warrant a property/RE next-step CTA. IPP §25. */
const PROPERTY_CLUSTERS = new Set(['6.1', '6.2', '6.6', '6.7', '6.11']);

function renderMarkdownLite(content: string): React.ReactNode[] {
  if (!content) return [];
  const blocks = content.split(/\n\n+/);
  return blocks.map((block, idx) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-xl font-semibold mt-6 mb-3 text-foreground">
          {block.replace(/^## /, '')}
        </h2>
      );
    }
    if (block.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-lg font-medium mt-4 mb-2 text-foreground">
          {block.replace(/^### /, '')}
        </h3>
      );
    }
    if (block.startsWith('|')) {
      // Markdown table — render as <pre> for safety; full parser is overkill here.
      return (
        <pre
          key={idx}
          className="text-xs bg-muted/40 rounded-none p-3 my-3 overflow-x-auto font-mono"
        >
          {block}
        </pre>
      );
    }
    if (/^(?:- |\d+\. )/m.test(block)) {
      const lines = block.split('\n').filter(Boolean);
      const ordered = /^\d+\. /.test(lines[0]);
      const Tag = ordered ? 'ol' : 'ul';
      return (
        <Tag
          key={idx}
          className={`${ordered ? 'list-decimal' : 'list-disc'} list-inside space-y-1 my-3 text-sm text-foreground`}
        >
          {lines.map((line, i) => (
            <li key={i}>{line.replace(/^(?:- |\d+\. )/, '')}</li>
          ))}
        </Tag>
      );
    }
    return (
      <p key={idx} className="text-sm leading-relaxed text-foreground my-3">
        {block}
      </p>
    );
  });
}

export default function KnowledgePillarPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // The route param can be URL-encoded (e.g. "guides%2Fbuying-property-thailand")
  const decoded = slug ? decodeURIComponent(slug) : '';
  const lookupSlug = decoded.startsWith('/') ? decoded : `/${decoded}`;

  const { data: pillar, isLoading } = useKnowledgePillar(lookupSlug);
  const { data: allPillars } = useKnowledgePillars();

  const related = useMemo(() => {
    if (!pillar || !allPillars) return [];
    return allPillars.filter((p) => pillar.related_slugs.includes(p.slug));
  }, [pillar, allPillars]);

  const seoTitle = pillar ? (isRu ? pillar.meta_title_ru : pillar.meta_title_en) : 'Knowledge Hub';
  const seoDescription = pillar ? (isRu ? pillar.meta_description_ru : pillar.meta_description_en) : '';
  const h1 = pillar ? (isRu ? pillar.h1_ru : pillar.h1_en) : '';
  const body = pillar ? (isRu ? pillar.body_ru : pillar.body_en) : '';

  return (
    <>
      <SEOHead title={seoTitle} description={seoDescription} />
      <PageContainer className="pb-32">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath="/knowledge/pillars" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {isRu ? 'Гайд myUNO' : 'myUNO guide'}
              {pillar && <Badge variant="outline" className="text-[10px] ml-1">§{pillar.cluster}</Badge>}
            </p>
            <h1 className="text-xl font-bold text-foreground line-clamp-2">
              {isLoading ? <Skeleton className="h-7 w-64" /> : h1}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !pillar ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                {isRu ? 'Гайд не найден.' : 'Guide not found.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/knowledge/pillars')}>
                {isRu ? 'Все гайды' : 'All guides'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground text-sm mb-4 pb-4 border-b">
                  {isRu ? pillar.meta_description_ru : pillar.meta_description_en}
                </p>
                <article className="prose prose-sm dark:prose-invert max-w-none">
                  {renderMarkdownLite(body)}
                </article>
              </CardContent>
            </Card>

            {related.length > 0 && (
              <section className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {isRu ? 'Связанные гайды' : 'Related guides'}
                </h2>
                <div className="space-y-2">
                  {related.map((r) => {
                    const param = r.slug.replace(/^\//, '');
                    return (
                      <Link
                        key={r.slug}
                        to={`/knowledge/pillars/${encodeURIComponent(param)}`}
                        className="flex items-center justify-between rounded-none border bg-card px-4 py-3 hover:bg-accent transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {isRu ? r.h1_ru : r.h1_en}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
