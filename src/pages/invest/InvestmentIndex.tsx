import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentProjects, useFeaturedInvestments, INVESTMENT_CATEGORIES } from '@/hooks/useInvestmentProjects';
import { InvestmentCard } from '@/components/invest';
import { MiniAppLayout } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Flame, 
  Building2, 
  Briefcase, 
  ArrowRight,
  FileText,
  Shield,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InvestmentIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: featured, isLoading: loadingFeatured } = useFeaturedInvestments();
  const { data: allProjects, isLoading: loadingAll } = useInvestmentProjects(
    selectedCategory ? { projectType: selectedCategory } : undefined
  );
  
  // Filter by real estate and business
  const realEstateProjects = allProjects?.filter(p => p.project_type.startsWith('real_estate')) || [];
  const businessProjects = allProjects?.filter(p => !p.project_type.startsWith('real_estate')) || [];

  const CategoryChips = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedCategory(null)}
        className="flex-shrink-0 rounded-full"
      >
        {isRu ? 'Все' : 'All'}
      </Button>
      {INVESTMENT_CATEGORIES.slice(0, 6).map((cat) => (
        <Button
          key={cat.key}
          variant={selectedCategory === cat.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(cat.key)}
          className="flex-shrink-0 rounded-full gap-1.5"
        >
          <span>{cat.icon}</span>
          <span>{isRu ? cat.ru : cat.en}</span>
        </Button>
      ))}
    </div>
  );

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
              <Skeleton className="h-[280px] rounded-xl" />
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
    <>
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
      >
        <div className="space-y-6">
          {/* Hero section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <h1 className="text-xl font-bold">
                  {isRu ? 'muUNO Investment Hub' : 'muUNO Investment Hub'}
                </h1>
              </div>
              <p className="text-white/90 text-sm">
                {isRu 
                  ? 'Инвестируйте в проверенные проекты Пхукета с экспертной оценкой рисков'
                  : 'Invest in verified Phuket projects with expert risk assessment'
                }
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className="bg-white/20 text-white border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  muUNO Scoring
                </Badge>
                <Badge className="bg-white/20 text-white border-0">
                  <FileText className="h-3 w-3 mr-1" />
                  Due Diligence
                </Badge>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <CategoryChips />

          {/* Hot Deals section */}
          {!selectedCategory && featured && featured.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
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
                  <Briefcase className="h-5 w-5 text-amber-600" />
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
          <section className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
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
              onClick={() => navigate('/invest/raise')}
              className="w-full gap-2"
            >
              {isRu ? 'Подать заявку' : 'Submit Application'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        </div>
      </MiniAppLayout>
    </>
  );
}
