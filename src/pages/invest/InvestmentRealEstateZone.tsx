/**
 * Real Estate investment zone — Wave 1 IA refactor.
 *
 * Before: this page nested InvestmentIndex (a second landing) on top of
 * a banner — creating a "landing-inside-landing" anti-pattern.
 *
 * After: standalone overview that routes the user to the canonical real-estate
 * catalogs under /property/* (offplan, resale, commercial, land, hotels) and
 * surfaces investment-specific tools (calculator, ClearView, deals board).
 */
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  Building2,
  Hotel,
  Briefcase,
  Trees,
  ArrowLeftRight,
  Calculator,
  Shield,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { InvestmentCard } from '@/components/invest';
import { useFeaturedInvestments, useInvestmentProjects } from '@/hooks/useInvestmentProjects';

interface CatalogTile {
  icon: typeof Building2;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  path: string;
  badge?: { ru: string; en: string };
}

const CATALOGS: CatalogTile[] = [
  {
    icon: Building2,
    titleRu: 'Новостройки',
    titleEn: 'Off-plan',
    descRu: 'Проекты от застройщиков, рассрочка, гарантии доходности',
    descEn: 'Developer projects, instalments, rental guarantees',
    path: APP_ROUTES.OFFPLAN,
    badge: { ru: 'Популярно', en: 'Popular' },
  },
  {
    icon: ArrowLeftRight,
    titleRu: 'Вторичка и переуступки',
    titleEn: 'Resale & assignments',
    descRu: 'Готовые объекты и уступки контрактов',
    descEn: 'Ready stock and contract assignments',
    path: APP_ROUTES.RESALE,
  },
  {
    icon: Briefcase,
    titleRu: 'Коммерческая',
    titleEn: 'Commercial',
    descRu: 'Cap rate 6–9%, действующие арендаторы',
    descEn: 'Cap rate 6–9%, active tenants',
    path: `${APP_ROUTES.COMMERCIAL}?intent=sale`,
    badge: { ru: 'Доходность', en: 'High yield' },
  },
  {
    icon: Hotel,
    titleRu: 'Отели и hospitality',
    titleEn: 'Hotels & hospitality',
    descRu: 'Действующие отели, бутик-резорты',
    descEn: 'Operating hotels and boutique resorts',
    path: APP_ROUTES.HOTELS,
  },
  {
    icon: Trees,
    titleRu: 'Земля',
    titleEn: 'Land',
    descRu: 'Участки под девелопмент и собственный дом',
    descEn: 'Plots for development or private build',
    path: APP_ROUTES.LAND,
  },
];

export default function InvestmentRealEstateZone() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: featured, isLoading: loadingFeatured } = useFeaturedInvestments();
  const { data: allProjects, isLoading: loadingAll } = useInvestmentProjects();
  const realEstateProjects = (allProjects ?? []).filter((p) =>
    p.project_type.startsWith('real_estate'),
  );

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Недвижимость для инвестиций | myUNO' : 'Real estate investments | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'Недвижимость Пхукета для инвестиций: новостройки, вторичка, коммерческая, отели и земля.'
              : 'Phuket real estate for investors: off-plan, resale, commercial, hotels and land.'
          }
        />
      </Helmet>

      <MiniAppLayout title={isRu ? 'Недвижимость' : 'Real estate'} showSearch={false}>
        <div className="space-y-6 pb-10">
          {/* Hero */}
          <div className="rounded-none border border-border bg-card p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-none bg-success/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground leading-tight">
                  {isRu ? 'Недвижимость для инвестиций' : 'Real estate for investors'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu
                    ? 'Один каталог объектов с фильтрами по типу, бюджету и доходности.'
                    : 'One catalog with filters by type, budget and yield.'}
                </p>
              </div>
            </div>
          </div>

          {/* Catalog tiles */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground px-1">
              {isRu ? 'Каталоги' : 'Catalogs'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATALOGS.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Card
                    key={tile.path}
                    className="cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => navigate(tile.path)}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">
                            {isRu ? tile.titleRu : tile.titleEn}
                          </h3>
                          {tile.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-accent/15 text-accent">
                              {isRu ? tile.badge.ru : tile.badge.en}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {isRu ? tile.descRu : tile.descEn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Featured */}
          {(loadingFeatured || (featured && featured.length > 0)) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isRu ? 'Подборка' : 'Featured'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)}
                  className="text-muted-foreground"
                >
                  {isRu ? 'Все сделки' : 'All deals'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {loadingFeatured ? (
                <div className="flex gap-3 overflow-hidden">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-[280px] shrink-0" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-3 pb-4">
                    {featured!.map((project) => (
                      <InvestmentCard key={project.id} project={project} variant="compact" />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </section>
          )}

          {/* RE-only listings rail (if any) */}
          {realEstateProjects.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground px-1">
                {isRu ? 'Все проекты недвижимости' : 'All real-estate projects'}
              </h2>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 pb-4">
                  {realEstateProjects.slice(0, 10).map((project) => (
                    <InvestmentCard key={project.id} project={project} variant="compact" />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {!loadingAll && realEstateProjects.length === 0 && featured && featured.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isRu ? 'Скоро здесь появятся проекты' : 'Projects coming soon'}
            </p>
          )}

          {/* Tools */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground px-1">
              {isRu ? 'Инструменты' : 'Tools'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(APP_ROUTES.INVEST_CALCULATOR)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <Calculator className="h-5 w-5 text-foreground shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold">{isRu ? 'Калькулятор ROI' : 'ROI calculator'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Доходность, окупаемость, IRR' : 'Yield, payback, IRR'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(APP_ROUTES.CLEARVIEW)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-foreground shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold">ClearView</h3>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Независимый рейтинг проекта' : 'Independent project rating'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(APP_ROUTES.CAPITAL_ADVISORY)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-foreground shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      {isRu ? 'Capital Advisory' : 'Capital Advisory'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Частный канал от $2M' : 'Private channel from $2M'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Raise CTA */}
          <Card
            className="border-border bg-card cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => navigate(`${APP_ROUTES.INVEST_RAISE}?intent=developer_raise`)}
          >
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-none bg-muted">
                <Building2 className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">
                  {isRu ? 'Привлечь капитал в проект' : 'Raise capital for a project'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Разместите проект недвижимости или продажу остатков квартир.'
                    : 'List a real-estate project or remaining inventory for sale.'}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
            </CardContent>
          </Card>
        </div>
      </MiniAppLayout>
    </>
  );
}
