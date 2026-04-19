import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentProjects, BUSINESS_CATEGORIES } from '@/hooks/useInvestmentProjects';
import { useBusinessListings } from '@/hooks/useBusinessListings';
import { InvestmentCard, AnonymizedListingCard } from '@/components/invest';
import { MiniAppLayout } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Megaphone, ArrowRight, Construction, Lock } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

export default function InvestmentBusinessZone() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [params, setParams] = useSearchParams();
  const selectedType = params.get('type');

  const { data: projects, isLoading } = useInvestmentProjects(
    selectedType ? { projectType: selectedType } : undefined,
  );
  const { data: listings, isLoading: loadingListings } = useBusinessListings();

  const businessProjects = (projects ?? []).filter((p) => !p.project_type.startsWith('real_estate'));

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Бизнес и франшизы | myUNO' : 'Business & Franchises | myUNO'}</title>
      </Helmet>
      <MiniAppLayout title={isRu ? 'Бизнес' : 'Business'} showSearch={false}>
        <div className="space-y-5 pb-10">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-600" />
                <h1 className="font-bold text-lg">
                  {isRu ? 'Готовый бизнес и франшизы' : 'Operating business & franchises'}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'F&B, отели, ритейл, marine, импорт-экспорт, медицина — действующие проекты с операционкой.'
                  : 'F&B, hotels, retail, marine, import-export, medical — running projects with operations.'}
              </p>
            </CardContent>
          </Card>

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              <Badge
                variant={!selectedType ? 'default' : 'outline'}
                className="cursor-pointer flex-shrink-0"
                onClick={() => setParams({})}
              >
                {isRu ? 'Все' : 'All'}
              </Badge>
              {BUSINESS_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.key}
                  variant={selectedType === cat.key ? 'default' : 'outline'}
                  className="cursor-pointer flex-shrink-0"
                  onClick={() => setParams({ type: cat.key })}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {isRu ? cat.ru : cat.en}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[260px] rounded-xl" />
              ))}
            </div>
          ) : businessProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <Construction className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold">
                  {isRu ? 'Каталог пополняется' : 'Catalog growing'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRu
                    ? 'Готовый бизнес на продажу появится здесь в ближайших релизах. Оставьте заявку — мы подберём проект под ваш бэкграунд.'
                    : 'Businesses for sale are coming in upcoming releases. Submit a request — we will match a project to your background.'}
                </p>
                <Button onClick={() => navigate(APP_ROUTES.INVEST_SERVICES)}>
                  {isRu ? 'Оставить запрос' : 'Submit request'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {businessProjects.map((project) => (
                <InvestmentCard key={project.id} project={project} variant="compact" />
              ))}
            </div>
          )}

          <section className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">
                  {isRu ? 'Продаёте бизнес?' : 'Selling a business?'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Разместите действующий проект — F&B, отель, retail или marine.'
                    : 'List your operating project — F&B, hotel, retail or marine.'}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(APP_ROUTES.INVEST_RAISE)} className="w-full gap-2">
              {isRu ? 'Разместить' : 'List a business'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        </div>
      </MiniAppLayout>
    </>
  );
}
