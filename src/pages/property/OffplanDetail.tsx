import { projectPublicDocumentUrl } from '@/lib/real-estate/projectPublicDocumentUrl';
import { projectEditorialImages, publicProjectMediaUrl } from '@/lib/real-estate/projectEditorialMedia';
import { useLocation as useJourneyLocation, useNavigate as useJourneyNavigate } from 'react-router-dom';
import { publicJourneyReturn, publicJourneyState } from '@/lib/real-estate/publicJourney';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { FLOATING_OFFSET } from '@/lib/nav/floatingStack';
import { publicNewbuildPresentation } from '@/lib/real-estate/publicNewbuildPresentation';
import { ProjectStartingPrice } from '@/components/newbuilds/ProjectStartingPrice';
import '@/styles/public-commerce.css';
import { projectFeatureLabel } from '@/lib/offplan/presentation';
import { OFFPLAN_BUYER_ENTRY } from '@/lib/consultationIntake';
/**
 * OffplanDetail - Detailed view of an off-plan project
 * Shows public gallery, units, documents and developer information
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, CheckCircle2, MessageCircle, ExternalLink, FileSearch, FileText, Download } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { SEOHead, createRealEstateListingSchema, createBreadcrumbSchema } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationCity } from '@/contexts/LocationContext';

import { useOffplanProject } from '@/hooks/useOffplanProjects';
import type { ProjectUnit } from '@/hooks/useProjectUnits';
import { useProjectDocuments, DOCUMENT_CATEGORIES } from '@/hooks/useProjectDocuments';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { useDeveloper } from '@/hooks/useDevelopers';
import { pickLang } from '@/lib/i18n/pickLang';
import { DevelopmentUnitsSection } from '@/components/property/DevelopmentUnitsSection';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';

const TAB_HASHES = {
  overview: '#project-overview',
  units: '#project-units',
  documents: '#project-documents',
  developer: '#project-developer',
} as const;
type ProjectTab = keyof typeof TAB_HASHES;

export default function OffplanDetail() {
  const { id } = useParams<{ id: string }>();
  const journeyLocation = useJourneyLocation();
  const journeyNavigate = useJourneyNavigate();
  const returnToCatalogue = () => { const plan = publicJourneyReturn(journeyLocation, '/property/offplan'); if ('delta' in plan) journeyNavigate(plan.delta); else journeyNavigate(plan.href, { replace: plan.replace, state: plan.state }); };
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currentCity } = useLocationCity();
  const isRu = language === 'ru';

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ projectId: string; url: string } | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);
  const [enquiryIntent, setEnquiryIntent] = useState<'consultation' | 'documents'>('consultation');
  useEffect(() => {
    setShowLeadForm(false);
    setSelectedUnit(null);
    setEnquiryIntent('consultation');
  }, [id]);
  const openProjectEnquiry = (intent: 'consultation' | 'documents' = 'consultation') => {
    setEnquiryIntent(intent);
    setSelectedUnit(null);
    setShowLeadForm(true);
  };
  const { data: sourceProject, isLoading, isError, refetch } = useOffplanProject(id);
  const project = sourceProject ? publicNewbuildPresentation(sourceProject) : null;
  const loadedProjectId = sourceProject?.id;
  const activeTab = (Object.keys(TAB_HASHES) as ProjectTab[])
    .find(key => TAB_HASHES[key] === journeyLocation.hash) ?? 'overview';
  const changeTab = (value: string) => {
    if (!Object.prototype.hasOwnProperty.call(TAB_HASHES, value)) return;
    journeyNavigate({ pathname: journeyLocation.pathname, search: journeyLocation.search, hash: TAB_HASHES[value as ProjectTab] },
      { replace: true, state: journeyLocation.state });
  };
  useEffect(() => {
    if (!loadedProjectId || journeyLocation.hash !== '#project-units') return;
    const frame = requestAnimationFrame(() => document.getElementById('project-units')?.scrollIntoView?.({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [loadedProjectId, journeyLocation.hash]);
  const { data: developer } = useDeveloper(project?.developerId || '');
  const { data: nbProject } = useNewbuildProject(id);
  const { data: allDocs = [], isLoading: docsLoading, isError: docsError, refetch: retryDocs } = useProjectDocuments(activeTab === 'documents' ? loadedProjectId : undefined, { publicOnly: true });
  const publicDocs = allDocs.flatMap(doc => {
    if (!loadedProjectId || doc.project_id !== loadedProjectId || !doc.is_current || doc.visibility !== 'public') return [];
    const url = projectPublicDocumentUrl(doc.file_url, { projectId: loadedProjectId, category: doc.category });
    return url ? [{ ...doc, file_url: url }] : [];
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4"><BackButton fallbackPath="/property/offplan" onClick={returnToCatalogue} />
        <Skeleton className="aspect-[16/9] rounded-none" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) return <div className="p-6 space-y-4"><BackButton fallbackPath="/property/offplan" onClick={returnToCatalogue} /><QueryRecovery onRetry={refetch} /></div>;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">
          {pickLang(language, {"ru": "Проект не найден", "en": "Project not found", "th": "ไม่พบโครงการ"})}
        </p>
        <Button variant="link" onClick={returnToCatalogue}>
          {pickLang(language, {"ru": "Вернуться к списку", "en": "Back to list", "th": "กลับไปยังรายการ"})}
        </Button>
      </div>
    );
  }

  const name = (isRu ? project.nameRu : project.nameEn) || project.nameEn || project.nameRu;

  const seoTitle = `${name}${project.district ? ` · ${project.district}` : ''}, Phuket`;
  const seoDescription = isRu
    ? `${name} — ${project.district || 'Пхукет'}. Начальная цена требует уточнения.`.trim()
    : `${name} — ${project.district || 'Phuket'}. Starting price requires confirmation.`.trim();
  const mediaProject = nbProject?.id === project.id ? nbProject : null;
  const gallery = projectEditorialImages({
    cover_image: mediaProject?.cover_image || project.coverImage,
    images: mediaProject?.images,
    gallery_urls: mediaProject?.gallery_urls,
  });
  const photo = selectedPhoto?.projectId === project.id && gallery.includes(selectedPhoto.url) ? selectedPhoto.url : gallery[0];
  const video = publicProjectMediaUrl(mediaProject?.video_url, 'video');
  const developerPricing = project.sourceUrl === 'https://www.sudaraphuket.com/pricing' ? project.sourceUrl : null;
  const hasSudaraRenderings = gallery.some(url => url.startsWith('/catalog/sudara/'));
  const description = (isRu ? mediaProject?.description_ru || mediaProject?.description_en
    : mediaProject?.description_en || mediaProject?.description_ru) || project.descriptionSummary;
  const photoLabel = (index: number) => pickLang(language, {
    ru: `Фото ${index + 1} из ${gallery.length}`, en: `Photo ${index + 1} of ${gallery.length}`, th: `รูปที่ ${index + 1} จาก ${gallery.length}`,
  });
  const seoImage = gallery[0] || 'https://www.myuno.app/og-image.png';
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
    { name: pickLang(language, {"ru": "Новостройки", "en": "Off-Plan", "th": "โครงการใหม่"}), url: 'https://www.myuno.app/property/offplan' },
    { name, url: canonicalUrl },
  ]);


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
      <div className="public-project-hero relative bg-muted">
        {photo ? (
          <img
            src={photo}
            alt={gallery.length > 1 ? `${name} · ${photoLabel(gallery.indexOf(photo))}` : name}
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
          <BackButton onClick={returnToCatalogue} fallbackPath={APP_ROUTES.OFFPLAN} variant="overlay" size="md" />

        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="public-commerce-title text-white mb-1">{name}</h1>
          {project.district && (
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{project.district}, Phuket</span>
            </div>
          )}
        </div>
      </div>

      <div className={`public-project-content space-y-8 ${FLOATING_OFFSET.contentClearance}`}>
        {(gallery.length > 1 || video?.startsWith('https:')) && (
          <section aria-label={pickLang(language, { ru: 'Фото и видео проекта', en: 'Project photos and video', th: 'รูปภาพและวิดีโอโครงการ' })} className="space-y-3">
            {gallery.length > 1 && <>
              <div className="flex gap-2 overflow-x-auto p-1">
                {gallery.map((url, index) => (
                  <Button key={url} type="button" variant={photo === url ? 'default' : 'outline'}
                    className="h-14 w-20 shrink-0 p-1" aria-pressed={photo === url} aria-label={photoLabel(index)}
                    onClick={() => setSelectedPhoto({ projectId: project.id, url })}>
                    <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </Button>
                ))}
              </div>
              <span className="sr-only" role="status">{photoLabel(gallery.indexOf(photo))}</span>
            </>}
            {video?.startsWith('https:') && <Button variant="outline" asChild>
              <a href={video} target="_blank" rel="noopener noreferrer">
                {pickLang(language, { ru: 'Видео проекта (новая вкладка)', en: 'Project video (opens in new tab)', th: 'วิดีโอโครงการ (เปิดในแท็บใหม่)' })}
              </a>
            </Button>}
            {hasSudaraRenderings && <p className="text-xs text-muted-foreground">{pickLang(language, {
              ru: 'В галерее показаны визуализации проекта от застройщика.',
              en: 'The gallery includes developer renderings of the project.',
              th: 'แกลเลอรีมีภาพจำลองโครงการจากผู้พัฒนา',
            })}</p>}
          </section>
        )}

        {/* Price & Units */}
        <div className="rounded-none border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {pickLang(language, {"ru": "Цена", "en": "Price", "th": "ราคา"})}
            </span>
            <span className="text-xl font-bold text-primary">
              <ProjectStartingPrice price={project.priceFrom} />
            </span>
          </div>
          <Button size="lg" className="w-full min-h-12 gap-2" onClick={() => openProjectEnquiry()}>
            <MessageCircle className="w-5 h-5" />
            {pickLang(language, { ru: 'Обсудить проект', en: 'Discuss this project', th: 'สอบถามโครงการนี้' })}
          </Button>
          <p className="text-sm text-muted-foreground">
            {pickLang(language, { ru: 'Цену, наличие и условия покупки уточнит команда myUNO. Запрос не бронирует объект.', en: 'The myUNO team will confirm price, availability and purchase terms. An enquiry does not reserve a unit.', th: 'ทีม myUNO จะยืนยันราคา ยูนิตว่าง และเงื่อนไขการซื้อ การสอบถามไม่ใช่การจองยูนิต' })}
          </p>
          {developerPricing && <a href={developerPricing} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">
            {pickLang(language, {
              ru: 'Прайс застройщика (новая вкладка)',
              en: 'Developer’s live pricing (opens in new tab)',
              th: 'ราคาล่าสุดจากผู้พัฒนา (เปิดในแท็บใหม่)',
            })}
          </a>}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger className="min-h-11 whitespace-normal" value="overview">{pickLang(language, {"ru": "Обзор", "en": "Overview", "th": "ภาพรวม"})}</TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal" value="units">
              {pickLang(language, { ru: 'Объекты и планы', en: 'Units and plans', th: 'ยูนิตและแปลน' })}
            </TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal" value="documents">
              {pickLang(language, {"ru": "Документы", "en": "Docs", "th": "เอกสาร"})}
              {publicDocs.length > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({publicDocs.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal" value="developer">{pickLang(language, {"ru": "Застройщик", "en": "Developer", "th": "ผู้พัฒนา"})}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div id="project-overview">
              {description && <p className="whitespace-pre-wrap text-sm leading-relaxed">{description}</p>}
            </div>
            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">{pickLang(language, {"ru": "Удобства", "en": "Amenities", "th": "สิ่งอำนวยความสะดวก"})}</h3>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((a, i) => (
                    <Badge key={i} variant="outline">{projectFeatureLabel(a, language)}</Badge>
                  ))}
                </div>
              </div>
            )}


          </TabsContent>

          <TabsContent value="units" className="pt-4">
            <div id="project-units" className="scroll-mt-28">
              <DevelopmentUnitsSection developmentId={project.id} onSelectUnit={(unit) => {
                setEnquiryIntent('consultation');
                setSelectedUnit(unit);
                setShowLeadForm(true);
              }} />
            </div>
          </TabsContent>

          <TabsContent value="documents" className="pt-4 space-y-4">
            {docsLoading ? <Skeleton className="h-24" /> : docsError ? <QueryRecovery onRetry={retryDocs} /> : publicDocs.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {isRu
                    ? 'Публичные документы проекта. Чтобы уточнить доступ к закрытым документам, обратитесь в myUNO.'
                    : 'Publicly disclosed project documents. Contact myUNO to ask about documents that require access.'}
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
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => openProjectEnquiry('documents')} className="min-h-11 gap-2">
              <FileSearch className="w-4 h-4" />
              {pickLang(language, { ru: 'Запросить пакет документов', en: 'Request document package', th: 'ขอเอกสารโครงการ' })}
            </Button>
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
                        {pickLang(language, {"ru": "Основано в", "en": "Founded in", "th": "ก่อตั้งเมื่อ"})} {developer.foundedYear}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-none bg-muted/50 p-3 text-center">
                    <div className="text-2xl font-bold">{developer.projectsCompleted}</div>
                    <div className="text-xs text-muted-foreground">{pickLang(language, {"ru": "Проектов", "en": "Projects", "th": "โครงการ"})}</div>
                  </div>

                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate(APP_ROUTES.DEVELOPER_DETAIL(developer.id), { state: publicJourneyState(journeyLocation) })}
                >
                  {pickLang(language, {"ru": "Все проекты застройщика", "en": "All Developer Projects", "th": "ดูโครงการทั้งหมดของผู้พัฒนา"})}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {pickLang(language, {"ru": "Информация о застройщике недоступна", "en": "Developer information not available", "th": "ยังไม่มีข้อมูลผู้พัฒนา"})}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lead Form — Sheet on mobile, Dialog on desktop */}
      <ResponsiveModal
        open={showLeadForm}
        onOpenChange={(open) => { setShowLeadForm(open); if (!open) { setSelectedUnit(null); setEnquiryIntent('consultation'); } }}
        title={pickLang(language, { ru: selectedUnit ? 'Запросить информацию о юните' : 'Обсудить проект', en: selectedUnit ? 'Ask about this unit' : 'Discuss this project', th: 'สอบถามเกี่ยวกับโครงการนี้' })}
        size="md"
      >
        <LandingLeadForm
          key={`${project.id}:${selectedUnit?.id ?? "project"}:${enquiryIntent}`}
          variant="universal"
          verticalId="properties"
          entryPoint={OFFPLAN_BUYER_ENTRY}
          leadSource="cta"
          universalRequestType="property_consultation"
          contextMetadata={{
            schema_version: 1,
            project_id: project.id,
            intent: enquiryIntent,
            request_only: true,
            offer_id: null,
            ...(selectedUnit ? { unit_id: selectedUnit.id, property_id: selectedUnit.property_id } : {}),
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
