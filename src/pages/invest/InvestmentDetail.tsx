import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentProject } from '@/hooks/useInvestmentProjects';
import { 
  MuunoScoreWidget, 
  FundingProgress, 
  ScoreBreakdown,
  InterestForm 
} from '@/components/invest';
import { INVESTMENT_CATEGORIES } from '@/hooks/useInvestmentProjects';
import { ExitIntentModal } from '@/components/leads/ExitIntentModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  MapPin, 
  TrendingUp, 
  Clock, 
  Target,
  Flame,
  Star,
  BadgeCheck,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InvestmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: project, isLoading, error } = useInvestmentProject(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isRu ? 'Проект не найден' : 'Project not found'}
          </p>
          <Button variant="outline" onClick={() => navigate('/property/invest')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isRu ? 'Назад к каталогу' : 'Back to catalog'}
          </Button>
        </div>
      </div>
    );
  }

  const title = isRu ? project.title_ru : project.title_en;
  const description = isRu ? project.description_ru : project.description_en;
  const category = INVESTMENT_CATEGORIES.find(c => c.key === project.project_type);
  const categoryLabel = category ? (isRu ? category.ru : category.en) : project.project_type;
  const categoryIcon = category?.icon || '💼';

  return (
    <>
      <Helmet>
        <title>{title} | {isRu ? 'Инвестиции' : 'Invest'} | myUNO</title>
        <meta name="description" content={description || title} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/property/invest')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {project.cover_image ? (
            <img
              src={project.cover_image}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-6xl">{categoryIcon}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {project.is_hot && (
              <Badge className="bg-orange-500 text-white">
                <Flame className="h-3.5 w-3.5 mr-1" />
                HOT DEAL
              </Badge>
            )}
            {project.is_featured && !project.is_hot && (
              <Badge className="bg-primary text-primary-foreground">
                <Star className="h-3.5 w-3.5 mr-1" />
                Featured
              </Badge>
            )}
            {project.is_verified && (
              <Badge variant="secondary" className="bg-background/90">
                <BadgeCheck className="h-3.5 w-3.5 mr-1 text-primary" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <div className="px-4 -mt-8 relative z-10 space-y-6">
          {/* Title & Category */}
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-lg space-y-3">
            <Badge variant="secondary">
              {categoryIcon} {categoryLabel}
            </Badge>
            
            <h1 className="text-xl font-bold">{title}</h1>
            
            {project.district && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{project.district}, Phuket</span>
              </div>
            )}

            {/* muUNO Score */}
            <div className="pt-2 border-t border-border/50">
              <MuunoScoreWidget
                score={project.muuno_score}
                size="md"
                showRisk={false}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>{isRu ? 'Прогноз ROI' : 'Projected ROI'}</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {project.roi_projected ? `${project.roi_projected}%` : '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRu ? 'годовых' : 'annually'}
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="h-4 w-4" />
                <span>{isRu ? 'Мин. вход' : 'Min Entry'}</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {project.min_investment 
                  ? `$${(project.min_investment / 1000).toFixed(0)}K`
                  : '—'
                }
              </div>
              <div className="text-xs text-muted-foreground">
                {project.currency}
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>{isRu ? 'Срок' : 'Term'}</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {project.investment_term_months || '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRu ? 'месяцев' : 'months'}
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Target className="h-4 w-4" />
                <span>{isRu ? 'Выход' : 'Exit'}</span>
              </div>
              <div className="text-sm font-medium mt-1 line-clamp-2">
                {project.exit_strategy || (isRu ? 'Аренда + Перепродажа' : 'Rental + Resale')}
              </div>
            </div>
          </div>

          {/* Funding Progress */}
          {project.funding_goal && (
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {isRu ? 'Прогресс сбора' : 'Funding Progress'}
              </h3>
              <FundingProgress
                fundingGoal={project.funding_goal}
                amountRaised={project.amount_raised}
                investorsCount={project.investors_count}
                currency={project.currency}
                size="lg"
              />
            </div>
          )}

          {/* Tabs for details */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">
                {isRu ? 'Обзор' : 'Overview'}
              </TabsTrigger>
              <TabsTrigger value="scoring" className="flex-1">
                {isRu ? 'Скоринг' : 'Scoring'}
              </TabsTrigger>
              <TabsTrigger value="risks" className="flex-1">
                {isRu ? 'Риски' : 'Risks'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="bg-card rounded-xl p-4 border border-border/50 space-y-4">
                {description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isRu ? 'Описание скоро будет добавлено' : 'Description coming soon'}
                  </p>
                )}

                {project.published_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {isRu ? 'Опубликовано:' : 'Published:'}{' '}
                      {new Date(project.published_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scoring" className="mt-4">
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <ScoreBreakdown
                  scoreBreakdown={project.score_breakdown as Record<string, number> | null}
                  projectType={project.project_type}
                />
                
                {!project.score_breakdown && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    {isRu 
                      ? 'Детализация скоринга будет доступна после верификации'
                      : 'Score breakdown will be available after verification'
                    }
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="risks" className="mt-4">
              <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {isRu ? 'Факторы риска' : 'Risk Factors'}
                </h3>
                
                {project.risk_factors && project.risk_factors.length > 0 ? (
                  <ul className="space-y-2">
                    {project.risk_factors.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span className="text-muted-foreground">{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>
                        {isRu 
                          ? 'Возможные задержки строительства (типично 6-12 месяцев)'
                          : 'Potential construction delays (typically 6-12 months)'
                        }
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>
                        {isRu 
                          ? 'Валютные риски (THB/USD)'
                          : 'Currency risks (THB/USD)'
                        }
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>
                        {isRu 
                          ? 'Рыночные колебания спроса на аренду'
                          : 'Market fluctuations in rental demand'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Fixed bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50 p-4 z-50">
          <InterestForm
            projectId={project.id}
            projectTitle={title}
            minInvestment={project.min_investment}
            currency={project.currency}
          />
        </div>

        {/* Exit Intent Modal */}
        <ExitIntentModal
          vertical="investment"
          projectId={project.id}
          projectTitle={title}
        />
      </div>
    </>
  );
}
