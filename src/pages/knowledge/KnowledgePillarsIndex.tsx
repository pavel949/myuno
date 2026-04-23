/**
 * @module pages/knowledge/KnowledgePillarsIndex
 * @description M9.6 — Knowledge Hub pillar index with full-text search.
 *
 * Lists the 10 canonical pillar pages from `knowledge_pillars` table.
 * Bilingual (RU/EN), ILIKE search across H1 / description / body.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, ChevronRight, FileText } from 'lucide-react';
import { PageContainer } from '@/components/uno/PageContainer';
import { SEOHead } from '@/components/seo';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKnowledgePillars } from '@/hooks/useKnowledgePillars';

export default function KnowledgePillarsIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const { data: pillars, isLoading } = useKnowledgePillars(search);

  const isRu = language === 'ru';
  const title = isRu ? 'Knowledge Hub — гайды myUNO' : 'Knowledge Hub — myUNO guides';
  const description = isRu
    ? 'Канонические гайды myUNO: покупка, аренда, визы, налоги, управление недвижимостью на Пхукете.'
    : 'Canonical myUNO guides: buying, renting, visas, taxes, property management on Phuket.';

  // Group by cluster for visual structure
  const grouped = useMemo(() => {
    const map = new Map<string, typeof pillars>();
    (pillars ?? []).forEach((p) => {
      const list = map.get(p.cluster) ?? [];
      list.push(p);
      map.set(p.cluster, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [pillars]);

  const goTo = (slug: string) => {
    // Strip leading "/guides/" → route param
    const param = slug.replace(/^\//, '');
    navigate(`/knowledge/pillars/${encodeURIComponent(param)}`);
  };

  return (
    <>
      <SEOHead title={title} description={description} />
      <PageContainer className="pb-32">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath={APP_ROUTES.KNOWLEDGE} variant="ghost" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              {isRu ? 'Гайды myUNO' : 'myUNO guides'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Канонические pillar pages по 10 кластерам Semantic Core.'
                : '10 canonical pillar pages from the Semantic Core clusters.'}
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRu ? 'Поиск по гайдам…' : 'Search guides…'}
            className="pl-9"
            aria-label={isRu ? 'Поиск по базе знаний' : 'Search knowledge base'}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !pillars || pillars.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {isRu ? 'Ничего не нашли. Попробуйте смягчить запрос.' : 'Nothing found. Try a broader query.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([cluster, items]) => (
              <section key={cluster}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {isRu ? 'Кластер' : 'Cluster'} §{cluster}
                </h2>
                <div className="space-y-3">
                  {(items ?? []).map((p) => (
                    <Card
                      key={p.slug}
                      role="button"
                      tabIndex={0}
                      onClick={() => goTo(p.slug)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          goTo(p.slug);
                        }
                      }}
                      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.005] active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between gap-2">
                          <span>{isRu ? p.h1_ru : p.h1_en}</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {isRu ? p.meta_description_ru : p.meta_description_en}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {p.status === 'live' ? (isRu ? 'опубликован' : 'live') : (isRu ? 'черновик' : 'draft')}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {p.word_count} {isRu ? 'слов' : 'words'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
