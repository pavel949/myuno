import { FLOATING_OFFSET } from '@/lib/nav/floatingStack';
import { publicNewbuildPresentation } from '@/lib/real-estate/publicNewbuildPresentation';
import { ProjectStartingPrice } from '@/components/newbuilds/ProjectStartingPrice';
import '@/styles/public-commerce.css';
import { projectFeatureLabel } from '@/lib/offplan/presentation';
/**
 * OffplanDetail - Detailed view of an off-plan project
 * Shows gallery, developer info, myUNO scoring, investment metrics
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
  FileSearch,
  FileText,
  Download,
  Info
} from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { SEOHead, createRealEstateListingSchema, createBreadcrumbSchema } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLocation as useLocationCity } from '@/contexts/LocationContext';

import { useOffplanProject, type ProjectStatus } from '@/hooks/useOffplanProjects';
import { useProjectDocuments, DOCUMENT_CATEGORIES } from '@/hooks/useProjectDocuments';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { useDeveloper } from '@/hooks/useDevelopers';
import { NewbuildProjectDeepTabs } from '@/components/newbuilds/NewbuildProjectDeepTabs';
import { pickLang } from '@/lib/i18n/pickLang';
import { FundingProgress } from '@/components/invest/FundingProgress';
import { DeveloperBadge } from '@/components/property/DeveloperBadge';
import { DevelopmentUnitsSection } from '@/components/property/DevelopmentUnitsSection';
import { ClearViewReport } from '@/components/newbuilds/ClearViewReport';
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
  const { currentCity } = useLocationCity();
  const isRu = language === 'ru';
  const assessmentLabel = pickLang(language, { ru: 'Отчёт ClearView', en: 'ClearView report', th: 'รายงาน ClearView' });

  const [showLeadForm, setShowLeadForm] = useState(false);
  const { data: sourceProject, isLoading, isError, refetch } = useOffplanProject(id);
  const project = sourceProject ? publicNewbuildPresentation(sourceProject) : null;
  const { data: developer } = useDeveloper(project?.developerId || '');
  const { data: nbProject } = useNewbuildProject(id);
  const { data: allDocs = [] } = useProjectDocuments(id);
  const publicDocs = allDocs.filter((d) => d.visibility === 'public');

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="aspect-[16/9] rounded-none" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) return <div role="alert" className="p-6 space-y-4"><p>{pickLang(language, { ru: 'Не удалось загрузить проект.', en: 'Unable to load project.', th: 'โหลดโครงการไม่สำเร็จ' })}</p><Button onClick={() => void refetch()}>{pickLang(language, { ru: 'Попробовать ещё раз', en: 'Try again', th: 'ลองอีกครั้ง' })}</Button></div>;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">
          {isRu ? 'Проект не найден' : 'Project not found'}
        </p>
        <Button variant="link" onClick={() => navigate('/property/offplan')}>
          {isRu ? 'Вернуться к списку' : 'Back to list'}
        </Button>
      </div>
    );
  }

  const name = isRu ? project.nameRu : project.nameEn;
  const status = project.projectStatus ? STATUS_CONFIG[project.projectStatus] : null;
  const StatusIcon = status?.icon ?? Building2;

  const seoTitle = `${name}${project.district ? ` · ${project.district}` : ''}, Phuket`;
  const seoDescription = isRu
    ? `${name} — ${project.district || 'Пхукет'}. ${status ? status.label.ru + '.' : ''} Начальная цена требует уточнения.`.trim()
    : `${name} — ${project.district || 'Phuket'}. ${status ? status.label.en + '.' : ''} Starting price requires confirmation.`.trim();
  const seoImage = project.coverImage || 'https://www.myuno.app/og-image.png';
  const canonicalUrl = `https://www.myuno.app${APP_ROUTES.OFFPLAN_DETAIL(project.id)}`;
  const listingSchema = createRealEstateListingSchema({
    name,
    description: seoDescription,
    // Unconfirmed project starting prices are visible with a warning, not structured offers.
    currency: ((project as { currency?: string | null }).currency || currentCity?.default_currency || 'THB').toUpperCase(),
    image: seoImage,
    url: canonicalUrl,
    address: project.district ?? undefined,
  });
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Property', url: 'https://www.myuno.app/property' },
    { name: isRu ? 'Новостройки' : 'Off-Plan', url: 'https://www.myuno.app/property/offplan' },
    { name, url: canonicalUrl },
  ]);

  const formatCompletionDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    return `Q${quarter} ${d.getFullYear()}`;
  };

  return (
    <div className="public-commerce public-commerce--project">
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
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white" aria-label={isRu ? 'Поделиться' : 'Share'}>
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white" aria-label={isRu ? 'В избранное' : 'Save'}>
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-4 right-4">
          {status && <Badge className={cn("mb-2 gap-1", status.color)}>
            <StatusIcon className="w-3 h-3" />
            {isRu ? status.label.ru : status.label.en}
          </Badge>}
          <h1 className="public-commerce-title text-white mb-1">{name}</h1>
          {project.district && (
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{project.district}, Phuket</span>
            </div>
          )}
        </div>
      </div>

      <div className={`px-4 py-6 space-y-8 sm:px-6 ${FLOATING_OFFSET.contentClearance}`}>
        {/* Published report is the sole public assessment source. */}
        <div id="clearview-report" className="scroll-mt-24">
          <p className="text-sm text-muted-foreground">{isRu ? 'Условия проекта — по запросу.' : 'Project terms are available on request.'}</p>
        </div>

        {/* Price & Units */}
        <div className="rounded-none border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {isRu ? 'Цена' : 'Price'}
            </span>
            <span className="text-xl font-bold text-primary">
              <ProjectStartingPrice price={project.priceFrom} />
            </span>
          </div>
          <Button size="lg" className="w-full min-h-12 gap-2" onClick={() => setShowLeadForm(true)}>
            <MessageCircle className="w-5 h-5" />
            {pickLang(language, { ru: 'Обсудить проект', en: 'Discuss this project', th: 'สอบถามโครงการนี้' })}
          </Button>
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
          {project.unitsAvailable != null && project.unitsAvailable > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground">
                {isRu ? 'Доступно юнитов' : 'Units available'}
              </span>
              <Badge variant="secondary">
                {project.unitsAvailable}{project.unitsSold != null ? ` / ${project.unitsAvailable + project.unitsSold}` : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Construction Progress */}
        {project.projectStatus !== 'completed' && project.constructionProgress != null && (
          <div className="rounded-none border bg-card p-4 space-y-3">
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
        {project.investmentEnabled && project.fundingGoal && project.amountRaised != null && (
          <div className="rounded-none border bg-card p-4">
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
            <TabsTrigger value="documents">
              {isRu ? 'Документы' : 'Docs'}
              {publicDocs.length > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({publicDocs.length})</span>
              )}
            </TabsTrigger>
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
                    <Badge key={i} variant="outline">{projectFeatureLabel(a, language)}</Badge>
                  ))}
                </div>
              </div>
            )}


          </TabsContent>



          <TabsContent value="documents" className="pt-4 space-y-4">
            {publicDocs.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {isRu
                    ? 'Публичные документы проекта. Полный пакет (KYC/закрытые) — после запроса консультации.'
                    : 'Publicly disclosed project documents. Full package (KYC/restricted) is available after consultation request.'}
                </p>
                <div className="space-y-2">
                  {publicDocs.map((doc) => {
                    const cat = DOCUMENT_CATEGORIES.find((c) => c.value === doc.category);
                    return (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-none border bg-card p-3 hover:bg-accent/40 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat ? (isRu ? cat.label_ru : cat.label_en) : doc.category}
                            {doc.version > 1 && <span className="ml-2">v{doc.version}</span>}
                          </p>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </a>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground text-sm">
                  {isRu
                    ? 'Публичные документы пока не опубликованы.'
                    : 'No public documents have been published yet.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowLeadForm(true)} className="gap-2">
                  <FileSearch className="w-4 h-4" />
                  {isRu ? 'Запросить пакет документов' : 'Request document package'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="developer" className="pt-4">
            {developer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {developer.logoUrl ? (
                    <img src={developer.logoUrl} alt={developer.nameEn} className="w-16 h-16 rounded-none object-contain bg-muted" />
                  ) : (
                    <div className="w-16 h-16 rounded-none bg-muted flex items-center justify-center">
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
                  <div className="rounded-none bg-muted/50 p-3 text-center">
                    <div className="text-2xl font-bold">{developer.projectsCompleted}</div>
                    <div className="text-xs text-muted-foreground">{isRu ? 'Проектов' : 'Projects'}</div>
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
            className="rounded-none border overflow-hidden bg-card"
            aria-label={isRu ? 'Расширенные данные проекта' : 'Extended project data'}
          >
            <NewbuildProjectDeepTabs project={nbProject} variant="embedded" />
          </section>
        )}
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
    </div>
  );
}
