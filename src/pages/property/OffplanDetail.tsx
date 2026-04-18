/**
 * OffplanDetail - Detailed view of an off-plan project
 * Shows gallery, developer info, muUNO scoring, investment metrics
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Users,
  CheckCircle2,
  HardHat,
  ChevronLeft,
  Share2,
  Heart,
  Phone,
  MessageCircle,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileSearch
} from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { SEOHead, createRealEstateListingSchema, createBreadcrumbSchema } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useOffplanProjects, type ProjectStatus } from '@/hooks/useOffplanProjects';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { useDeveloper } from '@/hooks/useDevelopers';
import { NewbuildProjectDeepTabs } from '@/components/newbuilds/NewbuildProjectDeepTabs';
import { MuunoScoreWidget, ScoreBreakdown } from '@/components/invest';
import { FundingProgress } from '@/components/invest/FundingProgress';
import { DeveloperBadge } from '@/components/property/DeveloperBadge';
import { DevelopmentUnitsSection } from '@/components/property/DevelopmentUnitsSection';
import { UniversalLeadForm } from '@/components/leads/UniversalLeadForm';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ProjectStatus, { 
  label: { en: string; ru: string }; 
  icon: React.ElementType;
  color: string;
}> = {
  offplan: {
    label: { en: 'Off-Plan', ru: 'Новостройка' },
    icon: Building2,
    color: 'bg-info/10 text-info',
  },
  under_construction: {
    label: { en: 'Under Construction', ru: 'Строится' },
    icon: HardHat,
    color: 'bg-warning/10 text-warning',
  },
  completed: {
    label: { en: 'Completed', ru: 'Готово' },
    icon: CheckCircle2,
    color: 'bg-success/10 text-success',
  },
};

export default function OffplanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const [showLeadForm, setShowLeadForm] = useState(false);
  const { data: projects, isLoading } = useOffplanProjects();
  const project = projects?.find(p => p.id === id);
  const { data: developer } = useDeveloper(project?.developerId || '');
  const { data: nbProject } = useNewbuildProject(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 p-4">
          <Skeleton className="aspect-[16/9] rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title={isRu ? 'Не найдено' : 'Not Found'}>
        <div className="flex flex-col items-center justify-center py-20">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {isRu ? 'Проект не найден' : 'Project not found'}
          </p>
          <Button variant="link" onClick={() => navigate('/property/offplan')}>
            {isRu ? 'Вернуться к списку' : 'Back to list'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const name = isRu ? project.nameRu : project.nameEn;
  const status = STATUS_CONFIG[project.projectStatus];
  const StatusIcon = status.icon;

  const seoTitle = `${name}${project.district ? ` · ${project.district}` : ''}, Phuket`;
  const seoDescription = isRu
    ? `${name} — ${project.district || 'Пхукет'}. ${status.label.ru}. ${project.priceFrom ? `Цена от ${formatPrice(project.priceFrom)}.` : ''} ${project.roiProjected ? `ROI ${project.roiProjected}%.` : ''} muUNO Score, due diligence, инвестиционная аналитика.`.trim()
    : `${name} — ${project.district || 'Phuket'}. ${status.label.en}. ${project.priceFrom ? `From ${formatPrice(project.priceFrom)}.` : ''} ${project.roiProjected ? `${project.roiProjected}% projected ROI.` : ''} muUNO Score, due diligence, investment analytics.`.trim();
  const seoImage = project.coverImage || 'https://myuno.app/og-image.png';
  const canonicalUrl = `https://myuno.app${APP_ROUTES.OFFPLAN_DETAIL(project.id)}`;
  const listingSchema = createRealEstateListingSchema({
    name,
    description: seoDescription,
    price: project.priceFrom ?? undefined,
    currency: 'THB',
    image: seoImage,
    url: canonicalUrl,
    address: project.district ?? undefined,
  });
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Property', url: 'https://myuno.app/property' },
    { name: isRu ? 'Новостройки' : 'Off-Plan', url: 'https://myuno.app/property/offplan' },
    { name, url: canonicalUrl },
  ]);

  const formatCompletionDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    return `Q${quarter} ${d.getFullYear()}`;
  };

  return (
    <AppLayout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={canonicalUrl}
        type="product"
        jsonLd={{ '@context': 'https://schema.org', '@graph': [listingSchema, breadcrumbSchema] }}
      />
      {/* Hero Image */}
      <div className="relative aspect-[16/10] bg-muted">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-20 h-20 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Top actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <BackButton fallbackPath={APP_ROUTES.OFFPLAN} variant="overlay" size="md" />
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className={cn("mb-2 gap-1", status.color)}>
            <StatusIcon className="w-3 h-3" />
            {isRu ? status.label.ru : status.label.en}
          </Badge>
          <h1 className="text-2xl font-bold text-white mb-1">{name}</h1>
          {project.district && (
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{project.district}, Phuket</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 pb-32 space-y-6">
        {/* Key metrics cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* muUNO Score */}
          {project.muunoScore && (
            <div className="rounded-xl border bg-card p-3">
              <MuunoScoreWidget score={project.muunoScore} size="md" showLabel />
            </div>
          )}

          {/* ROI */}
          {project.roiProjected && (
            <div className="rounded-xl border bg-card p-3 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-success mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">{project.roiProjected}%</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Прогнозируемый ROI' : 'Projected ROI'}
              </span>
            </div>
          )}
        </div>

        {/* Price & Units */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {isRu ? 'Цена от' : 'Price from'}
            </span>
            <span className="text-xl font-bold text-primary">
              {project.priceFrom ? formatPrice(project.priceFrom) : '—'}
            </span>
          </div>
          {project.minInvestment && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {isRu ? 'Мин. инвестиция' : 'Min. investment'}
              </span>
              <span className="font-semibold">
                {formatPrice(project.minInvestment)}
              </span>
            </div>
          )}
          {project.unitsAvailable > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground">
                {isRu ? 'Доступно юнитов' : 'Units available'}
              </span>
              <Badge variant="secondary">
                {project.unitsAvailable} / {project.unitsAvailable + project.unitsSold}
              </Badge>
            </div>
          )}
        </div>

        {/* Construction Progress */}
        {project.projectStatus !== 'completed' && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {isRu ? 'Прогресс строительства' : 'Construction Progress'}
              </span>
              <span className="text-lg font-bold">{project.constructionProgress}%</span>
            </div>
            <Progress value={project.constructionProgress} className="h-2" />
            {project.completionDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {isRu ? 'Ожидаемая сдача:' : 'Expected completion:'}{' '}
                  {formatCompletionDate(project.completionDate)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Investment Funding Progress */}
        {project.investmentEnabled && project.fundingGoal && (
          <div className="rounded-xl border bg-card p-4">
            <FundingProgress
              amountRaised={project.amountRaised}
              fundingGoal={project.fundingGoal}
              investorsCount={0}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="scoring">{isRu ? 'Скоринг' : 'Scoring'}</TabsTrigger>
            <TabsTrigger value="developer">{isRu ? 'Застройщик' : 'Developer'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            {/* Development Units / Floor Plans */}
            {id && <DevelopmentUnitsSection developmentId={id} />}

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">{isRu ? 'Удобства' : 'Amenities'}</h3>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((a, i) => (
                    <Badge key={i} variant="outline">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Due Diligence Status Block */}
            <div className={cn(
              "rounded-xl p-4 space-y-3 border",
              project.riskLevel 
                ? "bg-success/5 border-success/20" 
                : "bg-warning/5 border-warning/20"
            )}>
              <div className="flex items-start gap-3">
                {project.riskLevel ? (
                  <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {project.riskLevel 
                      ? (isRu ? 'Due Diligence пройден' : 'Due Diligence Complete')
                      : (isRu ? 'Due Diligence не проведён' : 'Due Diligence Pending')
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.riskLevel 
                      ? (isRu 
                          ? 'Проект прошёл независимую экспертизу muUNO. Получите персональный отчёт с детальной оценкой рисков.' 
                          : 'Project has passed independent muUNO assessment. Get a personalized report with detailed risk analysis.')
                      : (isRu 
                          ? 'Этот проект ещё не прошёл независимую экспертизу. Запросите оценку рисков, чтобы принять взвешенное решение.'
                          : 'This project has not yet been independently assessed. Request a risk evaluation to make an informed decision.')
                    }
                  </p>
                </div>
              </div>
              <Button 
                className="w-full gap-2" 
                variant={project.riskLevel ? "outline" : "default"}
                onClick={() => setShowLeadForm(true)}
              >
                <FileSearch className="w-4 h-4" />
                {project.riskLevel
                  ? (isRu ? 'Получить полный отчёт' : 'Get Full Report')
                  : (isRu ? 'Запросить оценку рисков' : 'Request Risk Assessment')
                }
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scoring" className="pt-4">
            {project.muunoScore ? (
              <div className="space-y-4">
                <ScoreBreakdown
                  scoreBreakdown={{
                    location: 80,
                    developer: 85,
                    financial: 75,
                    market: 78,
                  }}
                  projectType="real_estate_offplan"
                />
                <Button 
                  className="w-full gap-2" 
                  variant="outline"
                  onClick={() => setShowLeadForm(true)}
                >
                  <FileSearch className="w-4 h-4" />
                  {isRu ? 'Получить детальный анализ' : 'Get Detailed Analysis'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">
                  {isRu ? 'Скоринг ещё не проведён' : 'Scoring not yet available'}
                </p>
                <Button onClick={() => setShowLeadForm(true)} className="gap-2">
                  <FileSearch className="w-4 h-4" />
                  {isRu ? 'Запросить оценку' : 'Request Assessment'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="developer" className="pt-4">
            {developer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {developer.logoUrl ? (
                    <img src={developer.logoUrl} alt={developer.nameEn} className="w-16 h-16 rounded-xl object-contain bg-muted" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {isRu ? developer.nameRu : developer.nameEn}
                      {developer.isVerified && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </h3>
                    {developer.foundedYear && (
                      <p className="text-sm text-muted-foreground">
                        {isRu ? 'Основано в' : 'Founded in'} {developer.foundedYear}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-2xl font-bold">{developer.projectsCompleted}</div>
                    <div className="text-xs text-muted-foreground">{isRu ? 'Проектов' : 'Projects'}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-2xl font-bold">{developer.muunoScore || '—'}</div>
                    <div className="text-xs text-muted-foreground">muUNO Score</div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate(APP_ROUTES.DEVELOPER_DETAIL(developer.id))}
                >
                  {isRu ? 'Все проекты застройщика' : 'All Developer Projects'}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isRu ? 'Информация о застройщике недоступна' : 'Developer information not available'}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {nbProject && (
          <section
            className="rounded-2xl border overflow-hidden bg-card"
            aria-label={isRu ? 'Расширенные данные проекта' : 'Extended project data'}
          >
            <NewbuildProjectDeepTabs project={nbProject} variant="embedded" />
          </section>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={() => setShowLeadForm(true)}>
            <FileSearch className="w-5 h-5" />
            {isRu ? 'Оценка рисков' : 'Risk Report'}
          </Button>
          <Button size="lg" className="flex-1 gap-2" onClick={() => setShowLeadForm(true)}>
            <MessageCircle className="w-5 h-5" />
            {isRu ? 'Консультация' : 'Consultation'}
          </Button>
        </div>
      </div>

      {/* Lead Form — Sheet on mobile, Dialog on desktop */}
      <ResponsiveModal
        open={showLeadForm}
        onOpenChange={setShowLeadForm}
        title={isRu ? 'Оценка рисков и консультация' : 'Risk Assessment & Consultation'}
        size="md"
      >
        <UniversalLeadForm
          verticalId="property"
          entryPoint={`offplan_risk_assessment_${project.id}`}
          leadSource="risk_assessment"
          onSuccess={() => setShowLeadForm(false)}
        />
      </ResponsiveModal>
    </AppLayout>
  );
}
