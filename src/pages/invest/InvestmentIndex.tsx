import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestmentProjects, useFeaturedInvestments, INVESTMENT_CATEGORIES } from '@/hooks/useInvestmentProjects';
import { InvestmentCard, InvestmentAuthGate } from '@/components/invest';
import { MiniAppLayout } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { 
  TrendingUp, 
  Flame, 
  Building2, 
  Briefcase, 
  ArrowRight,
  FileText,
  Shield,
  ChevronRight,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

export default function InvestmentIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // Show sticky CTA after scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyCTA(scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: featured, isLoading: loadingFeatured } = useFeaturedInvestments();
  const { data: allProjects, isLoading: loadingAll } = useInvestmentProjects(
    selectedCategory ? { projectType: selectedCategory } : undefined
  );
  
  // Filter by real estate and business
  const realEstateProjects = allProjects?.filter(p => p.project_type.startsWith('real_estate')) || [];
  const businessProjects = allProjects?.filter(p => !p.project_type.startsWith('real_estate')) || [];

  // Map investment categories to canonical MiniAppCategory shape (id/labelEn/labelRu/icon)
  const layoutCategories = [
    { id: 'all', labelEn: 'All', labelRu: 'Все' },
    ...INVESTMENT_CATEGORIES.slice(0, 6).map((cat) => ({
      id: cat.key,
      labelEn: cat.en,
      labelRu: cat.ru,
      icon: cat.icon,
    })),
  ];

  const ProjectsCarousel = ({ 
    projects, 
    loading 
  }: { 
    projects: typeof allProjects; 
    loading: boolean;
  }) => {
    if (loading) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <Skeleton className="h-[280px] rounded-none" />
            </div>
          ))}
        </div>
      );
    }

    if (!projects?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {isRu ? 'Проекты не найдены' : 'No projects found'}
        </div>
      );
    }

    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {projects.map((project) => (
            <InvestmentCard 
              key={project.id} 
              project={project} 
              variant="compact"
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <InvestmentAuthGate>
      <Helmet>
        <title>{isRu ? 'Инвестиции | myUNO' : 'Invest | myUNO'}</title>
        <meta 
          name="description" 
          content={isRu 
            ? 'Инвестируйте в недвижимость и бизнесы Пхукета с экспертизой muUNO'
            : 'Invest in Phuket real estate and businesses with muUNO expertise'
          } 
        />
      </Helmet>

      <MiniAppLayout
        title={isRu ? 'Инвестиции' : 'Investment Hub'}
        showSearch={false}
        heroIcon={TrendingUp}
        heroTitle={isRu ? 'muUNO Investment Hub' : 'muUNO Investment Hub'}
        heroSubtitle={
          isRu
            ? 'Инвестируйте в проверенные проекты Пхукета с экспертной оценкой рисков'
            : 'Invest in verified Phuket projects with expert risk assessment'
        }
        heroGradientFrom="from-success/30"
        heroGradientVia="via-success/15"
        heroGradientTo="to-background"
        categories={layoutCategories}
        selectedCategory={selectedCategory ?? 'all'}
        onCategoryChange={(id) => setSelectedCategory(id === 'all' ? null : id)}
        crossSellVertical="invest"
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
        <div className="space-y-6">
          {/* Trust badges + Hub navigation */}
          <div className="rounded-none border border-border/60 bg-card/70 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                muUNO Scoring
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                Due Diligence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.INVEST_MARKET)}>
                Market
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.INVEST_DEALS)}>
                Deals
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.INVEST_NETWORK)}>
                Network
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.INVEST_EXECUTION)}>
                Execution
              </Button>
            </div>
          </div>


          {/* Hot Deals section */}
          {!selectedCategory && featured && featured.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-accent-amber" />
                  <h2 className="font-bold text-lg">
                    {isRu ? 'Горячие предложения' : 'Hot Deals'}
                  </h2>
                </div>
              </div>
              <ProjectsCarousel projects={featured} loading={loadingFeatured} />
            </section>
          )}

          {/* Real Estate section */}
          {(!selectedCategory || selectedCategory.startsWith('real_estate')) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-lg">
                    {isRu ? 'Новостройки' : 'Off-Plan Property'}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCategory('real_estate_offplan')}
                  className="text-primary"
                >
                  {isRu ? 'Все' : 'All'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <ProjectsCarousel 
                projects={selectedCategory ? allProjects : realEstateProjects} 
                loading={loadingAll} 
              />
            </section>
          )}

          {/* Business section */}
          {(!selectedCategory || !selectedCategory.startsWith('real_estate')) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-accent-amber" />
                  <h2 className="font-bold text-lg">
                    {isRu ? 'Бизнесы' : 'Business Opportunities'}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCategory('hospitality')}
                  className="text-primary"
                >
                  {isRu ? 'Все' : 'All'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <ProjectsCarousel 
                projects={selectedCategory && !selectedCategory.startsWith('real_estate') ? allProjects : businessProjects} 
                loading={loadingAll} 
              />
            </section>
          )}

          {/* Raise funding CTA */}
          <section className="rounded-none bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-none bg-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">
                  {isRu ? 'Хотите привлечь инвестиции?' : 'Looking to Raise Funding?'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu 
                    ? 'Разместите свой проект на платформе muUNO и получите доступ к инвесторам'
                    : 'List your project on muUNO platform and get access to investors'
                  }
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate(APP_ROUTES.INVEST_RAISE)}
              className="w-full gap-2"
            >
              {isRu ? 'Подать заявку' : 'Submit Application'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>

          {/* Sticky Expert CTA */}
          {showStickyCTA && (
            <VerticalCTA
              vertical="investment"
              variant="sticky"
              context="list"
            />
          )}
        </div>
      </MiniAppLayout>
    </InvestmentAuthGate>
  );
}
