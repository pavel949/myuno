import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useFeaturedInvestments,
  useInvestmentProjects,
  REAL_ESTATE_CATEGORIES,
  BUSINESS_CATEGORIES,
} from '@/hooks/useInvestmentProjects';
import { InvestmentCard } from '@/components/invest';
import { MiniAppLayout } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import {
  TrendingUp,
  Building2,
  Briefcase,
  BookOpen,
  Handshake,
  Megaphone,
  ArrowRight,
  Flame,
  ChevronRight,
  Shield,
  FileText,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface ZoneCardProps {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  bullets: { ru: string; en: string }[];
  ctaPath: string;
  accentClass: string;
  iconBgClass: string;
  badgeRu?: string;
  badgeEn?: string;
}

function ZoneCard({
  icon: Icon,
  titleRu,
  titleEn,
  descRu,
  descEn,
  bullets,
  ctaPath,
  accentClass,
  iconBgClass,
  badgeRu,
  badgeEn,
}: ZoneCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer',
        accentClass,
      )}
      onClick={() => navigate(ctaPath)}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconBgClass)}>
            <Icon className="w-5 h-5" />
          </div>
          {badgeRu && (
            <Badge variant="secondary" className="text-[10px]">
              {isRu ? badgeRu : badgeEn}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-bold text-base leading-tight">{isRu ? titleRu : titleEn}</h3>
          <p className="text-xs text-muted-foreground mt-1">{isRu ? descRu : descEn}</p>
        </div>
        <ul className="space-y-1">
          {bullets.map((b, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span>
              <span>{isRu ? b.ru : b.en}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center text-xs text-primary font-medium pt-1">
          {isRu ? 'Открыть' : 'Open'}
          <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestmentHubLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handler = () => setShowStickyCTA(window.scrollY > 600);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const { data: featured, isLoading: loadingFeatured } = useFeaturedInvestments();
  const { data: allProjects, isLoading: loadingAll } = useInvestmentProjects();

  const realEstateProjects = (allProjects ?? []).filter((p) => p.project_type.startsWith('real_estate')).slice(0, 8);
  const businessProjects = (allProjects ?? []).filter((p) => !p.project_type.startsWith('real_estate')).slice(0, 8);

  const ProjectsRail = ({ projects, loading }: { projects: typeof allProjects; loading: boolean }) => {
    if (loading) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <Skeleton className="h-[280px] rounded-xl" />
            </div>
          ))}
        </div>
      );
    }
    if (!projects?.length) {
      return (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {isRu ? 'Скоро здесь появятся проекты' : 'Projects coming soon'}
        </div>
      );
    }
    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {projects.map((project) => (
            <InvestmentCard key={project.id} project={project} variant="compact" />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиции в Таиланде | myUNO' : 'Invest in Thailand | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'Капитал в Пхукете: недвижимость, готовый бизнес, франшизы, советы и сопровождение сделок'
              : 'Move capital into Phuket: real estate, businesses for sale, franchises, advisory & deal execution'
          }
        />
      </Helmet>

      <MiniAppLayout
        title={isRu ? 'Инвестиции' : 'Invest'}
        showSearch={false}
        headerActions={
          user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(APP_ROUTES.INVEST_DASHBOARD)}
              className="gap-1.5"
            >
              <User className="h-4 w-4" />
              {isRu ? 'Кабинет' : 'Dashboard'}
            </Button>
          ) : null
        }
      >
        <div className="space-y-6 pb-10">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-700 to-blue-800 p-6 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs font-medium opacity-90 uppercase tracking-wide">
                  {isRu ? 'Капитал в Таиланде' : 'Capital in Thailand'}
                </span>
              </div>
              <h1 className="text-2xl font-bold leading-tight">
                {isRu
                  ? 'Куда вложить и какой бизнес открыть в Пхукете'
                  : 'Where to invest and what business to open in Phuket'}
              </h1>
              <p className="text-white/85 text-sm">
                {isRu
                  ? 'Недвижимость, готовый бизнес, франшизы, советы юристов — всё в одном хабе.'
                  : 'Real estate, ready businesses, franchises, advisory — all in one hub.'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge className="bg-white/20 text-white border-0 text-[10px]">
                  <Shield className="h-3 w-3 mr-1" /> muUNO Score
                </Badge>
                <Badge className="bg-white/20 text-white border-0 text-[10px]">
                  <FileText className="h-3 w-3 mr-1" /> Due Diligence
                </Badge>
                <Badge className="bg-white/20 text-white border-0 text-[10px]">
                  <Handshake className="h-3 w-3 mr-1" /> Advisory
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)}
                  className="gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  {isRu ? 'Все сделки' : 'Browse deals'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(APP_ROUTES.INVEST_SUBMIT)}
                  className="gap-1.5"
                >
                  <Megaphone className="h-4 w-4" />
                  {isRu ? 'Подать сделку' : 'Submit deal'}
                </Button>
              </div>
            </div>
          </div>

          {/* Universal capital marketplace banner */}
          <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">
                    {isRu ? 'Универсальный капитал-маркетплейс' : 'Universal Capital Marketplace'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRu
                      ? 'Недвижимость, бизнес, стартапы, франшизы — любые сделки в Таиланде. Все проекты анонимизированы.'
                      : 'Real estate, business, startups, franchises — any deal in Thailand. All projects are anonymized.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)}
                  className="gap-1.5"
                >
                  {isRu ? 'Смотреть сделки' : 'Browse'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(APP_ROUTES.INVEST_SUBMIT)}
                  className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isRu ? 'Привлечь капитал' : 'Raise capital'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5 Zones */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold px-1">{isRu ? '5 направлений хаба' : 'Hub Zones'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ZoneCard
                icon={Building2}
                titleRu="Недвижимость"
                titleEn="Real Estate"
                descRu="Off-plan, аренда, вторичка, ROI"
                descEn="Off-plan, rental, resale, ROI"
                bullets={[
                  { ru: 'Новостройки от застройщиков', en: 'Off-plan from developers' },
                  { ru: 'Арендный бизнес и переуступки', en: 'Rental business & assignments' },
                  { ru: 'Калькулятор доходности', en: 'ROI & yield calculator' },
                ]}
                ctaPath={APP_ROUTES.INVEST_REAL_ESTATE}
                accentClass="hover:bg-emerald-500/5"
                iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                badgeRu="Популярно"
                badgeEn="Popular"
              />
              <ZoneCard
                icon={Briefcase}
                titleRu="Готовый бизнес"
                titleEn="Business"
                descRu="Покупка, франшизы, проекты"
                descEn="Buy, franchise, projects"
                bullets={[
                  { ru: 'Действующий бизнес на продажу', en: 'Operating businesses for sale' },
                  { ru: 'Франшизы и партнёрство', en: 'Franchises & partnerships' },
                  { ru: 'F&B, отели, retail, marine, import/export', en: 'F&B, hotels, retail, marine, trade' },
                ]}
                ctaPath={APP_ROUTES.INVEST_BUSINESS}
                accentClass="hover:bg-amber-500/5"
                iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                badgeRu="Новое"
                badgeEn="New"
              />
              <ZoneCard
                icon={BookOpen}
                titleRu="Знания"
                titleEn="Knowledge"
                descRu="Гайды по бизнесу в Таиланде"
                descEn="Doing business in Thailand"
                bullets={[
                  { ru: 'Структуры собственности (Thai Ltd, BOI)', en: 'Ownership structures (Thai Ltd, BOI)' },
                  { ru: 'Налоги, виза, work permit', en: 'Taxes, visa, work permit' },
                  { ru: 'Как открыть ресторан / отель / spa', en: 'How to open restaurant / hotel / spa' },
                ]}
                ctaPath={APP_ROUTES.INVEST_KNOWLEDGE}
                accentClass="hover:bg-blue-500/5"
                iconBgClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              />
              <ZoneCard
                icon={Handshake}
                titleRu="Услуги"
                titleEn="Services"
                descRu="Юристы, advisory, представители"
                descEn="Legal, advisory, representation"
                bullets={[
                  { ru: 'Представляйте мои интересы', en: 'Represent my interests' },
                  { ru: 'Юристы, accountants, BOI', en: 'Lawyers, accountants, BOI' },
                  { ru: 'Due diligence и M&A', en: 'Due diligence & M&A' },
                ]}
                ctaPath={APP_ROUTES.INVEST_SERVICES}
                accentClass="hover:bg-violet-500/5"
                iconBgClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              />
              <ZoneCard
                icon={Megaphone}
                titleRu="Привлечь капитал"
                titleEn="Raise Capital"
                descRu="Проекты, бизнес на продажу, стартапы"
                descEn="Projects, business sales, startups"
                bullets={[
                  { ru: 'Разместить проект недвижимости', en: 'List a property project' },
                  { ru: 'Продать действующий бизнес', en: 'Sell an operating business' },
                  { ru: 'Найти ко-инвестора', en: 'Find a co-investor' },
                ]}
                ctaPath={APP_ROUTES.INVEST_RAISE}
                accentClass="hover:bg-rose-500/5 sm:col-span-2"
                iconBgClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
              />
            </div>
          </section>

          {/* Hot Deals */}
          {featured && featured.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  <h2 className="font-bold text-lg">{isRu ? 'Горячие предложения' : 'Hot Deals'}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(APP_ROUTES.INVEST_REAL_ESTATE)}
                  className="text-primary"
                >
                  {isRu ? 'Все' : 'All'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <ProjectsRail projects={featured} loading={loadingFeatured} />
            </section>
          )}

          {/* Real Estate dominant */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h2 className="font-bold text-lg">{isRu ? 'Недвижимость' : 'Real Estate'}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(APP_ROUTES.INVEST_REAL_ESTATE)}
                className="text-primary"
              >
                {isRu ? 'Открыть' : 'Open'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <ProjectsRail projects={realEstateProjects} loading={loadingAll} />
            <div className="flex flex-wrap gap-2 px-1">
              {REAL_ESTATE_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => navigate(`${APP_ROUTES.INVEST_REAL_ESTATE}?type=${cat.key}`)}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {isRu ? cat.ru : cat.en}
                </Badge>
              ))}
            </div>
          </section>

          {/* Business */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-600" />
                <h2 className="font-bold text-lg">{isRu ? 'Бизнес и франшизы' : 'Business & Franchises'}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}
                className="text-primary"
              >
                {isRu ? 'Открыть' : 'Open'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <ProjectsRail projects={businessProjects} loading={loadingAll} />
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2 px-1">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.key}
                    variant="outline"
                    className="cursor-pointer flex-shrink-0 hover:bg-primary/10"
                    onClick={() => navigate(`${APP_ROUTES.INVEST_BUSINESS}?type=${cat.key}`)}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {isRu ? cat.ru : cat.en}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* Knowledge teaser */}
          <Card
            className="bg-gradient-to-r from-blue-500/5 to-violet-500/5 border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition-all"
            onClick={() => navigate(APP_ROUTES.INVEST_KNOWLEDGE)}
          >
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">
                  {isRu ? 'Бизнес в Таиланде 101' : 'Doing Business in Thailand 101'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Структуры компаний, налоги, work permit, BOI, импорт-экспорт, кейсы.'
                    : 'Company structures, taxes, work permit, BOI, import-export, case studies.'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            </CardContent>
          </Card>

          {/* Capital services teaser */}
          <Card
            className="bg-gradient-to-r from-violet-500/5 to-rose-500/5 border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition-all"
            onClick={() => navigate(APP_ROUTES.INVEST_SERVICES)}
          >
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">
                  {isRu ? 'Представляйте мои интересы' : 'Represent my interests'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Найдём local partner, юриста, бухгалтера или operator, который ведёт ваш проект на месте.'
                    : 'Find a local partner, lawyer, accountant or operator running your project on the ground.'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            </CardContent>
          </Card>

          {/* Raise CTA */}
          <section className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">
                  {isRu ? 'Привлекаете инвестиции?' : 'Raising capital?'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Разместите проект недвижимости, действующий бизнес или стартап на платформе muUNO.'
                    : 'List a property project, operating business or startup on the muUNO platform.'}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(APP_ROUTES.INVEST_RAISE)} className="w-full gap-2">
              {isRu ? 'Подать заявку' : 'Submit application'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>

          {showStickyCTA && <VerticalCTA vertical="investment" variant="sticky" context="list" />}
        </div>
      </MiniAppLayout>
    </>
  );
}
