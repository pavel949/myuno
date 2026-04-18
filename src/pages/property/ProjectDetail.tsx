/**
 * ProjectDetail - Full page showcase for a residential complex
 * Hero media, amenities, available units, location
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Building2, MapPin, Calendar, Users, 
  Info
} from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePropertyProject } from '@/hooks/usePropertyProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { ProjectHeroMedia } from '@/components/property/ProjectHeroMedia';
import { ProjectAmenitiesGrid } from '@/components/property/ProjectAmenitiesGrid';
import { ProjectUnitsSection } from '@/components/property/ProjectUnitsSection';
import { ProjectGalleryModal } from '@/components/property/ProjectGalleryModal';
import { PropertyLocationMap } from '@/components/property/PropertyLocationMap';
import { cn } from '@/lib/utils';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: project, isLoading, error } = usePropertyProject(id);
  const [galleryOpen, setGalleryOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState branded />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-semibold mb-2">
          {isRu ? 'Комплекс не найден' : 'Complex not found'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/property/projects')}>
          {isRu ? 'К каталогу комплексов' : 'Back to complexes'}
        </Button>
      </div>
    );
  }

  const name = isRu ? project.name_ru : project.name_en;
  const description = isRu ? project.description_ru : project.description_en;
  const allImages = [
    ...(project.cover_image ? [project.cover_image] : []),
    ...(project.images || []),
  ].filter((img, idx, arr) => arr.indexOf(img) === idx);

  return (
    <>
      <Helmet>
        <title>{name} | myUNO</title>
        <meta 
          name="description" 
          content={description || `${name} - residential complex in Phuket`} 
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath={APP_ROUTES.COMPLEXES} variant="ghost" />
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{name}</h1>
              {project.district && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {project.district}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          <div className="lg:grid lg:grid-cols-[1fr,minmax(260px,300px)] xl:grid-cols-[1fr,minmax(280px,320px)] lg:gap-10 xl:gap-12 lg:items-start">
            <div className="min-w-0">
          {/* Hero Media */}
          <section className="px-4 pt-4">
            <ProjectHeroMedia
              videoUrl={project.video_url}
              coverImage={project.cover_image}
              images={project.images}
              projectName={name}
              onGalleryOpen={() => setGalleryOpen(true)}
            />
          </section>

          {/* Project Info */}
          <section className="px-4 py-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {project.district && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.district}
                  </Badge>
                )}
                {project.year_built && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {project.year_built}
                  </Badge>
                )}
                {project.total_units && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {project.total_units} {isRu ? 'юнитов' : 'units'}
                  </Badge>
                )}
                {project.developer_name && (
                  <Badge variant="outline">
                    {project.developer_name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}
          </section>

          <Separator className="mx-4" />

          {/* Amenities */}
          {project.amenities && project.amenities.length > 0 && (
            <section className="px-4 py-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                {isRu ? 'Удобства комплекса' : 'Complex Amenities'}
              </h3>
              <ProjectAmenitiesGrid 
                amenities={project.amenities} 
                showAll 
              />
            </section>
          )}

          <Separator className="mx-4" />

          {/* Available Units */}
          <section className="py-6">
            <ProjectUnitsSection
              projectId={project.id}
              projectName={name}
            />
          </section>

          {/* Infrastructure */}
          {project.infrastructure && project.infrastructure.length > 0 && (
            <>
              <Separator className="mx-4" />
              <section className="px-4 py-6">
                <h3 className="text-lg font-semibold mb-4">
                  {isRu ? 'Инфраструктура рядом' : 'Nearby Infrastructure'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.infrastructure.map((item, idx) => (
                    <Badge key={idx} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Location Map */}
          {project.lat && project.lng && (
            <>
              <Separator className="mx-4" />
              <section className="px-4 py-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {isRu ? 'Расположение' : 'Location'}
                </h3>
                <PropertyLocationMap
                  lat={project.lat}
                  lng={project.lng}
                  district={project.district}
                  address={project.address ?? undefined}
                  showHeading={false}
                />
              </section>
            </>
          )}

          {/* CTA — mobile only; desktop uses sticky aside */}
          <section className="px-4 py-6 lg:hidden">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate(`${APP_ROUTES.PROPERTY_BROWSE}?project=${encodeURIComponent(project.id)}`)}
            >
              {isRu ? 'Смотреть все объекты в комплексе' : 'View all units in complex'}
            </Button>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link to={APP_ROUTES.SUPPORT}>
                {isRu ? 'Связаться с myUNO' : 'Contact myUNO'}
              </Link>
            </Button>
          </section>
            </div>

            {/* Sticky conversion column (desktop) */}
            <aside
              className={cn(
                'hidden lg:flex flex-col gap-3 w-full',
                'lg:sticky lg:top-20 xl:top-24 lg:self-start lg:z-10',
                'lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1',
                'xl:pr-0'
              )}
            >
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`${APP_ROUTES.PROPERTY_BROWSE}?project=${encodeURIComponent(project.id)}`)}
                >
                  {isRu ? 'Объекты в комплексе' : 'Units in this complex'}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={APP_ROUTES.SUPPORT}>
                    {isRu ? 'Связаться с myUNO' : 'Contact myUNO'}
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground leading-snug">
                  {isRu
                    ? 'Консьерж myUNO поможет с подбором, бронированием и вопросами по комплексу.'
                    : 'myUNO concierge can help with selection, booking, and questions about this complex.'}
                </p>
              </div>
            </aside>
          </div>
        </main>

        {/* Gallery Modal */}
        <ProjectGalleryModal
          images={allImages}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          projectName={name}
        />

      </div>
    </>
  );
}
